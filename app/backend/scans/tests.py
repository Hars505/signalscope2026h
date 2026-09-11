import io
from PIL import Image
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Scan


def create_test_image(format="JPEG", size=(100, 100), color="blue"):
    """Helper creating an in-memory image for upload testing."""
    img_byte_arr = io.BytesIO()
    image = Image.new("RGB", size, color=color)
    image.save(img_byte_arr, format=format)
    img_byte_arr.seek(0)
    extension = "jpg" if format == "JPEG" else "png"
    return SimpleUploadedFile(
        f"test_image.{extension}",
        img_byte_arr.read(),
        content_type=f"image/{'jpeg' if format == 'JPEG' else 'png'}",
    )


class ScanEndpointTests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username="user1", email="user1@example.com", password="password123"
        )
        self.user2 = User.objects.create_user(
            username="user2", email="user2@example.com", password="password123"
        )
        self.scan_url = "/api/scan/"
        self.history_url = "/api/history/"

    def test_guest_scan_success(self):
        """POST /api/scan/ without auth succeeds (guest mode)."""
        image = create_test_image()
        response = self.client.post(self.scan_url, {"image": image}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("id", response.data)
        self.assertEqual(response.data["label"], "ai_generated")
        self.assertAlmostEqual(response.data["confidence"], 0.85)
        self.assertIn("explanation", response.data)

        # Check DB persistence with user=None
        scan = Scan.objects.get(id=response.data["id"])
        self.assertIsNone(scan.user)

    def test_authenticated_scan_success(self):
        """POST /api/scan/ with auth saves scan to authenticated user."""
        self.client.force_authenticate(user=self.user1)
        image = create_test_image()
        response = self.client.post(
            self.scan_url,
            {"image": image, "caption": "test product image"},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        scan = Scan.objects.get(id=response.data["id"])
        self.assertEqual(scan.user, self.user1)

    def test_history_requires_auth(self):
        """GET /api/history/ rejects unauthenticated requests."""
        response = self.client.get(self.history_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_history_lists_only_user_scans(self):
        """GET /api/history/ returns only current user's scans."""
        image = create_test_image()
        scan1 = Scan.objects.create(
            user=self.user1,
            image=image,
            label="real",
            confidence=0.92,
            threshold_used=0.5,
        )
        Scan.objects.create(
            user=self.user2,
            image=image,
            label="ai_generated",
            confidence=0.88,
            threshold_used=0.5,
        )

        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.history_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Handles both paginated and non-paginated structure
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], scan1.id)

    def test_detail_view_owner_and_cross_user_isolation(self):
        """GET /api/history/<pk>/ succeeds for owner, returns 404 for another user."""
        image = create_test_image()
        scan1 = Scan.objects.create(
            user=self.user1,
            image=image,
            label="real",
            confidence=0.92,
            threshold_used=0.5,
            explanation_text=["Natural lighting"],
        )

        # Owner gets 200
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(f"/api/history/{scan1.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], scan1.id)
        self.assertEqual(response.data["explanation"], ["Natural lighting"])

        # Another user gets 404
        self.client.force_authenticate(user=self.user2)
        response_other = self.client.get(f"/api/history/{scan1.id}/")
        self.assertEqual(response_other.status_code, status.HTTP_404_NOT_FOUND)

    def test_invalid_file_type_rejected(self):
        """POST /api/scan/ rejects non-image files."""
        fake_file = SimpleUploadedFile(
            "test.txt", b"plain text not an image", content_type="text/plain"
        )
        response = self.client.post(self.scan_url, {"image": fake_file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_corrupted_image_extension_rejected(self):
        """POST /api/scan/ rejects fake jpg with invalid byte content."""
        fake_jpg = SimpleUploadedFile(
            "bad.jpg", b"fake binary header that fails PIL verify", content_type="image/jpeg"
        )
        response = self.client.post(self.scan_url, {"image": fake_jpg}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_oversized_file_rejected(self):
        """POST /api/scan/ rejects files exceeding 10MB."""
        # Create an oversized payload > 10MB
        oversized_data = b"0" * (10 * 1024 * 1024 + 1024)
        oversized_file = SimpleUploadedFile(
            "large.jpg", oversized_data, content_type="image/jpeg"
        )
        response = self.client.post(
            self.scan_url, {"image": oversized_file}, format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_txt_renamed_to_jpg_rejected(self):
        """POST /api/scan/ rejects a text file disguised with a .jpg extension."""
        renamed_file = SimpleUploadedFile(
            "not_an_image.jpg",
            b"This is purely plain text content inside a file ending with .jpg",
            content_type="image/jpeg",
        )
        response = self.client.post(
            self.scan_url, {"image": renamed_file}, format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("File is not a valid image", str(response.data))


class EndToEndFlowTests(APITestCase):
    """
    Task 3.2: Complete end-to-end integration tests:
    1. Signup -> Token -> Scan -> History -> Detail
    2. Guest scan -> result returned -> not in user history
    3. Django admin reflects scans and per-user scan counts
    """

    def setUp(self):
        self.signup_url = "/api/auth/signup/"
        self.scan_url = "/api/scan/"
        self.history_url = "/api/history/"

    def test_full_auth_and_scan_lifecycle(self):
        # 1. Signup
        signup_data = {
            "username": "e2e_user",
            "email": "e2e@example.com",
            "password": "StrongPassword123!",
            "password_confirm": "StrongPassword123!",
        }
        signup_resp = self.client.post(self.signup_url, signup_data)
        self.assertEqual(signup_resp.status_code, status.HTTP_201_CREATED)
        access_token = signup_resp.data["tokens"]["access"]
        self.assertTrue(bool(access_token))

        # 2. Upload scan with JWT token
        auth_header = f"Bearer {access_token}"
        image = create_test_image(format="JPEG")
        scan_resp = self.client.post(
            self.scan_url,
            {"image": image, "caption": "E2E authenticity check"},
            format="multipart",
            HTTP_AUTHORIZATION=auth_header,
        )
        self.assertEqual(scan_resp.status_code, status.HTTP_201_CREATED)
        scan_id = scan_resp.data["id"]
        self.assertIn("label", scan_resp.data)
        self.assertIn("confidence", scan_resp.data)

        # 3. View in History
        history_resp = self.client.get(
            self.history_url, HTTP_AUTHORIZATION=auth_header
        )
        self.assertEqual(history_resp.status_code, status.HTTP_200_OK)
        results = history_resp.data.get("results", history_resp.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], scan_id)

        # 4. View Detail
        detail_resp = self.client.get(
            f"/api/history/{scan_id}/", HTTP_AUTHORIZATION=auth_header
        )
        self.assertEqual(detail_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_resp.data["id"], scan_id)
        self.assertEqual(detail_resp.data["label"], scan_resp.data["label"])
        self.assertEqual(detail_resp.data["explanation"], scan_resp.data["explanation"])

    def test_guest_scan_lifecycle(self):
        # Guest scans without credentials
        image = create_test_image(format="PNG")
        scan_resp = self.client.post(self.scan_url, {"image": image}, format="multipart")
        self.assertEqual(scan_resp.status_code, status.HTTP_201_CREATED)
        self.assertIn("id", scan_resp.data)
        self.assertIn("confidence", scan_resp.data)

        # History is inaccessible to guest
        history_resp = self.client.get(self.history_url)
        self.assertEqual(history_resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_displays_scans_and_user_counts(self):
        # Setup superuser
        admin_user = User.objects.create_superuser(
            username="admin_user",
            email="admin@example.com",
            password="AdminPassword123!",
        )
        regular_user = User.objects.create_user(
            username="regular_user",
            email="regular@example.com",
            password="UserPassword123!",
        )

        # Create 2 scans for regular_user and 1 guest scan
        img = create_test_image()
        Scan.objects.create(
            user=regular_user,
            image=img,
            label="real",
            confidence=0.9,
            threshold_used=0.5,
        )
        Scan.objects.create(
            user=regular_user,
            image=img,
            label="ai_generated",
            confidence=0.8,
            threshold_used=0.5,
        )
        Scan.objects.create(
            user=None,
            image=img,
            label="real",
            confidence=0.7,
            threshold_used=0.5,
        )

        # Verify admin scan_count method
        from django.contrib.admin.sites import site
        from scans.admin import CustomUserAdmin
        custom_user_admin = CustomUserAdmin(User, site)
        self.assertEqual(custom_user_admin.scan_count(regular_user), 2)
        self.assertEqual(custom_user_admin.scan_count(admin_user), 0)

        # Test admin UI pages load with 200
        self.client.force_login(admin_user)
        scans_admin_resp = self.client.get("/admin/scans/scan/")
        self.assertEqual(scans_admin_resp.status_code, status.HTTP_200_OK)
        users_admin_resp = self.client.get("/admin/auth/user/")
        self.assertEqual(users_admin_resp.status_code, status.HTTP_200_OK)


class ErrorHandlerConsistencyTests(APITestCase):
    """
    Task 3.3: Verify error response consistency:
    Format: {"error": "...", "code": "..."}
    Covers: 400 (validation), 401 (not authenticated), 404 (not found), 500 (model failure)
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username="err_user", email="err@example.com", password="Password123!"
        )

    def test_400_validation_error_format(self):
        fake_file = SimpleUploadedFile(
            "fake.txt", b"plain text", content_type="text/plain"
        )
        resp = self.client.post(
            "/api/scan/", {"image": fake_file}, format="multipart"
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", resp.data)
        self.assertIn("code", resp.data)
        self.assertEqual(resp.data["code"], "VALIDATION_ERROR")

    def test_401_unauthenticated_error_format(self):
        resp = self.client.get("/api/history/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("error", resp.data)
        self.assertIn("code", resp.data)
        self.assertEqual(resp.data["code"], "NOT_AUTHENTICATED")

    def test_404_not_found_error_format(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.get("/api/history/999999/")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("error", resp.data)
        self.assertIn("code", resp.data)
        self.assertEqual(resp.data["code"], "NOT_FOUND")

    def test_500_model_failure_error_format(self):
        from unittest.mock import patch
        with patch("scans.views.run_prediction", side_effect=RuntimeError("Weights missing")):
            img = create_test_image()
            resp = self.client.post("/api/scan/", {"image": img}, format="multipart")
            self.assertEqual(resp.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
            self.assertIn("error", resp.data)
            self.assertIn("code", resp.data)
            self.assertEqual(resp.data["code"], "INFERENCE_ERROR")




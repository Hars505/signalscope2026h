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


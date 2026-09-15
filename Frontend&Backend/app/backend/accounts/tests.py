import io
from PIL import Image
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.exceptions import ValidationError

from scans.models import Scan
from scans.validators import validate_image_file


class AuthEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.signup_url = '/api/auth/signup/'
        self.login_url = '/api/auth/login/'
        self.logout_url = '/api/auth/logout/'
        self.me_url = '/api/auth/me/'
        self.refresh_url = '/api/auth/token/refresh/'

    def test_signup_success(self):
        data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'SecurePassword123!',
            'password_confirm': 'SecurePassword123!'
        }
        res = self.client.post(self.signup_url, data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('user', res.data)
        self.assertIn('tokens', res.data)
        self.assertIn('access', res.data['tokens'])
        self.assertIn('refresh', res.data['tokens'])
        self.assertEqual(res.data['user']['username'], 'testuser')
        self.assertEqual(res.data['user']['email'], 'test@example.com')

    def test_signup_duplicate_email(self):
        User.objects.create_user(username='existing', email='duplicate@example.com', password='Password123!')
        data = {
            'username': 'newuser',
            'email': 'duplicate@example.com',
            'password': 'SecurePassword123!',
            'password_confirm': 'SecurePassword123!'
        }
        res = self.client.post(self.signup_url, data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_signup_password_mismatch(self):
        data = {
            'username': 'mismatchuser',
            'email': 'mismatch@example.com',
            'password': 'SecurePassword123!',
            'password_confirm': 'DifferentPassword123!'
        }
        res = self.client.post(self.signup_url, data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_with_username_success(self):
        User.objects.create_user(username='loginuser', email='login@example.com', password='SecurePassword123!')
        res = self.client.post(self.login_url, {'email': 'loginuser', 'password': 'SecurePassword123!'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', res.data)
        self.assertEqual(res.data['user']['username'], 'loginuser')

    def test_login_with_email_success(self):
        User.objects.create_user(username='emailuser', email='user@domain.com', password='SecurePassword123!')
        res = self.client.post(self.login_url, {'email': 'user@domain.com', 'password': 'SecurePassword123!'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', res.data)

    def test_login_invalid_password(self):
        User.objects.create_user(username='user1', email='user1@example.com', password='SecurePassword123!')
        res = self.client.post(self.login_url, {'email': 'user1', 'password': 'WrongPassword'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_me_authenticated(self):
        user = User.objects.create_user(username='meuser', email='me@example.com', password='SecurePassword123!')
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        res = self.client.get(self.me_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['username'], 'meuser')

    def test_me_unauthenticated(self):
        res = self.client.get(self.me_url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_blacklists_token(self):
        user = User.objects.create_user(username='logoutuser', email='logout@example.com', password='SecurePassword123!')
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        res = self.client.post(self.logout_url, {'refresh': str(refresh)})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Refresh with blacklisted token should fail
        refresh_res = self.client.post(self.refresh_url, {'refresh': str(refresh)})
        self.assertEqual(refresh_res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_refresh(self):
        user = User.objects.create_user(username='refuser', email='ref@example.com', password='SecurePassword123!')
        refresh = RefreshToken.for_user(user)
        res = self.client.post(self.refresh_url, {'refresh': str(refresh)})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)


class ValidatorAndAdminTests(TestCase):
    def test_validator_valid_image(self):
        file_obj = io.BytesIO()
        img = Image.new('RGB', (100, 100), color='blue')
        img.save(file_obj, format='JPEG')
        file_obj.seek(0)
        uploaded = SimpleUploadedFile("test.jpg", file_obj.read(), content_type="image/jpeg")
        # Should not raise exception
        validate_image_file(uploaded)

    def test_validator_invalid_mime(self):
        uploaded = SimpleUploadedFile("test.txt", b"plain text", content_type="text/plain")
        with self.assertRaises(ValidationError):
            validate_image_file(uploaded)

    def test_validator_fake_image(self):
        uploaded = SimpleUploadedFile("fake.jpg", b"fake binary content", content_type="image/jpeg")
        with self.assertRaises(ValidationError):
            validate_image_file(uploaded)

    def test_user_scan_count_admin(self):
        from django.contrib.admin.sites import site
        user = User.objects.create_user(username='adminuser', email='admin@example.com', password='Password123!')
        Scan.objects.create(user=user, image='scans/dummy.jpg', label='real', confidence=0.9, threshold_used=0.5)
        Scan.objects.create(user=user, image='scans/dummy2.jpg', label='ai_generated', confidence=0.8, threshold_used=0.5)

        custom_user_admin = site._registry[User]
        self.assertEqual(custom_user_admin.scan_count(user), 2)

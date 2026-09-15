"""
Auth views for SignalScope.
B2-3: Signup, Login, Logout, UserProfile.
"""

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import SignupSerializer, LoginSerializer, UserProfileSerializer, LogoutSerializer
from config.api_schemas import signup_schema, login_schema, logout_schema, profile_schema


def get_tokens_for_user(user):
    """Generate JWT access + refresh tokens for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


@signup_schema
class SignupView(GenericAPIView):
    """
    POST /api/auth/signup/
    Create account and return user info + JWT tokens (auto-login).
    """
    serializer_class = SignupSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
            },
            'tokens': get_tokens_for_user(user),
        }, status=status.HTTP_201_CREATED)


@login_schema
class LoginView(GenericAPIView):
    """
    POST /api/auth/login/
    Authenticate with email/username + password, return JWT tokens.
    """
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
            },
            'tokens': get_tokens_for_user(user),
        }, status=status.HTTP_200_OK)


@logout_schema
class LogoutView(GenericAPIView):
    """
    POST /api/auth/logout/
    Blacklist the refresh token to invalidate the session.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = LogoutSerializer

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'error': 'Refresh token is required.', 'code': 'REFRESH_TOKEN_REQUIRED'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {'detail': 'Successfully logged out.'},
                status=status.HTTP_200_OK,
            )
        except Exception:
            return Response(
                {'error': 'Invalid or already blacklisted token.', 'code': 'INVALID_TOKEN'},
                status=status.HTTP_400_BAD_REQUEST,
            )


@profile_schema
class UserProfileView(GenericAPIView):
    """
    GET /api/auth/me/
    Return current authenticated user's profile.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

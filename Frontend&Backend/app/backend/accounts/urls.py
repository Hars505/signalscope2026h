"""Accounts app URL configuration. B2 owns this file."""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import SignupView, LoginView, LogoutView, UserProfileView

urlpatterns = [
    path('signup/', SignupView.as_view(), name='auth-signup'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('me/', UserProfileView.as_view(), name='auth-profile'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
]

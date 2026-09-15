"""
SignalScope URL Configuration.

Routes:
  /api/scan/           — scans app (upload + predict)
  /api/history/        — scans app (scan history)
  /api/auth/           — accounts app (signup, login, logout)
  /api/docs/swagger/   — Swagger UI  (B1-9)
  /api/docs/redoc/     — ReDoc        (B1-9)
  /api/docs/schema/    — OpenAPI 3.0 JSON/YAML
  /admin/              — Django admin
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('scans.urls')),
    path('api/auth/', include('accounts.urls')),

    # --- API Documentation (B1-9) ---
    path('api/docs/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/docs/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

# Serve uploaded scan media. For durable production storage, configure an object
# storage backend instead of relying on Render's ephemeral filesystem.
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

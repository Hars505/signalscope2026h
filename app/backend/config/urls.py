"""
SignalScope URL Configuration.

Routes:
  /api/scan/         — scans app (B1)
  /api/history/      — scans app (B1)
  /api/auth/         — accounts app (B2)
  /admin/            — Django admin
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('scans.urls')),
    path('api/auth/', include('accounts.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

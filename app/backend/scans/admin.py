"""
Django admin customization for SignalScope.
B2-7: Scan admin with filters + User admin with scan counts.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User

from .models import Scan


# Re-register User with scan_count column
admin.site.unregister(User)


class ScanInline(admin.TabularInline):
    """Show user's scans on their admin detail page."""
    model = Scan
    extra = 0
    readonly_fields = ('label', 'confidence', 'threshold_used', 'created_at')
    fields = ('image', 'label', 'confidence', 'threshold_used', 'created_at')
    show_change_link = True


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'is_active', 'is_staff', 'date_joined', 'scan_count')
    list_filter = ('is_active', 'is_staff', 'date_joined')
    inlines = [ScanInline]

    @admin.display(description='Scans')
    def scan_count(self, obj):
        return obj.scan_set.count()


@admin.register(Scan)
class ScanAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'label', 'confidence', 'created_at')
    list_filter = ('label', 'created_at')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('label', 'confidence', 'threshold_used', 'explanation_text',
                       'generator_attribution', 'heatmap_image', 'created_at')
    list_per_page = 25

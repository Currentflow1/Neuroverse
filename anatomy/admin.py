
from django.contrib import admin
from .models import BrainPart


@admin.register(BrainPart)
class BrainPartAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "category",
        "is_deep",
        "is_midline",
        "sort_order",
    )

    list_filter = (
        "category",
        "is_deep",
        "is_midline",
    )

    search_fields = (
        "name",
        "function",
        "location",
    )

    prepopulated_fields = {
        "slug": ("name",),
    }

    ordering = ("sort_order", "name")

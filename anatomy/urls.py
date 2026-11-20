
from django.urls import path
from . import views

app_name = "anatomy"

urlpatterns = [
    path("", views.explorer, name="explorer"),
    path("api/parts/", views.brain_parts, name="brain_parts"),
    path(
        "api/parts/<slug:slug>/",
        views.brain_part_detail,
        name="brain_part_detail",
    ),
]

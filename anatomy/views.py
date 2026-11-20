
import json
from django.shortcuts import render

from django.http import JsonResponse
from django.shortcuts import get_object_or_404

from .models import BrainPart


def brain_parts(request):
    parts = BrainPart.objects.all()

    data = [
        {
            "id": part.id,
            "name": part.name,
            "slug": part.slug,
            "category": part.category,
            "color": part.color,
            "location": part.location,
            "function": part.function,
            "damage_effects": part.damage_effects,
            "fact": part.fact,
            "mesh_name": part.mesh_name,
            "is_deep": part.is_deep,
            "is_midline": part.is_midline,
        }
        for part in parts
    ]

    return JsonResponse({"parts": data})


def brain_part_detail(request, slug):
    part = get_object_or_404(BrainPart, slug=slug)

    data = {
        "id": part.id,
        "name": part.name,
        "slug": part.slug,
        "category": part.category,
        "color": part.color,
        "location": part.location,
        "function": part.function,
        "damage_effects": part.damage_effects,
        "fact": part.fact,
        "mesh_name": part.mesh_name,
        "is_deep": part.is_deep,
        "is_midline": part.is_midline,
    }

    return JsonResponse(data)

def explorer(request):
    return render(request, "neuroverse/explorer.html")

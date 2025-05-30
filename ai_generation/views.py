from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
import openai
import os
import requests
from io import BytesIO
from django.core.files.base import ContentFile
from datetime import datetime
import json

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_ai_image(request):
    try:
        prompt = request.data.get('prompt', '')
        if not prompt:
            return Response({'error': 'Prompt is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Инициализация OpenAI с проверкой ключа
        if not hasattr(settings, 'OPENAI_API_KEY'):
            return Response({'error': 'OpenAI API not configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

        try:
            response = openai.images.generate(
                model="dall-e-3",
                prompt=prompt[:1000],  # Ограничение длины
                size="1024x1024",
                quality="standard",
                n=1
            )
            image_url = response.data[0].url
            return Response({'imageUrl': image_url})
            
        except openai.error.OpenAIError as e:
            return Response({'error': f'OpenAI API error: {str(e)}'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    except Exception as e:
        print(f"Server error: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
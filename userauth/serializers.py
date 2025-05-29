from rest_framework import serializers
from .models import Profile, Post, LikePost, Followers, PostSubscribers, News, CustomUser
from django.contrib.auth import get_user_model
User = get_user_model()

class PostSerializer(serializers.ModelSerializer):
    subscribers = serializers.SerializerMethodField()
    is_subscribed = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = '__all__'
    def get_subscribers(self, obj):
        return [u.username for u in obj.subscribers.all()]
    
    def get_is_subscribed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.subscribers.filter(id=request.user.id).exists()
        return False

class UserProfileSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    name = serializers.CharField(source='username')
    role = serializers.CharField()

    class Meta:
        model = User
        fields = ['id', 'name', 'avatar', 'role']

    def get_avatar(self, obj):
        request = self.context.get('request')
        
        # Если аватар в самой модели User
        if hasattr(obj, 'avatar') and obj.avatar:
            return request.build_absolute_uri(obj.avatar.url) if request else obj.avatar.url
        
        # Если аватар в связанной модели Profile
        if hasattr(obj, 'profile') and hasattr(obj.profile, 'profileimg') and obj.profile.profileimg:
            return request.build_absolute_uri(obj.profile.profileimg.url) if request else obj.profile.profileimg.url
        
        # Возвращаем None, если аватар не найден
        return None

class NewsSerializer(serializers.ModelSerializer):
    class Meta:
        model = News
        fields = ['id', 'title', 'content', 'image', 'created_at', 'author', 'is_published']
        read_only_fields = ['author', 'created_at', 'is_published']

    def validate(self, data):
        if not data.get('title') or len(data['title']) < 5:
            raise serializers.ValidationError('Название новости должно быть не короче 5 символов')
        if not data.get('content'):
            raise serializers.ValidationError('Содержание новости не может быть пустым')
        return data

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        validated_data['is_published'] = True
        return super().create(validated_data)

    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'password')
    
    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

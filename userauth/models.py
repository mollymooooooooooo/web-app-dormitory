import re
from django.db import models
from django.contrib.auth.models import User, AbstractUser
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from datetime import datetime
import uuid

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('user', 'User'),
        ('admin', 'Admin'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')
    email = models.EmailField(unique=True)
    
    def clean(self):
        super().clean()
        if not re.match(r'^[\w\.-]+@stud\.kpfu\.ru$', self.email):
            raise ValidationError('Разрешена регистрация только с почтой @stud.kpfu.ru')
    def save(self, *args, **kwargs):
        super().clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username

User = get_user_model()

class Profile(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    id_user = models.IntegerField(primary_key=True, default=0)
    bio = models.TextField(blank=True, max_length=1000, default="No bio provided")
    profileimg = models.ImageField(upload_to='profilepics', default="/profilepics/default-profile.png")
    location = models.CharField(max_length=100, blank=True, default="")

    def __str__(self):
        return self.user.username

class Post(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.CharField(max_length=100)
    image = models.ImageField(upload_to='postpics')
    caption = models.TextField()
    created_at = models.DateTimeField(default=datetime.now)
    num_likes = models.IntegerField(default=0)
    subscribers = models.ManyToManyField(User, related_name='subscribed_posts', blank=True)
    is_approved = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)

    def __str__(self):
        return self.user
    
    def get_subscribers(self):
        return self.subscribers.all()
    
class LikePost(models.Model):
    post_id = models.CharField(max_length=500)
    username = models.CharField(max_length=100)

    def __str__(self):
        return self.username
    
class Followers(models.Model):
    follower = models.CharField(max_length=100)
    user = models.CharField(max_length=100)

    def __str__(self):
        return self.user
    
class PostSubscribers(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('post', 'user')

    def __str__(self):
        return f"{self.user.username} subscribed to {self.post.user}"
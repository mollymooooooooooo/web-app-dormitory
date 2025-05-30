import re
from django.db import models
from django.contrib.auth.models import User, AbstractUser, UserManager
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.conf import settings
from datetime import datetime
import uuid

class CustomUserManager(UserManager):
    def create_user(self, username, email, password, **extra_fields):
        if not email:
            raise ValueError('Введите почту')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save()
        return user
    
    def create_superuser(self, username, email, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(username, email, password, **extra_fields)

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('user', 'User'),
        ('admin', 'Admin'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')
    email = models.EmailField(unique=True)
    email_verified = models.BooleanField(default=False)

    objects = CustomUserManager()
    
    def clean(self):
        super().clean()
        if not self.pk or 'email' in self.get_dirty_fields():
            if not re.match(r'^[\w\.-]+@stud\.kpfu\.ru$', self.email):
                raise ValidationError('Разрешена регистрация только с почтой @stud.kpfu.ru')
    def save(self, *args, **kwargs):
        super().clean()
        super().save(*args, **kwargs)

    def get_dirty_fields(self):
        dirty_fields = {}
        if self.pk:
            old_instance = CustomUser.objects.get(pk=self.pk)
            for field in self._meta.fields:
                if getattr(self, field.name) != getattr(old_instance, field.name):
                    dirty_fields[field.name] = getattr(old_instance, field.name)
        return dirty_fields

    def __str__(self):
        return self.username

class Profile(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
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
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(default=datetime.now)
    num_likes = models.IntegerField(default=0)
    subscribers = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='subscribed_posts', blank=True)
    is_approved = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)

    class Meta:
        permissions=[
            ("can_moderate", "Can approve or reject posts"),
        ]

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
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('post', 'user')

    def __str__(self):
        return f"{self.user.username} subscribed to {self.post.user}"
    

class News(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=100, verbose_name='Заголовок')
    content = models.TextField(verbose_name='Содержание')
    image = models.ImageField(upload_to='newspics/', verbose_name='Изображение')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name='Автор')
    is_published = models.BooleanField(default=True, verbose_name='Опубликовано')

    class Meta:
        verbose_name = 'Новость'
        verbose_name_plural = 'Новости'
        ordering = ['-created_at']

    def __str__(self):
        return self.title
    

class Feedback(models.Model):
    CATEGORY_CHOICES = (
        ('question', 'Вопрос'),
        ('suggestion', 'Предложение'),
        ('problem', 'Проблема'),
        ('complaint', 'Жалоба'),
        ('other', 'Другое')
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, verbose_name='Пользователь', blank=True)
    name = models.CharField(max_length=100, verbose_name='Имя', blank=True)
    room = models.CharField(max_length=20, verbose_name='Номер комнаты', blank=True)
    email = models.EmailField(max_length=100, verbose_name='Email', blank=True)
    phone = models.CharField(max_length=20, verbose_name='Телефон', blank=True)
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        verbose_name='Тип обращения',
        default='question'
    )
    message = models.TextField(verbose_name='Сообщение')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    
    class Meta:
        verbose_name = 'Обращение'
        verbose_name_plural = 'Обращения'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} - {self.get_category_display()}'
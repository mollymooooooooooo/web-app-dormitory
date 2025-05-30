from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

# Register your models here.

from . models import *

admin.site.register(Profile)

admin.site.register(Post)
admin.site.register(LikePost)
admin.site.register(Followers)
admin.site.register(CustomUser, UserAdmin)
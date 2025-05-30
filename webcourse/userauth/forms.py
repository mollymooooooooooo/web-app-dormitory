from django import forms
from .models import Post
import re
from django.core.exceptions import ValidationError

class PostForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = ['image', 'caption']
        widgets = {
            'caption': forms.Textarea(attrs={
                'class': 'form-control',
                'placeholder': 'Описание...',
                'rows': 3
            }),
            'image': forms.FileInput(attrs={
                'class': 'form-control',
            })
        }
        labels = {
            'caption': 'Описание',
            'image': 'Фото мероприятия',
        }

class SignupForm(forms.Form):
    username = forms.CharField(max_length=100, required=True)
    email = forms.EmailField(required=True)
    password = forms.CharField(widget=forms.PasswordInput, required=True)
    def clean_email(self):
        email = self.cleaned_data['email']
        if not re.match(r'^[\w\.-]+@stud\.kpfu\.ru$', email):
            raise ValidationError('Разрешена регистрация только с почтой @stud.kpfu.ru')
        return email
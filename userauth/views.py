from itertools import chain
from  django . shortcuts  import  get_object_or_404, render, redirect
from django.http import HttpResponse, JsonResponse
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.contrib.auth.decorators import login_required, user_passes_test
from . models import  Followers, LikePost, News, Post, Profile
from django.db.models import Q
from .forms import PostForm
import re
from django.core.exceptions import ValidationError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny, BasePermission
from rest_framework.response import Response
from .serializers import NewsSerializer, PostSerializer, UserProfileSerializer, UserRegistrationSerializer
from rest_framework import viewsets, status, generics
from django.views.decorators.csrf import csrf_exempt
import json
from rest_framework_simplejwt.tokens import RefreshToken
import logging
logger = logging.getLogger(__name__)

User = get_user_model()

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'admin'

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class PostList(generics.ListCreateAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Post.objects.filter(is_approved=True).order_by('-created_at')
        
        # Добавляем фильтрацию по пользователю, если передан параметр user
        username = self.request.query_params.get('user', None)
        if username is not None:
            queryset = queryset.filter(user=username)
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user.username, is_approved=self.request.user.role == 'admin')

class PostDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def get_permission(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAdminUser()]
        return super().get_permission()
def validate_email(email):
    if not re.match(r'^[\w\.-]+@stud\.kpfu\.ru$', email):
        raise ValidationError('Разрешена регистрация только с почтой @stud.kpfu.ru')


@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    print("Полученные данные:", request.data)
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        try:
            validate_email(serializer.validated_data['email'])
            user = serializer.save()
            Profile.objects.create(user=user, id_user=user.id)
            return Response({'success': True}, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def user_login(request):
    try:
        logger.info(f"Получены данные: {request.data}")
        
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response({'error': 'Email и пароль обязательны'}, status=400)
        
        try:
            user = User.objects.get(email=email.lower())  # Нормализация email
        except User.DoesNotExist:
            return Response({'error': 'Пользователь не найден'}, status=404)
        
        user = authenticate(username=user.username, password=password)
        if not user:
            return Response({'error': 'Неверный пароль'}, status=400)
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'username': user.username,
            'role': user.role
        })
        
    except Exception as e:
        logger.exception("Ошибка при входе:")
        return Response({'error': 'Внутренняя ошибка сервера'}, status=500)

@permission_classes([IsAuthenticated])
def user_logout(request):
    logout(request)
    return Response({'success': True})

@permission_classes([IsAuthenticated])
def home(request):
    
    following_users = Followers.objects.filter(follower=request.user.username).values_list('user', flat=True)

    
    post = Post.objects.filter(Q(user=request.user.username) | Q(user__in=following_users)).order_by('-created_at')

    profile = Profile.objects.get(user=request.user)

    context = {
        'post': post,
        'profile': profile,
    }
    return render(request, 'main.html',context)

@permission_classes([IsAuthenticated])
def upload(request):
    if request.method == 'POST':
        form = PostForm(request.POST, request.FILES)
        if form.is_valid():
            post = form.save(commit=False)
            post.user = request.user.username
            if hasattr(request.user, 'role') and request.user.role == 'admin':
                post.is_approved = True
            post.save()
            return redirect('/')
    else:
        form = PostForm()
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'success': True})
    return redirect('/')

@permission_classes([IsAuthenticated])
def likes(request, id):
    if request.method == 'GET':
        username = request.user.username
        post = get_object_or_404(Post, id=id)

        like_filter = LikePost.objects.filter(post_id=id, username=username).first()

        if like_filter is None:
            new_like = LikePost.objects.create(post_id=id, username=username)
            post.num_likes = post.num_likes + 1
        else:
            like_filter.delete()
            post.num_likes = post.num_likes - 1

        post.save()

        # Generate the URL for the current post's detail page
        print(post.id)

        # Redirect back to the post's detail page
        return redirect(request.META.get('HTTP_REFERER', '/'))
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def explore(request):
    posts=Post.objects.filter(is_approved=True).order_by('-created_at')
    profile = Profile.objects.get(user=request.user)

    for post in posts:
        post.is_owner = (post.user == request.user.username)
        post.is_subscribed = (not post.is_owner and post.subscribers.filter(id=request.user.id).exists())

    context={
        'posts':posts,
        'profile':profile
        
    }
    return render(request, 'explore.html',context)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request,id_user):
    user_object = User.objects.get(username=id_user)
    print(user_object)
    profile = Profile.objects.get(user=request.user)
    user_profile = Profile.objects.get(user=user_object)
    user_posts = Post.objects.filter(user=id_user).order_by('-created_at')
    user_post_length = len(user_posts)

    follower = request.user.username
    user = id_user
    
    if Followers.objects.filter(follower=follower, user=user).first():
        follow_unfollow = 'Unfollow'
    else:
        follow_unfollow = 'Follow'

    user_followers = len(Followers.objects.filter(user=id_user))
    user_following = len(Followers.objects.filter(follower=id_user))

    context = {
        'user_object': user_object,
        'user_profile': user_profile,
        'user_posts': user_posts,
        'user_post_length': user_post_length,
        'profile': profile,
        'follow_unfollow':follow_unfollow,
        'user_followers': user_followers,
        'user_following': user_following,
    }
    
    
    if request.user.username == id_user:
        if request.method == 'POST':
            if request.FILES.get('image') == None:
             image = user_profile.profileimg
             bio = request.POST['bio']
             location = request.POST['location']

             user_profile.profileimg = image
             user_profile.bio = bio
             user_profile.location = location
             user_profile.save()
            if request.FILES.get('image') != None:
             image = request.FILES.get('image')
             bio = request.POST['bio']
             location = request.POST['location']

             user_profile.profileimg = image
             user_profile.bio = bio
             user_profile.location = location
             user_profile.save()
            

            return redirect('/profile/'+id_user)
        else:
            return render(request, 'profile.html', context)
    return render(request, 'profile.html', context)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile_api(request, username):
    try:
        user = User.objects.get(username=username)
        profile = Profile.objects.get(user=user)
        
        if request.user != user:
            return Response({'error': 'Вы можете редактировать только свой профиль'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        if request.method == 'GET':
            return Response({
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'profile': {
                    'bio': profile.bio,
                    'location': profile.location,
                    'profileimg': request.build_absolute_uri(profile.profileimg.url) if profile.profileimg else None
                }
            })
            
        elif request.method == 'PATCH':
            # Обновляем поля профиля
            if 'bio' in request.data:
                profile.bio = request.data['bio']
            if 'location' in request.data:
                profile.location = request.data['location']
            
            # Обрабатываем загрузку изображения
            if 'profileimg' in request.FILES:
                profile.profileimg = request.FILES['profileimg']
            
            profile.save()
            
            # Возвращаем обновленные данные
            return Response({
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'profile': {
                    'bio': profile.bio,
                    'location': profile.location,
                    'profileimg': request.build_absolute_uri(profile.profileimg.url) if profile.profileimg else None
                }
            }, status=status.HTTP_200_OK)
            
    except User.DoesNotExist:
        return Response({'error': 'Пользователь не найден'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error updating profile: {str(e)}")
        return Response({'error': 'Ошибка при обновлении профиля'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def delete(request, id):
    post = Post.objects.get(id=id)
    post.delete()

    return redirect('/profile/'+ request.user.username)

@permission_classes([IsAuthenticated])
def search_results(request):
    query = request.GET.get('q')

    users = Profile.objects.filter(user__username__icontains=query)
    posts = Post.objects.filter(caption__icontains=query)

    context = {
        'query': query,
        'users': users,
        'posts': posts,
    }
    return render(request, 'search_user.html', context)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_events(request):
    query = request.GET.get('q','').strip()
    if not query:
        return Response({'events: ', []})
    
    events = Post.objects.filter(
        Q(caption__icontains=query) |
        Q(description__icontains=query) |
        Q(user__icontains=query),
        is_approved=True
    ).order_by('-created_at')
    
    serializer = PostSerializer(events, many=True)
    return Response({
        'events': serializer.data,
        'count': events.count()
    })

@permission_classes([IsAuthenticated])
def home_post(request,id):
    post=Post.objects.get(id=id)
    profile = Profile.objects.get(user=request.user)
    is_subscribed = post.subscribers.filter(id=request.user.id).exists()

    context={
        'post':post,
        'profile':profile,
        'is_subscribed': is_subscribed
    }
    return render(request, 'main.html',context)


@permission_classes([IsAuthenticated])
def follow(request):
    if request.method == 'POST':
        follower = request.POST['follower']
        user = request.POST['user']

        if Followers.objects.filter(follower=follower, user=user).first():
            delete_follower = Followers.objects.get(follower=follower, user=user)
            delete_follower.delete()
            return redirect('/profile/'+user)
        else:
            new_follower = Followers.objects.create(follower=follower, user=user)
            new_follower.save()
            return redirect('/profile/'+user)
    else:
        return redirect('/')
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_event_subscription(request, event_id):
    try:
        post = Post.objects.get(pk=event_id)
        user = request.user
        
        if post.subscribers.filter(id=user.id).exists():
            post.subscribers.remove(user)
            following = False
        else:
            post.subscribers.add(user)
            following = True
            
        return Response({
            'success': True,
            'following': following,
            'subscribers_count': post.subscribers.count(),
            'subscribers': [u.username for u in post.subscribers.all()]
        })
        
    except Post.DoesNotExist:
        return Response({'error': 'Мероприятие не найдено'}, status=404)

def is_admin(user):
    return user.is_authenticated and user.role == 'admin'

@api_view(['GET'])
@permission_classes([IsAdmin])
def get_pending_posts(request):
    pending_posts = Post.objects.filter(is_approved=False).order_by('-created_at')
    serializer = PostSerializer(pending_posts, many=True)
    data = []
    for post in serializer.data:
        post_data = {
            'id': post.get('id'),
            'caption': post.get('caption', ''),
            'description': post.get('description', ''),
            'image': post.get('image'),
            'user': post.get('user', ''),
            'created_at': post.get('created_at'),
            'subscribers': post.get('subscribers', []),
            'num_likes': post.get('num_likes', 0),
            'is_subscribed': post.get('is_subscribed', False)
        }
        data.append(post_data)
    
    return Response(data)

@api_view(['GET'])
def get_approved_posts(request):
    approved_posts = Post.objects.filter(is_approved=True).order_by('-created_at')
    serializer = PostSerializer(approved_posts, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAdmin])
def approve_post(request, pk):
    try:
        post = Post.objects.get(pk=pk)
        post.is_approved = True
        post.save()
        return Response({'success': True}, status=200)
    except Post.DoesNotExist:
        return Response({'error': 'Нет такой записи'}, status=404)

@api_view(['POST'])
@permission_classes([IsAdmin])
def reject_post(request, post_id):
    try:
        post = Post.objects.get(pk=post_id)
        post.delete()
        return Response({'success': True}, status=200)
    except Post.DoesNotExist:
        return Response({'error': 'Нет такой записи'}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_post(request):
    try:
        # Проверяем, является ли пользователь администратором
        is_admin = request.user.role == 'admin'
        
        post = Post.objects.create(
            user=request.user.username,
            image=request.FILES.get('image'),
            caption=request.data.get('caption'),
            description=request.data.get('description'),
            is_approved=is_admin  # Автоматически одобряем для администраторов
        )
        
        serializer = PostSerializer(post)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# @api_view(['GET'])
# def get_news(request):
#     news = News.objects.filter(is_published=True).order_by('-created_at')
#     serializer = NewsSerializer(news, many=True)
#     return Response(serializer.data)

# @api_view(['POST'])
# @permission_classes([IsAdminUser])
# def create_news(request):
#     serializer = NewsSerializer(data=request.data)
#     if serializer.is_valid():
#         serializer.save(author=request.user)
#         return Response(serializer.data, status=201)
#     return Response(serializer.errors, status=400)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_news(request, pk):
    try:
        news = News.objects.get(pk=pk)
        if request.user.role != 'admin' and request.user != news.author:
            return Response(
                {'error': 'Недостаточно прав для удаления новости'},
                status=status.HTTP_403_FORBIDDEN
            )
        news.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except News.DoesNotExist:
        return Response({'error': 'Новость не найдена'}, status=404)
    return Response({'success': 'Новость успешно удалена'}, status=200)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def news_list(request):
    if request.method == 'GET':
        news = News.objects.filter(is_published=True).order_by('-created_at')
        serializer = NewsSerializer(news, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Только админы могут создавать новости
        if not request.user.role == 'admin':
            return Response({'error': 'Недостаточно прав'}, status=403)
            
        serializer = NewsSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(author=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request, username=None):
    try:
        if username == 'undefined':
            return Response({'error': 'Username не определен'}, status=400)
            
        user = User.objects.get(username=username)
        profile = Profile.objects.get(user=user)
        
        return Response({
            'username': request.user.username,
            'email': request.user.email,
            'role': request.user.role,
            'profile': {
                'bio': profile.bio,
                'location': profile.location,
                'profileimg': request.build_absolute_uri(profile.profileimg.url) if profile.profileimg else None
            }
        })
    except User.DoesNotExist:
        return Response({'error': 'Пользователь не найден'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=400)
    

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user_profile(request):
    try:
        profile = Profile.objects.get(user=request.user)
        serializer = UserProfileSerializer({
            'username': request.user.username,
            'email': request.user.email,
            'role': request.user.role,
            'profile': {
                'bio': profile.bio,
                'location': profile.location,
                'profileimg': profile.profileimg.url if profile.profileimg else None
            }
        })
        return Response(serializer.data)
    except Profile.DoesNotExist:
        return Response({'error': 'Profile not found'}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_event_subscribers(request, event_id):
    try:
        post = Post.objects.get(pk=event_id)
        subscribers = post.subscribers.all()
        serializer = UserProfileSerializer(subscribers, many=True, context={'request': request})
        return Response(serializer.data)
    except Post.DoesNotExist:
        return Response({'error': 'Event not found'}, status=404)
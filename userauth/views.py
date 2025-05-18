from itertools import chain
from  django . shortcuts  import  get_object_or_404, render, redirect
from django.http import HttpResponse, JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required, user_passes_test
from . models import  Followers, LikePost, Post, Profile
from django.db.models import Q
from .forms import PostForm
import re
from django.core.exceptions import ValidationError

def validate_email(email):
    if not re.match(r'^[\w\.-]+@stud\.kpfu\.ru$', email):
        raise ValidationError('Разрешена регистрация только с почтой @stud.kpfu.ru')

def signup(request):
    if request.method == 'POST':
        fnm=request.POST.get('fnm')
        emailid=request.POST.get('emailid')
        pwd=request.POST.get('pwd')
        print(fnm,emailid,pwd)
        try:
            validate_email(emailid)
            if User.objects.filter(username=fnm).exists():
                return render(request, 'signup.html',{'invalid':"Этот пользователь уже существует"})
            if User.objects.filter(email=emailid).exists():
                return render(request, 'signup.html',{'invalid':"Этот email уже используется"})
            my_user=User.objects.create_user(fnm,emailid,pwd)
            my_user.save()
            user_model = User.objects.get(username=fnm)
            new_profile = Profile.objects.create(user=user_model, id_user=user_model.id)
            new_profile.save()
            login(request,my_user)
            return redirect('/')
        except ValidationError as e:
            return render(request, 'signup.html',{'invalid':str(e)})
        except Exception as e:
            return render(request, 'signup.html',{'invalid':"Произошла ошибка"})
    return render(request, 'signup.html')

def user_login(request):
 
  if request.method == 'POST':
        fnm=request.POST.get('fnm')
        pwd=request.POST.get('pwd')
        print(fnm,pwd)
        try:
            user = User.objects.get(username=fnm)
            if not user.email.endswith('@stud.kpfu.ru'):
                return render(request, 'user_login.html',{'invalid':"Доступ разрешен только для @stud.kpfu.ru пользователей"})
            userr=authenticate(request,username=fnm,password=pwd)
            if userr is not None:
                login(request,userr)
                return redirect('/')
            else:
                return render(request, 'user_login.html',{'invalid':"Неверный логин или пароль"})
        except User.DoesNotExist:
            return render(request, 'user_login.html',{'invalid':"Пользователь не найден"})
  return render(request, 'user_login.html')

@login_required(login_url='/user_login')
def user_logout(request):
    logout(request)
    return redirect('/user_login')



@login_required(login_url='/user_login')
def home(request):
    
    following_users = Followers.objects.filter(follower=request.user.username).values_list('user', flat=True)

    
    post = Post.objects.filter(Q(user=request.user.username) | Q(user__in=following_users)).order_by('-created_at')

    profile = Profile.objects.get(user=request.user)

    context = {
        'post': post,
        'profile': profile,
    }
    return render(request, 'main.html',context)
    


@login_required(login_url='/user_login')
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
    if request.headers/get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'success': True})
    return redirect('/')

    #     user = request.user.username
    #     image = request.FILES.get('image_upload')
    #     caption = request.POST['caption']

    #     new_post = Post.objects.create(user=user, image=image, caption=caption)
    #     if request.user.role == 'admin':
    #         new_post.is_approved = True
    #     new_post.save()

    #     return redirect('/')
    # else:
    #     return redirect('/')

@login_required(login_url='/user_login')
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
    
@login_required(login_url='/user_login')
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
    
@login_required(login_url='/user_login')
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

@login_required(login_url='/user_login')
def delete(request, id):
    post = Post.objects.get(id=id)
    post.delete()

    return redirect('/profile/'+ request.user.username)


@login_required(login_url='/user_login')
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

@login_required(login_url='/user_login')
def search_events(request):
    query = request.GET.get('q','')
    if query:
        events = Post.objects.filter(caption__icontains=query).order_by('-created_at')
    else:
        events = Post.objects.none()
    
    profile = Profile.objects.filter(user=request.user)

    context = {
        'query': query,
        'events': events,
        'profile': profile,
    }

    return render(request, 'search_events.html', context)

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
    

@login_required(login_url='/user_login')
def toggle_subscription(request, post_id):
    post = get_object_or_404(Post, id=post_id)

    if post.user == request.user.username:
        return redirect(request.META.get('HTTP_REFERER', '/'))

    if post.subscribers.filter(id=request.user.id).exists():
        post.subscribers.remove(request.user)
    else:
        post.subscribers.add(request.user)
    
    return redirect(request.META.get('HTTP_REFERER', '/'))

def is_admin(user):
    return user.is_authenticated and user.role == 'admin'

@login_required(login_url='/user_login')
@user_passes_test(is_admin, login_url='/user_login')
def moderation_panel(request):
    pending_posts = Post.objects.filter(is_approved=False).order_by('-created_at')
    return render(request, 'moderation_panel.html', {'pending_posts': pending_posts})

@login_required(login_url='/user_login')
@user_passes_test(is_admin, login_url='/user_login')
def approve_post(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    post.is_approved = True
    post.save()
    return redirect('/moderation_panel')

@login_required(login_url='/user_login')
@user_passes_test(is_admin, login_url='/user_login')
def reject_post(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    post.delete()
    return redirect('/moderation_panel')

@login_required(login_url='/user_login')
def create_post(request):
    if request.method == 'POST':
        form = PostForm(request.POST, request.FILES)
        if form.is_valid():
            post = form.save(commit=False)
            post.user = request.user.username
            if request.user.role == 'admin':
                post.is_approved = True
            post.save()
            return redirect('/')
    else:
        form = PostForm()
    return render(request, 'create_post.html', {'form': form})
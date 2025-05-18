from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.conf import settings
from userauth import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.home),
    path('signup/', views.signup, name='signup'),
    path('user_login/', views.user_login, name='login'),
    path('user_logout/', views.user_logout, name='logout'),
    path('upload', views.upload, name='upload'),
    path('like-post/<str:id>', views.likes, name='like-post'),
    path('/#<str:id>', views.home_post),
    path('explore', views.explore),
    path('profile/<str:id_user>', views.profile),
    path('follow', views.follow, name='follow'),
    # path('post/<int:post_id>/follow/', views.follow_post, name='follow_post'),
    path('follow-post/<str:post_id>/', views.toggle_subscription, name='follow-post'),
    path('search-events/', views.search_events, name='search_events'),
    path('moderation_panel/', views.moderation_panel, name='moderation_panel'),
    path('approve-post/<str:post_id>/', views.approve_post, name='approve_post'),
    path('reject-post/<str:post_id>/', views.reject_post, name='reject_post'),
]
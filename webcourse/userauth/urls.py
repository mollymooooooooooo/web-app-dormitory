from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.conf import settings
from userauth import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter

router = DefaultRouter()

urlpatterns = [
    path('api/login/', views.user_login, name='api-login'),
    path('', views.home),
    path('api/signup/', views.signup, name='api-signup'),
    path('api/logout/', views.user_logout, name='api-logout'),
    path('upload', views.upload, name='upload'),
    path('like-post/<str:id>', views.likes, name='like-post'),
    path('/#<str:id>', views.home_post),
    path('explore', views.explore),
    path('profile/<str:id_user>', views.profile),
    path('follow', views.follow, name='follow'),
    path('api/search-events/', views.search_events, name='search_events'),
    path('api/news/', views.news_list, name='news-list'),
    path('api/news/<uuid:pk>/', views.delete_news, name='delete_news'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/posts/', views.PostList.as_view(), name='post-list'),
    path('api/posts/<uuid:pk>/', views.PostDetail.as_view(), name='post-detail'),
    path('api/posts/pending/', views.get_pending_posts, name='get_pending_posts'),
    path('api/posts/<uuid:pk>/approve/', views.approve_post, name='approve_post'),
    path('api/posts/<uuid:pk>/reject/', views.reject_post, name='reject_post'),
    path('api/posts/create/', views.create_post, name='create_post'),
    path('api/posts/approved/', views.get_approved_posts, name='get_approved_posts'),
    path('user/profile/', views.current_user_profile, name='current-profile'),
    path('api/profile/<str:username>/', views.profile_api, name='user-profile'),
    path('posts/', views.PostList.as_view(), name='post-list'),
    path('api/follow-event/<uuid:event_id>/', views.toggle_event_subscription, name='toggle-event-subscription'),
    path('api/events/<uuid:event_id>/subscribers/', views.get_event_subscribers, name='event-subscribers'),
    path('api/ai/generate_image/', views.generate_ai_image, name='generate_ai_image'),
    path('api/activate/<str:uidb64>/<str:token>/', views.activate, name='activate'),
    path('api/feedback/', views.submit_feedback, name='submit_feedback'),
] + router.urls
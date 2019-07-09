from django.contrib import admin
from django.urls import path, include
from . import views;
from django.contrib.auth.views import LoginView, LogoutView

from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('index', views.index, name="index"),
    path('', LoginView.as_view(template_name='chatting/login.html'), name="login"),
    path('logout', LogoutView.as_view(), name="logout"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
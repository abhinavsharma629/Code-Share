from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from django.conf.urls import url
from rest_framework.urlpatterns import format_suffix_patterns
from . import views

urlpatterns = [
	# Compiler
    path('submit', views.submit.as_view()),
    path('getResponse', views.getResponse, name="getResponse"),

   ]  + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

urlpatterns=format_suffix_patterns(urlpatterns)
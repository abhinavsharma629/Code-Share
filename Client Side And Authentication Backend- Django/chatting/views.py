from django.shortcuts import render, HttpResponseRedirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login
from django.contrib.auth import logout


@login_required(login_url="/")
def index(request):
    return render(request, 'chatting/share.html', {'username':request.user.username})
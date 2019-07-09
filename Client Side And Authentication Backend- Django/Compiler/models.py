from django.db import models
from django.contrib import admin
from django.contrib.auth.models import User
from .choices import *

class SubmissionData(models.Model):
    username= models.CharField(max_length=100)
    problemData=models.FileField(upload_to='portal/runCode',blank=True)
    inputFile=models.FileField(upload_to='portal/runCode',blank=True, null=True)
    submissionId=models.CharField(max_length=1000, primary_key=True)
    outputFile=models.FileField(upload_to='portal/runCode',blank=True, null=True)
    status= models.CharField(max_length=100, blank=True, null=True)
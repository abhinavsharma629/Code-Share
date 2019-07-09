#IMPORTS
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import SubmissionData
from .serializers import SubmissionDataSerializer
from django.db.models import Q
from django.http import JsonResponse
from .tasks import submission
from rest_framework.parsers import MultiPartParser
from django.core import serializers
from django.utils import timezone
from django.core.files import File
import os
#Problem Submit
class submit(APIView):
    
    #POST
    parser_classes = (MultiPartParser,)
    def post(self, request, format=None):
        params=request.data
        user=params['user']
        file=params['file']
        print(file)
        print(type(file))
        c=False
        
        try:
            inputFile=params['inputFile']
            c=True
        except:
            c=False
        
        #print(user, type(user))
        fileName=params['fileName']
        print(fileName)
        file_ext_check=fileName.split(".")[1]
        #print(file_ext_check)
        if(file_ext_check=='java' or file_ext_check=='c' or file_ext_check=='cpp' or file_ext_check=='py'):
            if(file_ext_check == 'java'):
                language=1
            elif(file_ext_check == 'cpp'):
                language=2
            elif(file_ext_check == 'c'):
                language=3
            elif(file_ext_check == 'py'):
                language=4
            print(language)

            os.chdir("/home/abhi/Desktop/chat (copy)/media/portal/runCode")
            file1=open('Abhi.'+file_ext_check,'w')
            file1.write(file)
            file1.close()
            print(file1.name)
            file2=File(open(file1.name))
            stat = submission.delay(language)
            if(c):
                obj,notif=SubmissionData.objects.get_or_create(username=user, problemData=file2, inputFile=inputFile, submissionId=stat, status="Not Judged")
            else:
                obj,notif=SubmissionData.objects.get_or_create(username=user, problemData=file2, submissionId=stat, status="Not Judged")
            
            if notif is True:
                obj.save()
            os.chdir('/home/abhi/Desktop/chat (copy)')
            return JsonResponse({"subId":str(stat), "status":"ok"})
        else:
            return Response({"status":"none"})
    

#Get Problem Status
@api_view(['GET'])
def getResponse(request):
    obj=SubmissionData.objects.get(submissionId=request.GET.get('subId'))
    if(obj):
        while(obj.status=="Not Judged"):
            obj=SubmissionData.objects.get(submissionId=request.GET.get('subId'))
            print("Waiting for judging....")
            
        obj=SubmissionData.objects.get(submissionId=request.GET.get('subId'))
        print(obj.outputFile.name)
        print(obj.outputFile)
        

        os.chdir("/home/abhi/Desktop/chat (copy)/media/portal/runCode")
        content=File(open(obj.outputFile.name.split('/')[2], 'rb'))
        context=content.read()
        content.close()
        print(context)
        os.chdir('/home/abhi/Desktop/chat (copy)')
        return JsonResponse({'url': obj.outputFile.name, 'content': str(context).format('utf-8'), "judged": "True"})
    else:
        return JsonResponse({"judged":"False"})
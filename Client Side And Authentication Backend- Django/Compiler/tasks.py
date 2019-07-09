import string
from django.utils.crypto import get_random_string
import subprocess
import os
import shlex,subprocess
from subprocess import Popen, PIPE
from .models import SubmissionData
from django.db.models import Q
import fnmatch
from django.core.files import File
from celery import shared_task



@shared_task(name='language')
def submission(language):
    
    #Wait till django view creates the user object with the submission id
    while(len(SubmissionData.objects.filter(Q(submissionId=str(submission.request.id))))!=1):
        continue
   
    # Change curr dir to media/portal which contains user uploaded files
    currDir=os.getcwd()
    os.chdir(os.getcwd()+"/media/portal/runCode")
    
    # Removing Unnecessary Files If Any


    returncode = 0
    runtimeError = 0

    #Submission Data Obj
    submissionData=SubmissionData.objects.get(submissionId=str(submission.request.id))
    print(submissionData)
    
    #Language Choice
    choice=language
    print("Choice is:- ",choice)
  
    
    #print(submissionData.problemData)
    
    #Getting filename
    fileName=((((str(submissionData.problemData)).split('/')[2]).split('.')))[0]
    print("Filename is:- ",fileName)
    print(submissionData.problemData)

    #Selcting compileCode and runCode according to the language
    def languageChoice(langCode):
        global compileCode, runCode
        compileCode=""
        runCode=""
        
        if(langCode==1):
            compileCode="javac "+fileName+".java"
            runCode="java "+fileName

        elif(langCode==2):
            compileCode="g++ "+fileName+".cpp -o c++Output"
            runCode="./c++Output"
        

        elif(langCode==3):
            compileCode="gcc "+fileName+".c -o cOutput"
            runCode="./cOutput"

    languageChoice(choice)
    
    try:
        print(submissionData.inputFile)
        inputFile=((((str(submissionData.inputFile)).split('/')[2]).split('.')))[0]
        inputFile=File(open(inputFile+'.txt'))
        filePresent=True
    except:
        filePresent=False
    outputFile=File(open('outputFile'+submission.request.id+'.txt', 'w'))
    #print(inputFile)
    if(choice!=4):
        try:
            process = subprocess.check_output(compileCode, shell=True)
            #If file is not present
            if(filePresent==False):
                outputFile.write("Success")
                print("ok")
            #If file present
            else:
                process1 = subprocess.Popen(runCode, stdin=inputFile, stdout=outputFile , stderr=subprocess.PIPE , universal_newlines=True, shell=True)
                try:
                    stderr = process1.communicate(timeout=1)
                    print(stderr)
                    if(stderr[0]!=None):
                        print("inside")
                        outputFile.write((str(stderr)))
                        runtimeError = 1
                
                #TLE
                except subprocess.TimeoutExpired as e:
                    process1.terminate()
                    outputFile.write(" Time Limit Exceed\n ")
                    outputFile.write((str(e)))
                    returncode = -1
                    
        #Compilation Error
        except subprocess.CalledProcessError as e:
            print(e)
            outputFile.write(" Compilation Error\n")
            outputFile.write((str(e)))
            returncode = 1
            

        if(returncode==0 and runtimeError==1):
            outputFile.write(" Runtime Error\n ")
            outputFile.write((str(stderr)))
            returncode = 2
        
        #print(returncode)
        

    elif(choice==4):
        global stderr1
        try:
            if(filePresent):
                print("yes")
                process=subprocess.Popen('python3 '+fileName+".py", stdin=inputFile, stdout=outputFile, stderr=subprocess.PIPE , universal_newlines=True, shell=True)
            else:
                process=subprocess.Popen('python3 '+fileName+".py", stdout=outputFile, stderr=subprocess.PIPE , universal_newlines=True, shell=True)
            stderr1 = process.communicate(timeout=1)
            print("error",stderr1)
            if(stderr1[1]):
                outputFile.write((str(stderr1[1])))
                returncode=4
        
        except subprocess.TimeoutExpired as e:
            print(e)
            try:
                stderr1 = process.communicate(timeout=1)
                print(stderr1)
                if(stderr1[1]):
                    outputFile.write(str(stderr1[1]))
            except:
                process.terminate()
                
                if(not filePresent):
                        outputFile.write(" Time Limit Exceed due to:- \n ")
                        outputFile.write(" No Input Given")
                    
                else:
                    outputFile.write(" Time Limit Exceed\n ")
                    outputFile.write((str(e)))
                    returncode=-1

        except subprocess.CalledProcessError as e:
            print(e)
            outputFile.write(" Compilation Error\n ")
            outputFile.write((str(e)))
            returncode = 1
        
        except:
            if(stderr[0]!=None):
                outputFile.write(" Runtime Error \n ")
                outputFile.write((str(stderr)))
                returncode = 2
        
        print(returncode)
    #print(returncode, "Abhinav You were Successfull")

    
    # if(returncode !=1 and returncode!=2 and returncode!= -1):
    #     if(choice==1):
    #         os.remove(fileName+'.class')
    #     elif(choice==2):
    #         os.remove('c++Output')
    #     elif(choice==3):
    #         os.remove('cOutput')

    #os.rename('curr')
    
    submissionData.outputFile.name='portal/runCode/outputFile'+str(submission.request.id)+".txt"
    
    for file in os.listdir('.'):
        if(not file.startswith('outputFile')):
            os.remove(file)
            print("file removed")
    
    submissionData.outputFile.name='portal/runCode/outputFile'+str(submission.request.id)+".txt"
    

    print("Return code is:- ",returncode)
    os.chdir(currDir)

    #Error Type

    # #Return Codes
    # # 0 :- Compiled and Running Successful
    # # -1:- Time Limit Exceed
    # # 1 :- Compilation Error
    # # 2 :- Runtime Error
    # # 3 :- Wrong Answer
    # # 4 :- Correct Answer

    if(returncode==-1):
        submissionData.status="Time Limit Exceed"
    elif(returncode==1):
        submissionData.status="Compilation Error"
    elif(returncode==2):
        submissionData.status="Runtime Error"
    else:
        submissionData.status="Successfully Judged"

    print(submissionData.status)
    submissionData.save()
    outputFile.close()
    return returncode
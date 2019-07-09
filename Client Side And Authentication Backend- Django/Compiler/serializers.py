from rest_framework import serializers
from .models import SubmissionData

class SubmissionDataSerializer(serializers.ModelSerializer):
	
	class Meta:
		model=SubmissionData  # what module you are going to serialize
		fields= '__all__'
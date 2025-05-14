from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),  # New root URL pattern
    path('admin-form/', views.admin_form_submission, name='admin_form'),
    path('submit-availability/', views.submit_availability, name='submit_availability'),
    path('update-parameters/', views.update_parameters, name='update_parameters'),
    path('schedules/', views.get_schedules, name='get_schedules'),
    path('generate-schedules/', views.generate_schedule, name='generate_schedules'),
    path('save-schedule/', views.save_schedule, name='save_schedule'),
    path('students/', views.get_students, name='get_students'),  # New endpoint
    path('delete-student/', views.delete_student, name='delete_student'),  # New endpoint
    path('students/<str:student_id>/availability/', views.get_student_availability, name='get_student_availability'),  # New endpoint for getting student availability
]
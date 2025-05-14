from django.contrib import admin
from .models import AdminSubmission, SavedSchedules, Employee

@admin.register(AdminSubmission)
class AdminSubmissionAdmin(admin.ModelAdmin):
    list_display = ('id', 'submitted_at')
    readonly_fields = ('submitted_at',)
    search_fields = ('data',)

@admin.register(SavedSchedules)
class SavedSchedulesAdmin(admin.ModelAdmin):
    list_display = ('id',)
    search_fields = ('schedules',)

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('employee_id', 'student_id', 'first_name', 'last_name', 'email', 'submitted_at')
    search_fields = ('employee_id', 'student_id', 'first_name', 'last_name', 'email')
    readonly_fields = ('submitted_at',)
    fieldsets = (
        ('Basic Information', {
            'fields': ('employee_id', 'student_id', 'first_name', 'last_name', 'email')
        }),
        ('Schedule Information', {
            'fields': ('availability', 'params', 'schedule')
        }),
        ('Timestamps', {
            'fields': ('submitted_at',)
        }),
    )
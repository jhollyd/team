from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from datetime import datetime, timedelta
import math
from .models import AdminSubmission, Employee, SavedSchedules
from .scheduleEngine import ScheduleEngine
import random

# Home view for the root URL
def home(request):
    return HttpResponse("Welcome to the Scheduling Project API.")

# Admin form submission
@csrf_exempt
def admin_form_submission(request):
    if request.method == 'POST':
        try:
            body = json.loads(request.body)
            print("Received request body:", body)  # Debug log
            
            # Create AdminSubmission record
            AdminSubmission.objects.create(data=body)
            
            # Create or update Employee records
            for student in body.get('listofstudents', []):
                original_student_id = student.get('student_id')
                if not (isinstance(original_student_id, str) and original_student_id.isdigit() and len(original_student_id) == 8):
                    return JsonResponse({'error': 'Invalid student_id'}, status=400)
                max_hours = student.get('max_hours', 0)
                if not (isinstance(max_hours, int) and max_hours >= 0):
                    return JsonResponse({'error': 'max_hours must be a non-negative integer'}, status=400)
                priority = student.get('priority', 0)
                if not (isinstance(priority, int) and priority >= 0):
                    return JsonResponse({'error': 'priority must be a non-negative integer'}, status=400)
                f1_status = student.get('f1_status', False)
                if not isinstance(f1_status, bool):
                    return JsonResponse({'error': 'f1_status must be boolean'}, status=400)
                
                # Hash the student ID
                hash_value = 0
                for char in original_student_id:
                    hash_value = ((hash_value << 5) - hash_value) + ord(char)
                    hash_value = hash_value & hash_value  # Convert to 32bit integer
                student_id = str(hash_value)
                    
                # Get existing employee if any
                try:
                    existing_employee = Employee.objects.get(student_id=student_id)
                    # Preserve existing availability
                    availability = existing_employee.availability
                except Employee.DoesNotExist:
                    # Initialize with all busy for new employees
                    availability = ['1' * 96 for _ in range(7)]
                    
                # Create or update Employee record
                employee, created = Employee.objects.update_or_create(
                    student_id=student_id,
                    defaults={
                        'employee_id': student_id,  # Use hashed student_id as employee_id
                        'first_name': student.get('first_name', ''),
                        'last_name': student.get('last_name', ''),
                        'email': student.get('student_email', f'{original_student_id}@umb.edu'),
                        'availability': availability,  # Use existing or new availability
                        'params': {
                            'max_hours': max_hours,
                            'f1_status': f1_status,
                            'priority': priority
                        },
                        'schedule': []  # Initialize empty schedule
                    }
                )
                print(f"{'Created' if created else 'Updated'} employee:", employee.employee_id)  # Debug log
            
            return JsonResponse({'status': 'admin form received and employees created/updated'})
        except Exception as e:
            print("Error in admin_form_submission:", str(e))  # Debug log
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Only POST allowed'}, status=405)

# Submit student availability
@csrf_exempt
def submit_availability(request):
    if request.method == 'PUT':
        body = json.loads(request.body)
        student_id = body['student']['studentId']  # This is now the hashed ID
        original_student_id = body['student']['originalStudentId']  # Get the original ID
        # Filter manual "Available" events
        events = [evt for evt in body['events'] if evt['source'] == 'manual' and evt['title'] == 'Available']
        
        try:
            employee = Employee.objects.get(student_id=student_id)
        except Employee.DoesNotExist:
            return JsonResponse({'error': 'Student not found. Please contact the administrator to add your information.'}, status=404)
        
        # Initialize availability: 7 days, 96 bits each (24 hours * 4 slots/hour)
        availability = ['1' * 96 for _ in range(7)]  # '1' = busy
        
        for event in events:
            try:
                start = datetime.fromisoformat(event['start'].replace('Z', '+00:00'))
                end = datetime.fromisoformat(event['end'].replace('Z', '+00:00')) if event['end'] else start
            except Exception:
                return JsonResponse({'error': 'Invalid date format in availability event'}, status=400)
            day_index = start.weekday()  # 0=Monday, 6=Sunday
            start_hour = start.hour + start.minute / 60
            end_hour = end.hour + end.minute / 60
            start_idx = max(0, min(math.floor(start_hour * 4), 96))
            end_idx = max(0, min(math.ceil(end_hour * 4), 96))
            # Set available slots to '0', ensure string remains 96 chars
            day_str = availability[day_index]
            new_day = (
                day_str[:start_idx] +
                '0' * (end_idx - start_idx) +
                day_str[end_idx:]
            )
            # Pad or trim to 96 chars
            if len(new_day) < 96:
                new_day = new_day + '1' * (96 - len(new_day))
            elif len(new_day) > 96:
                new_day = new_day[:96]
            availability[day_index] = new_day
        
        employee.availability = availability
        employee.save()
        return JsonResponse({'status': 'availability submitted'})
    return JsonResponse({'error': 'Only PUT allowed'}, status=405)

# Update employee parameters
@csrf_exempt
def update_parameters(request):
    if request.method == 'PUT':
        body = json.loads(request.body)
        updates = body.get('updates', [])
        for update in updates:
            try:
                employee = Employee.objects.get(employee_id=update['student_id'])
                employee.params['max_hours'] = update.get('max_hours', employee.params.get('max_hours', 0))
                employee.params['f1_status'] = update.get('f1_status', employee.params.get('f1_status', False))
                employee.params['priority'] = update.get('priority', employee.params.get('priority', 0))
                employee.save()
            except Employee.DoesNotExist:
                return JsonResponse({'error': f"Employee {update['student_id']} not found"}, status=404)
        return JsonResponse({'status': 'parameters updated'})
    return JsonResponse({'error': 'Only PUT allowed'}, status=405)

# Generate schedules
@csrf_exempt
def generate_schedule(request):
    if request.method == 'GET':
        try:
            employee_ids = request.GET.get('employee_ids', '').split(',')
            print('DEBUG: employee_ids from request:', employee_ids)
            all_emps = list(Employee.objects.all().values())
            print('DEBUG: All Employee objects in DB:', all_emps)
            total_hours = int(request.GET.get('total_master_schedule_hours', 40))
            num_schedules = int(request.GET.get('num_schedules_desired', 1))
            min_staff = int(request.GET.get('min_staff_per_shift', 1))
            
            # Validate parameters
            if total_hours <= 0 or total_hours > 168:  # Max 168 hours per week
                return JsonResponse({'error': 'Invalid total hours. Must be between 1 and 168.'}, status=400)
            if min_staff < 1 or min_staff > 10:  # Max 10 staff per shift
                return JsonResponse({'error': 'Invalid minimum staff per time slot. Must be between 1 and 10.'}, status=400)
            if num_schedules < 1 or num_schedules > 5:  # Max 5 schedules
                return JsonResponse({'error': 'Invalid number of schedule options. Must be between 1 and 5.'}, status=400)
            
            if not employee_ids or employee_ids[0] == '':
                return JsonResponse({'error': 'No employees selected'}, status=400)
            
            employees = Employee.objects.filter(employee_id__in=employee_ids)
            if not employees.exists():
                return JsonResponse({'error': 'No employees found'}, status=404)
            
            # Check if any employees have submitted availability
            employees_with_availability = [emp for emp in employees if any(day != '1' * 96 for day in emp.availability)]
            print('DEBUG: employees_with_availability:', [emp.employee_id for emp in employees_with_availability])
            for emp in employees:
                print(f'DEBUG: emp {emp.employee_id} availability:', emp.availability)
                for i, day in enumerate(emp.availability):
                    print(f'DEBUG: emp {emp.employee_id} day {i} length:', len(day))
                    print(f'DEBUG: emp {emp.employee_id} day {i} != all busy:', day != '1' * 96)
            if not employees_with_availability:
                return JsonResponse({'error': 'No employees have submitted their availability'}, status=400)
            
            # Check if any employees have max hours set
            employees_with_hours = [emp for emp in employees if emp.params.get('max_hours', 0) > 0]
            print('DEBUG: employees_with_hours:', [emp.employee_id for emp in employees_with_hours])
            if not employees_with_hours:
                return JsonResponse({'error': 'No employees have max hours set'}, status=400)
            
            # Validate total hours against employee max hours
            total_max_hours = sum(emp.params.get('max_hours', 0) for emp in employees)
            if total_hours > total_max_hours:
                return JsonResponse({'error': f'Total hours ({total_hours}) exceeds total employee max hours ({total_max_hours})'}, status=400)
            
            schedules = []
            optimal_schedule = None
            optimal_bitstrings = None
            for i in range(num_schedules):
                random_seed = None if i == 0 else i * 1000
                engine = ScheduleEngine(
                    employees=employees,
                    max_man_hours=total_hours,
                    min_staff_per_shift=min_staff,
                    random_seed=random_seed
                )
                schedule = engine.schedule()  # {emp_id: [bitstring_day0, ...]}

                # For alternatives, force diversity if too similar to optimal
                if i == 0:
                    optimal_schedule = schedule
                    # Flatten optimal schedule for comparison
                    optimal_bitstrings = ''.join([''.join(days) for days in schedule.values()])
                else:
                    # Flatten current schedule
                    current_bitstrings = ''.join([''.join(days) for days in schedule.values()])
                    # Calculate similarity
                    overlap = sum(1 for a, b in zip(optimal_bitstrings, current_bitstrings) if a == b and a == '1')
                    total = optimal_bitstrings.count('1')
                    similarity = overlap / total if total > 0 else 0
                    # If too similar, force random swaps
                    if similarity > 0.8:
                        # Pick a random employee and a random day, and clear a random shift
                        emp_ids = list(schedule.keys())
                        for _ in range(3):  # Try up to 3 random changes
                            emp_id = random.choice(emp_ids)
                            day_idx = random.randint(0, 4)
                            day_bits = list(schedule[emp_id][day_idx])
                            # Find a shift (run of '1's)
                            in_shift = False
                            for idx, bit in enumerate(day_bits):
                                if bit == '1' and not in_shift:
                                    in_shift = True
                                    shift_start = idx
                                if bit == '0' and in_shift:
                                    shift_end = idx
                                    # Clear this shift
                                    for j in range(shift_start, shift_end):
                                        day_bits[j] = '0'
                                    break
                            schedule[emp_id][day_idx] = ''.join(day_bits)

                # Get next Monday as the base date
                today = datetime.now()
                days_until_monday = (7 - today.weekday()) % 7
                if days_until_monday == 0:  # If today is Monday, use next Monday
                    days_until_monday = 7
                base_date = today.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=days_until_monday)
                
                formatted_schedule = {
                    'entries': []
                }
                
                for emp_id, emp_sched in schedule.items():
                    emp = Employee.objects.get(employee_id=emp_id)
                    events = []
                    
                    for day_idx, bitstring in enumerate(emp_sched):
                        start_slot = None
                        for slot_idx, bit in enumerate(bitstring):
                            if bit == '1':
                                if start_slot is None:
                                    start_slot = slot_idx
                            elif start_slot is not None:
                                # End of a shift
                                start_time = base_date + timedelta(days=day_idx, minutes=start_slot * 15)
                                end_time = base_date + timedelta(days=day_idx, minutes=slot_idx * 15)
                                events.append({
                                    'start': start_time.strftime('%Y-%m-%dT%H:%M:%S'),
                                    'end': end_time.strftime('%Y-%m-%dT%H:%M:%S')
                                })
                                start_slot = None
                        
                        # Handle shift that ends at the end of the day
                        if start_slot is not None:
                            start_time = base_date + timedelta(days=day_idx, minutes=start_slot * 15)
                            end_time = base_date + timedelta(days=day_idx, minutes=len(bitstring) * 15)
                            events.append({
                                'start': start_time.strftime('%Y-%m-%dT%H:%M:%S'),
                                'end': end_time.strftime('%Y-%m-%dT%H:%M:%S')
                            })
                    
                    if events:  # Only add entries with events
                        formatted_schedule['entries'].append({
                            'employee': {
                                'employeeId': emp.employee_id,
                                'firstName': emp.first_name,
                                'lastName': emp.last_name
                            },
                            'events': events
                        })
                
                schedules.append(formatted_schedule)
            
            # Ensure we return exactly the number of schedules requested, even if they are identical
            while len(schedules) < num_schedules:
                schedules.append(schedules[0])
            
            if not schedules:
                return JsonResponse({'error': 'Failed to generate schedules. Not enough available time slots to meet the requirements.'}, status=500)
                
            return JsonResponse({'schedules': schedules})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Only GET allowed'}, status=405)

# Save a schedule
@csrf_exempt
def save_schedule(request):
    if request.method == 'PUT':
        body = json.loads(request.body)
        SavedSchedules.objects.create(schedules=body)
        return JsonResponse({'status': 'schedule saved'})
    return JsonResponse({'error': 'Only PUT allowed'}, status=405)

def hash_employee_id(employee_id):
    hash_value = 0
    for char in employee_id:
        hash_value = ((hash_value << 5) - hash_value) + ord(char)
        hash_value = hash_value & hash_value  # Convert to 32bit integer
    return str(hash_value)

@csrf_exempt
def get_schedules(request):
    employee_ids = request.GET.get('employee_ids', '').split(',')
    hashed_employee_ids = [hash_employee_id(emp_id) for emp_id in employee_ids]
    # Use hashed_employee_ids for database queries
    saved = SavedSchedules.objects.filter(schedules__employee_id__in=hashed_employee_ids)
    schedules = [s.schedules for s in saved]
    return JsonResponse({'schedules': schedules})

# Get student availability
def get_student_availability(request, student_id):
    if request.method == 'GET':
        try:
            employee = Employee.objects.get(student_id=student_id)
            return JsonResponse({
                'availability': employee.availability,
                'params': employee.params
            })
        except Employee.DoesNotExist:
            return JsonResponse({'error': 'Student not found'}, status=404)
    return JsonResponse({'error': 'Only GET allowed'}, status=405)

# Get all students
def get_students(request):
    if request.method == 'GET':
        students = Employee.objects.all()
        return JsonResponse({
            'students': [{
                'id': s.employee_id,
                'studentId': s.student_id,
                'firstName': s.first_name,
                'lastName': s.last_name,
                'email': s.email,
                'maxHours': s.params.get('max_hours', 0),
                'isInternational': s.params.get('f1_status', False),
                'priority': s.params.get('priority', 0),
                'synced': True,
                'hasSubmittedAvailability': any(day != '1' * 96 for day in s.availability)  # Check if any day has availability slots
            } for s in students]
        })
    return JsonResponse({'error': 'Only GET allowed'}, status=405)

# Delete a student
@csrf_exempt
def delete_student(request):
    if request.method == 'DELETE':
        try:
            student_id = request.GET.get('student_id')
            if not student_id:
                return JsonResponse({'error': 'Student ID is required'}, status=400)
            
            employee = Employee.objects.get(student_id=student_id)
            employee.delete()
            return JsonResponse({'status': 'Student deleted successfully'})
        except Employee.DoesNotExist:
            return JsonResponse({'error': 'Student not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Only DELETE allowed'}, status=405)
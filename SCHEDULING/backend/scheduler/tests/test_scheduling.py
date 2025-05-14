from django.test import TransactionTestCase, Client
from django.urls import reverse
import json
from datetime import datetime, timedelta
from ..models import Employee, AdminSubmission, SavedSchedules
from django.db import connection

def hash_student_id(student_id):
    hash_value = 0
    for char in str(student_id):
        hash_value = ((hash_value << 5) - hash_value) + ord(char)
        hash_value = hash_value & hash_value  # Convert to 32bit integer
    return str(hash_value)

class SchedulingSystemTests(TransactionTestCase):
    def setUp(self):
        self.client = Client()
        
        # Create test student
        self.test_student = {
            "student_id": "12345678",
            "first_name": "John",
            "last_name": "Doe",
            "max_hours": 20,
            "f1_status": True,
            "priority": 3
        }
        
        # Create test availability
        self.test_availability = {
            "student": {
                "studentId": hash_student_id("12345678"),
                "originalStudentId": "12345678",
                "firstName": "John",
                "lastName": "Doe"
            },
            "events": [
                {
                    "start": "2024-03-18T09:00:00Z",
                    "end": "2024-03-18T17:00:00Z",
                    "source": "manual",
                    "title": "Available"
                }
            ]
        }

    def test_student_creation(self):
        """Test student creation with various parameters"""
        test_cases = [
            # Valid cases
            {
                "student_id": "12345678",
                "first_name": "John",
                "last_name": "Doe",
                "max_hours": 20,
                "f1_status": True,
                "priority": 3
            },
            # Edge cases
            {
                "student_id": "00000000",
                "first_name": "A",
                "last_name": "B",
                "max_hours": 0,
                "f1_status": False,
                "priority": 0
            },
            # Invalid cases
            {
                "student_id": "123",  # Too short
                "first_name": "",
                "last_name": "",
                "max_hours": -1,
                "f1_status": "yes",  # Should be boolean
                "priority": 6  # Should be 0-5
            }
        ]

        for case in test_cases:
            response = self.client.post(
                "/admin-form/",
                data=json.dumps({"listofstudents": [case]}),
                content_type="application/json"
            )
            print("After creation:", list(Employee.objects.values()))
            if case["student_id"].isdigit() and len(case["student_id"]) == 8:
                self.assertEqual(response.status_code, 200)
                hashed_id = hash_student_id(case["student_id"])
                self.assertTrue(Employee.objects.filter(student_id=hashed_id).exists())
            else:
                self.assertNotEqual(response.status_code, 200)

    def test_availability_submission(self):
        """Test availability submission with various scenarios"""
        # First create a student
        self.client.post(
            "/admin-form/",
            data=json.dumps({"listofstudents": [self.test_student]}),
            content_type="application/json"
        )
        print("After student creation:", list(Employee.objects.values()))

        test_cases = [
            # Valid availability
            {
                "events": [
                    {
                        "start": "2024-03-18T09:00:00Z",
                        "end": "2024-03-18T17:00:00Z",
                        "source": "manual",
                        "title": "Available"
                    }
                ]
            },
            # Full day availability
            {
                "events": [
                    {
                        "start": "2024-03-18T00:00:00Z",
                        "end": "2024-03-18T23:59:59Z",
                        "source": "manual",
                        "title": "Available"
                    }
                ]
            },
            # Invalid date format
            {
                "events": [
                    {
                        "start": "invalid-date",
                        "end": "2024-03-18T17:00:00Z",
                        "source": "manual",
                        "title": "Available"
                    }
                ]
            }
        ]

        for case in test_cases:
            self.test_availability["events"] = case["events"]
            response = self.client.put(
                "/submit-availability/",
                data=json.dumps(self.test_availability),
                content_type="application/json"
            )
            connection.commit()
            print("After availability submission:", list(Employee.objects.values()))
            if "invalid-date" in str(case["events"]):
                self.assertNotEqual(response.status_code, 200)
            else:
                self.assertEqual(response.status_code, 200)

    def test_schedule_generation(self):
        """Test schedule generation with various parameters"""
        # First create a student and submit availability
        self.client.post(
            "/admin-form/",
            data=json.dumps({"listofstudents": [self.test_student]}),
            content_type="application/json"
        )
        self.client.put(
            "/submit-availability/",
            data=json.dumps(self.test_availability),
            content_type="application/json"
        )
        connection.commit()
        # Debug print: check availability in DB
        emp = Employee.objects.get(employee_id=hash_student_id(self.test_student["student_id"]))
        print("DEBUG: Employee availability before schedule generation:", emp.availability)

        test_cases = [
            # Valid parameters
            {
                "total_hours": 40,
                "min_staff": 2,
                "num_schedules": 3
            },
            # Edge cases
            {
                "total_hours": 1,
                "min_staff": 1,
                "num_schedules": 1
            },
            {
                "total_hours": 168,  # Max hours per week
                "min_staff": 10,  # Max staff per shift
                "num_schedules": 5  # Max schedules
            },
            # Invalid parameters
            {
                "total_hours": 0,
                "min_staff": 0,
                "num_schedules": 0
            },
            {
                "total_hours": 169,  # Exceeds max
                "min_staff": 11,  # Exceeds max
                "num_schedules": 6  # Exceeds max
            }
        ]

        for case in test_cases:
            response = self.client.get(
                "/generate-schedule/",
                {
                    "employee_ids": hash_student_id(self.test_student["student_id"]),
                    "total_master_schedule_hours": case["total_hours"],
                    "num_schedules_desired": case["num_schedules"],
                    "min_staff_per_shift": case["min_staff"]
                }
            )
            if (case["total_hours"] <= 0 or case["total_hours"] > 168 or
                case["min_staff"] <= 0 or case["min_staff"] > 10 or
                case["num_schedules"] <= 0 or case["num_schedules"] > 5):
                self.assertNotEqual(response.status_code, 200)
            else:
                self.assertEqual(response.status_code, 200)
                data = json.loads(response.content)
                self.assertIn("schedules", data)
                self.assertEqual(len(data["schedules"]), case["num_schedules"])

    def test_schedule_constraints(self):
        """Test if generated schedules respect all constraints"""
        # Create student and submit availability
        self.client.post(
            "/admin-form/",
            data=json.dumps({"listofstudents": [self.test_student]}),
            content_type="application/json"
        )
        self.client.put(
            "/submit-availability/",
            data=json.dumps(self.test_availability),
            content_type="application/json"
        )
        connection.commit()
        # Debug print: check availability in DB
        emp = Employee.objects.get(employee_id=hash_student_id(self.test_student["student_id"]))
        print("DEBUG: Employee availability before schedule constraints:", emp.availability)

        # Generate schedule
        response = self.client.get(
            "/generate-schedule/",
            {
                "employee_ids": hash_student_id(self.test_student["student_id"]),
                "total_master_schedule_hours": 20,
                "num_schedules_desired": 1,
                "min_staff_per_shift": 1
            }
        )

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        schedule = data["schedules"][0]

        # Test constraints
        for entry in schedule["entries"]:
            # Check total hours
            total_hours = 0
            for event in entry["events"]:
                start = datetime.fromisoformat(event["start"].replace("Z", "+00:00"))
                end = datetime.fromisoformat(event["end"].replace("Z", "+00:00"))
                total_hours += (end - start).total_seconds() / 3600

            self.assertLessEqual(total_hours, self.test_student["max_hours"])

            # Check availability compliance
            for event in entry["events"]:
                start = datetime.fromisoformat(event["start"].replace("Z", "+00:00"))
                end = datetime.fromisoformat(event["end"].replace("Z", "+00:00"))
                
                # Check if shift is within available hours
                is_within_availability = False
                for avail_event in self.test_availability["events"]:
                    avail_start = datetime.fromisoformat(avail_event["start"].replace("Z", "+00:00"))
                    avail_end = datetime.fromisoformat(avail_event["end"].replace("Z", "+00:00"))
                    
                    if (start >= avail_start and end <= avail_end and
                        start.weekday() == avail_start.weekday()):
                        is_within_availability = True
                        break
                
                self.assertTrue(is_within_availability)

    def test_schedule_diversity(self):
        """Test if multiple schedules are sufficiently diverse"""
        # Create student and submit availability
        self.client.post(
            "/admin-form/",
            data=json.dumps({"listofstudents": [self.test_student]}),
            content_type="application/json"
        )
        self.client.put(
            "/submit-availability/",
            data=json.dumps(self.test_availability),
            content_type="application/json"
        )
        connection.commit()
        # Debug print: check availability in DB
        emp = Employee.objects.get(employee_id=hash_student_id(self.test_student["student_id"]))
        print("DEBUG: Employee availability before schedule diversity:", emp.availability)

        # Generate multiple schedules
        response = self.client.get(
            "/generate-schedule/",
            {
                "employee_ids": hash_student_id(self.test_student["student_id"]),
                "total_master_schedule_hours": 20,
                "num_schedules_desired": 3,
                "min_staff_per_shift": 1
            }
        )

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        schedules = data["schedules"]

        # Check if schedules are different
        for i in range(len(schedules)):
            for j in range(i + 1, len(schedules)):
                self.assertNotEqual(
                    json.dumps(schedules[i]),
                    json.dumps(schedules[j]),
                    "Generated schedules should be different"
                ) 
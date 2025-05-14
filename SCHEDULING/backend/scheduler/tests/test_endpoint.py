from django.test import TestCase
from django.urls import reverse
from scheduler.models import Employee
import json

class TestCreateEmployee(TestCase):
    def test_post_to_create_view_creates_object(self):
        # Simulate a POST request to the 'create_object' endpoint
        response = self.client.post(
            reverse("admin_form"),
            data=json.dumps({
                "listofstudents": [
                    {
                        "student_id": 11111111,
                        "student_email": "student1@umb.edu",
                        "first_name": "Alpha",
                        "last_name": "A",
                    },
                    {
                        "student_id": 22222222,
                        "student_email": "student2@umb.edu",
                        "first_name": "Beta",
                        "last_name": "B",
                    },
                    {
                        "student_id": 33333333,
                        "student_email": "student3@umb.edu",
                        "first_name": "Charlie",
                        "last_name": "C",
                    },
                ]
            }),
            content_type="application/json"
        )

        # Assert that the object was created
        self.assertEqual(Employee.objects.count(), 3)
        self.assertEqual(Employee.objects.first().name, "Test Entry")

        # Assert that the response redirects to the 'success' URL
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse("success"))

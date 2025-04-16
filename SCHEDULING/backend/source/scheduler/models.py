from django.db import models
from django.core.exceptions import ValidationError
from scheduler.constants import BITS_PER_DAY


class AdminSubmission(models.Model):
    data = models.JSONField()
    submitted_at = models.DateTimeField(auto_now_add=True)

class StudentSchedule(models.Model):
    student_id = models.CharField(max_length=100)
    schedule = models.JSONField()
    submitted_at = models.DateTimeField(auto_now_add=True)

class Employee(models.Model):
    employee_id = models.CharField(max_length=100, primary_key=True)
    availability = models.JSONField()  # List of 7 strings, each BITS_PER_DAY length
    params = models.JSONField()

    def __str__(self):
        return f"Employee {self.employee_id}"

    def clean(self):
        """Validate availability: 7 days, each with a BITS_PER_DAY-length bitstring of only '0' or '1'."""
        if not isinstance(self.availability, list) or len(self.availability) != 7:
            raise ValidationError("Availability must be a list of 7 bitstrings (Mon–Sun).")

        for bitstring in self.availability:
            if len(bitstring) != BITS_PER_DAY or not set(bitstring).issubset({"0", "1"}):
                raise ValidationError(
                    f"Each day's availability must be a {BITS_PER_DAY}-character binary string."
                )


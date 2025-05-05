from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class AdminSubmission(models.Model):
    data = models.JSONField()
    submitted_at = models.DateTimeField(auto_now_add=True)

class SavedSchedules(models.Model):
    schedules = models.JSONField() # An array of all saved Schedules

class Employee(models.Model):
    employee_id = models.CharField(max_length=100, primary_key=True)
    availability = models.JSONField()  # List of 7 strings, each BITS_PER_DAY length
    params = models.JSONField()  
    '''# params Will contain the following mappings: 
    {'max_hours': int, 
    'f1_status': bool, 
    'priority': int}'''
    student_id = models.CharField(max_length=100)
    schedule = models.JSONField()
    submitted_at = models.DateTimeField(auto_now_add=True)
    email= models.CharField(max_length=100)
    
    

    def generate_block_availability(self):
        availability = []
        totalShift = 14 * 4 ## AV office provides support 14 hours a day
        offSet = 4 * 7 ## Offset to ensure that each string 'starts at 7'
        totalLength = 24 * 4 # Entire day
        while len(availability) < totalShift: ## Will generate a string that is at most totalShift in length and we will prefix and suffix with 0s to suggest a 14 hour work window between 7 am and 9 pm
            block_length = random.randint(1, 5)
            bit = random.randint(0, 1)
            bits_to_add = min(block_length * 4, totalShift - len(availability))  # cap so we don’t overshoot
            availability.extend([str(bit)] * bits_to_add)
        ## Notice that this implies index 28-83 will represent 7-9 am
        return '*' * offSet + ''.join(availability) + '*' * (totalLength - offSet - len(availability)) ## you only get 1's in interval (28, 83) to model that you can only work between 7:00 till 21:00


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


class EmployeeParameters(models.Model):
    student_id = models.CharField(max_length=100)
    min_hours = models.IntegerField(
        null=True,
        blank=True,
        default=5,
        validators=[MinValueValidator(0), MaxValueValidator(50)],
        help_text="Enter the 'minimum working hour' as an integer in range [0,50]. (Default: 5)"
    )
    max_hours = models.IntegerField(
        null=True,
        blank=True,
        default=20,
        validators=[MinValueValidator(0), MaxValueValidator(50)],
        help_text="Enter the 'maximum working hour' as an integer in range [0,50] (Default: 20)"
    )
    preferability = models.IntegerField(
        null=True,
        blank=True,
        default=1,
        validators=[MinValueValidator(0), MaxValueValidator(2)],
        help_text="Enter the 'preferability' as an integer in range [0,2]. (Default: 1)"
    )
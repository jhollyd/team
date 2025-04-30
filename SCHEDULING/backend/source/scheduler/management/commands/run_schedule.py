from django.core.management.base import BaseCommand
from scheduler.models import Employee
from scheduler.scheduleEngine import ScheduleEngine  
import random

class Command(BaseCommand):
    help = 'Run the scheduling engine 10,000 times and keep the top 3 results'
    def compute_emp_availability_counts(self,employees):
        """
        Takes a list of Employee objects and returns a list of 7 strings
        representing the number of employees available at each 15-min block.
        """
        if not employees:
            return [""] * 7
            print("You did not provide a list with any employees")

        # Assume all availabilities are the same length
        num_days = 7
        bits_per_day = len(employees[0].availability[0])
        
        # Initialize the result as 7 lists of zeroes
        counts = [[0] * bits_per_day for _ in range(num_days)]

        for emp in employees:
            for day_idx in range(num_days):
                for bit_idx, bit in enumerate(emp.availability[day_idx]):
                    if bit == '0':  # 0 = available
                        counts[day_idx][bit_idx] += 1

    
        result = [''.join(str(x) for x in day) for day in counts]
        return result

    def handle(self, *args, **kwargs):
        dummy_employees = []
        for i in range(7):
            emp = Employee(
                employee_id=f"EMP{i+1}",
                availability=[Employee().generate_block_availability() for _ in range(7)],
                params={"max_hours": (40 if random.randint(0,1) < 0.8 else 20), "preferential": False}
            )
            dummy_employees.append(emp)

            print(emp.employee_id + ": ")
            print(emp.availability)

        print("-" * 40)
        print("Value at each index represents the number of students AVAILABLE to work during the shift corresponding to that index:")
        output = self.compute_emp_availability_counts(dummy_employees)
        for i, row in enumerate(output):
            print(f"Day {i + 1}: {row}")
        print("-" * 40)

        print("-" * 40)
        

        top_schedules = []  # List of (cost, schedule) tuples

        employeeHourLimitViolationWarning = False

        for iteration in range(1, 50000):
            sE = ScheduleEngine(employees=dummy_employees)
            empIdToSched = sE.schedule()

            employeeHourLimitViolationWarning = employeeHourLimitViolationWarning or (sE.total_emp_hour_limit_violations > 0)

            unfilled = 0
            overstaffed = 0

            for i in range(28, 84):  # Only slots in (28, 83) inclusive - 0 represents 12:00 so 28 would be 7:00, 83 would be 21:00 or 9:00 pm
                for day in range(7):  # Each day
                    count = sum(1 for sched in empIdToSched.values() if sched[day][i] == '1')
                    if count == 0:
                        unfilled += 1
                    elif count > 2:
                        overstaffed += 1

            overstaffed_factor = overstaffed * 10
            cost = unfilled

            top_schedules.append((cost, empIdToSched, sE))
            top_schedules = sorted(top_schedules, key=lambda x: x[0])[:10] ## gather top 10 by cost which is # of unfilled shifts
            ## strategy = gather top 10 by unfilled shifts, sort these by #of overstaffed - to be implemented

            if iteration % 10000 == 0:
                print(f"We are on iteration: {iteration}: cost = {cost}, unfilled = {unfilled}, overstaffed = {overstaffed}...")

        print("\n✅ Top 3 Schedules by Cost:")
        for rank, (cost, _, _) in enumerate(top_schedules, start=1):
            print(f"{rank}. Cost = {cost}")

        # Use best schedule for breakdown
        best_schedule = top_schedules[0][1]
        best_schedule_associated_engine = top_schedules[0][2]

        # Analyze best schedule coverage
        coverage_counts = {
            0: 0,
            1: 0,
            2: 0,
            '2+': 0
        }
        list_uncovered_shifts = [] ## To store data about which shifts are uncovered
        for i in range(28, 84):
            for day in range(7):
                count = sum(1 for sched in best_schedule.values() if sched[day][i] == '1')
                if count == 0:
                    coverage_counts[0] += 1
                    list_uncovered_shifts.append(("day" + str(day), i)) ## Store data about all the shifts that are uncovered
                elif count == 1:
                    coverage_counts[1] += 1
                elif count == 2:
                    coverage_counts[2] += 1
                else:
                    coverage_counts['2+'] += 1

        print("\n--- Shift Coverage Breakdown (Indices 28–83) ---")
        print(f"Shifts with 0 people scheduled  : {coverage_counts[0]}")
        print(f"Shifts with 1 person scheduled  : {coverage_counts[1]}")
        print(f"Shifts with exactly 2 scheduled : {coverage_counts[2]}")
        print(f"Shifts with 3+ people scheduled : {coverage_counts['2+']}")

        for emp_id, sched in best_schedule.items():
            print(f"{emp_id}:")
            for day, bits in zip(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], sched):
                print(f"  {day}: {bits}")
            print("-" * 50)

        total_scheduled_shifts = 0
        for sched in best_schedule.values():
            for day_bits in sched:
                total_scheduled_shifts += day_bits.count('1')

        print(f"\n🔢 Total number of scheduled shifts (in hours) across all employees and days: {total_scheduled_shifts/4}")
        
        print("-" * 40)
        print("Information about each employee's max_hours vs the hours they are scheduled to work")
        for emp in dummy_employees:
            emp_id = emp.employee_id
            max_hours = emp.params.get('max_hours')
            scheduled_hours =  best_schedule_associated_engine.scheduledHoursPerEmployee.get(emp_id, 0)
            print(f"{emp_id}: max_hours = {max_hours}, scheduled_hours = {scheduled_hours}")
        print("-" * 40)

        print(f"The following shifts are uncovered: {list_uncovered_shifts}")
        
        
        
        if(employeeHourLimitViolationWarning):
            print("SCHEDULES ARE BEING PRODUCED THAT VIOLATE MAX EMPLOYEE HOUR CONSTRAINTS, SHOULD NOT OCCUR! PLEASE CHECK IMPLEMENTATION!")

from django.core.management.base import BaseCommand
from scheduler.models import Employee
from scheduler.scheduleEngine import ScheduleEngine  
import random

class Command(BaseCommand):
    help = 'Run the scheduling engine 10,000 times and keep the top 3 results'

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

            top_schedules.append((cost, empIdToSched))
            top_schedules = sorted(top_schedules, key=lambda x: x[0])[:10] ## gather top 10 by cost which is # of unfilled shifts
            ## strategy = gather top 10 by unfilled shifts, sort these by #of overstaffed - to be implemented

            if iteration % 10000 == 0:
                print(f"Iteration {iteration}: cost = {cost}, unfilled = {unfilled}, overstaffed = {overstaffed}")

        print("\n✅ Top 3 Schedules by Cost:")
        for rank, (cost, _) in enumerate(top_schedules, start=1):
            print(f"{rank}. Cost = {cost}")

        # Use best schedule for breakdown
        best_schedule = top_schedules[0][1]

        # Analyze best schedule coverage
        coverage_counts = {
            0: 0,
            1: 0,
            2: 0,
            '2+': 0
        }

        for i in range(28, 84):
            for day in range(7):
                count = sum(1 for sched in best_schedule.values() if sched[day][i] == '1')
                if count == 0:
                    coverage_counts[0] += 1
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
        
        if(employeeHourLimitViolationWarning):
            print("SCHEDULES ARE BEING PRODUCED THAT VIOLATE MAX EMPLOYEE HOUR CONSTRAINTS, SHOULD NOT OCCUR! PLEASE CHECK IMPLEMENTATION!")
        

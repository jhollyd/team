import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))


from typing import List
from .models import Employee
from .constants import BITS_PER_DAY
from .constants import DAYS_OF_WEEK
from .constants import DAYS_OF_WORKING_WEEK
import random

class ScheduleEngine:   
    def __init__(self,
                 employees: List[Employee],
                 max_man_hours: int = 200,
                 valid_work_days: List[str] = DAYS_OF_WEEK,
                 valid_work_hours: tuple = (28, 83),  # 7 AM to 9 PM
                 min_staff_per_shift: int = 1,
                 random_seed: int = None):  # Add random seed parameter
        """
        Initialize the scheduling engine.

        Args:
            employees (List[Employee]): List of employee model instances.
            max_man_hours (int): Total number of hours to be scheduled across all employees.
            valid_work_days (List[str]): Days of the week when scheduling is allowed.
            valid_work_hours (tuple): (start_hour, end_hour) in 24-hour format, representing valid working hours.
            min_staff_per_shift (int): Minimum number of staff required for each time slot to ensure adequate coverage.
            random_seed (int): Seed for randomization to generate different schedules.
        """
        self.employees = employees
        self.max_man_hours = max_man_hours
        self.valid_work_days = valid_work_days
        self.valid_work_hours = valid_work_hours
        self.min_staff_per_shift = min_staff_per_shift
        self.total_emp_hour_limit_violations = 0
        self.scheduledHoursPerEmployee = {}
        self.shift_coverage = {}  # Track coverage for each time slot
        
        # Initialize random seed if provided
        if random_seed is not None:
            random.seed(random_seed)

    def schedule(self) -> dict:
        empToSchedule = {}
        employeeToAvailabilityIslands = self.extract_employee_availability_islands()
        
        # Initialize shift coverage tracking
        for day in range(len(DAYS_OF_WEEK)):
            self.shift_coverage[day] = {slot: 0 for slot in range(BITS_PER_DAY)}
        
        # Sort employees by priority (higher priority first)
        sorted_employees = sorted(
            self.employees,
            key=lambda emp: (
                emp.params.get('priority', 0),
                emp.params.get('f1_status', False)  # International students get higher priority
            ),
            reverse=True
        )
        
        # Only shuffle if we have a random seed (for alternative schedules)
        if hasattr(self, 'random_seed') and self.random_seed is not None:
            # Group employees by priority
            priority_groups = {}
            for emp in sorted_employees:
                priority = emp.params.get('priority', 0)
                if priority not in priority_groups:
                    priority_groups[priority] = []
                priority_groups[priority].append(emp)
            
            # Shuffle within each priority group
            shuffled_employees = []
            for priority in sorted(priority_groups.keys(), reverse=True):
                group = priority_groups[priority]
                random.shuffle(group)
                shuffled_employees.extend(group)
            
            sorted_employees = shuffled_employees
        
        # Calculate target hours based on priority
        total_priority = sum(emp.params.get('priority', 0) + 1 for emp in sorted_employees)  # Add 1 to ensure non-zero
        target_hours = {}
        for emp in sorted_employees:
            priority = emp.params.get('priority', 0) + 1  # Add 1 to ensure non-zero
            # Higher priority employees get proportionally more hours
            target_hours[emp.employee_id] = (priority / total_priority) * self.max_man_hours
        
        # Track remaining and scheduled hours for each employee
        remaining_hours = {
            emp.employee_id: min(
                emp.params.get('max_hours', 0),
                target_hours[emp.employee_id]
            )
            for emp in sorted_employees
        }
        scheduled_hours = {emp.employee_id: 0 for emp in sorted_employees}
        
        # Track total scheduled hours
        total_scheduled_hours = 0
        
        # FIRST PASS: Force minimum staff requirement
        for day in range(len(DAYS_OF_WEEK)):
            # For each day, we'll schedule employees in groups to ensure minimum coverage
            available_employees = [emp for emp in sorted_employees if remaining_hours[emp.employee_id] > 0]
            if not available_employees:
                continue
                
            # Sort by remaining hours (most first)
            available_employees.sort(key=lambda emp: remaining_hours[emp.employee_id], reverse=True)
            
            # Try to schedule employees in groups
            while available_employees:
                # Take the next group of employees (up to min_staff_per_shift)
                group = available_employees[:self.min_staff_per_shift]
                if len(group) < self.min_staff_per_shift:
                    break  # Not enough employees left
                
                # Find a time slot where all group members are available
                common_availability = None
                for emp in group:
                    emp_availability = emp.availability[day]
                    if common_availability is None:
                        common_availability = emp_availability
                    else:
                        # Find common availability
                        common_availability = ''.join('0' if a == '0' and b == '0' else '1' 
                                                    for a, b in zip(common_availability, emp_availability))
                
                if not common_availability or '0' not in common_availability:
                    # No common availability, try next group
                    available_employees = available_employees[1:]
                    continue
                
                # Find the longest available island in common availability
                islands = self.islands_in_day(common_availability)
                if not islands:
                    available_employees = available_employees[1:]
                    continue
                
                # Take the longest island
                start, end = max(islands, key=lambda x: x[1] - x[0])
                
                # Ensure within valid work hours
                if start < self.valid_work_hours[0]:
                    start = self.valid_work_hours[0]
                if end > self.valid_work_hours[1]:
                    end = self.valid_work_hours[1]
                
                # Schedule all group members for this island
                shift_hours = (end - start + 1) / 4
                for emp in group:
                    emp_id = emp.employee_id
                    schedule = empToSchedule.get(emp_id, ["0" * BITS_PER_DAY for _ in range(len(DAYS_OF_WEEK))])
                    
                    allowed = min(shift_hours, remaining_hours[emp_id],
                                self.max_man_hours - total_scheduled_hours)
                    
                    if allowed < 1e-6:
                        continue
                    
                    slots = int(allowed * 4)
                    if slots < 1:
                        continue
                    
                    real_end = start + slots - 1
                    day_bits = list(schedule[day])
                    for i in range(start, real_end + 1):
                        if i < BITS_PER_DAY:
                            day_bits[i] = '1'
                            self.shift_coverage[day][i] += 1
                    
                    schedule[day] = ''.join(day_bits)
                    empToSchedule[emp_id] = schedule
                    scheduled_hours[emp_id] += allowed
                    remaining_hours[emp_id] -= allowed
                    total_scheduled_hours += allowed
                
                # Remove scheduled employees from available list
                available_employees = [emp for emp in available_employees if emp not in group]
        
        # SECOND PASS: Fill remaining hours based on priority
        while total_scheduled_hours < self.max_man_hours:
            available_employees = [emp for emp in sorted_employees if remaining_hours[emp.employee_id] > 0]
            if not available_employees:
                break
            
            # Sort by remaining hours and priority
            available_employees.sort(
                key=lambda emp: (
                    remaining_hours[emp.employee_id],
                    emp.params.get('priority', 0)
                ),
                reverse=True
            )
            scheduled_any = False
            
            for curr_emp in available_employees:
                curr_emp_id = curr_emp.employee_id
                valid_days_set = {i for i, day in enumerate(DAYS_OF_WEEK) if day in self.valid_work_days}
                schedule = empToSchedule.get(curr_emp_id, ["0" * BITS_PER_DAY for _ in range(len(DAYS_OF_WEEK))])
                
                for d in valid_days_set:
                    islands_e_d = employeeToAvailabilityIslands[curr_emp_id][d]
                    if not islands_e_d:
                        continue
                    
                    best_island = self.find_best_island(islands_e_d, d)
                    if not best_island:
                        continue
                    
                    start, end = best_island
                    if start < self.valid_work_hours[0]:
                        start = self.valid_work_hours[0]
                    if end > self.valid_work_hours[1]:
                        end = self.valid_work_hours[1]
                    
                    shift_hours = (end - start + 1) / 4
                    allowed = min(shift_hours, remaining_hours[curr_emp_id],
                                self.max_man_hours - total_scheduled_hours)
                    
                    if allowed < 1e-6:
                        continue
                    
                    slots = int(allowed * 4)
                    if slots < 1:
                        continue
                    
                    real_end = start + slots - 1
                    day_bits = list(schedule[d])
                    for i in range(start, real_end + 1):
                        if i < BITS_PER_DAY:
                            day_bits[i] = '1'
                            self.shift_coverage[d][i] += 1
                    
                    schedule[d] = ''.join(day_bits)
                    empToSchedule[curr_emp_id] = schedule
                    scheduled_hours[curr_emp_id] += allowed
                    remaining_hours[curr_emp_id] -= allowed
                    total_scheduled_hours += allowed
                    scheduled_any = True
                    break
                
                if scheduled_any:
                    break
            
            if not scheduled_any:
                break
        
        print(f"Scheduled {len(empToSchedule)} employees")
        print(f"Total hours scheduled: {total_scheduled_hours}")
        for emp_id, hours in scheduled_hours.items():
            print(f"Employee {emp_id} scheduled hours: {hours}")
        
        return empToSchedule

    def find_day_with_lowest_coverage(self, valid_days_set):
        """Find the day with the lowest average coverage."""
        if not valid_days_set:
            return None
            
        day_scores = {}
        for d in valid_days_set:
            coverage = [self.shift_coverage[d][slot] for slot in range(self.valid_work_hours[0], self.valid_work_hours[1])]
            if coverage:  # Only calculate if there are slots
                day_scores[d] = sum(coverage) / len(coverage)
            else:
                day_scores[d] = float('inf')  # Prefer days with no coverage
        
        return min(day_scores.items(), key=lambda x: x[1])[0]

    def find_best_island(self, islands, day):
        """Find the best island based on coverage and length."""
        if not islands:
            return None
            
        # Score each island based on coverage and length
        island_scores = []
        for start, end in islands:
            # Ensure the island is within valid work hours
            if start < self.valid_work_hours[0]:
                start = self.valid_work_hours[0]
            if end > self.valid_work_hours[1]:
                end = self.valid_work_hours[1]
            
            # Skip if the island is too short after adjustment
            if end - start + 1 < 4:  # Minimum 1 hour
                continue
                
            # Calculate coverage for this island
            coverage = [self.shift_coverage[day][slot] for slot in range(start, end + 1)]
            min_coverage = min(coverage)  # Find the minimum coverage in this island
            avg_coverage = sum(coverage) / len(coverage)
            
            # Calculate how many more staff are needed to meet minimum requirement
            staff_needed = max(0, self.min_staff_per_shift - min_coverage)
            
            # Score calculation:
            # 1. Much higher priority for slots that need more staff
            # 2. Consider both minimum and average coverage
            # 3. Add randomization only for alternative schedules
            base_score = (end - start + 1)  # Base score is the length of the island
            
            # Multiply by a large factor if staff is needed
            if staff_needed > 0:
                score = base_score * (10 ** staff_needed)  # Exponential boost for needed staff
            else:
                score = base_score
            
            # Add randomization only if we have a random seed (for alternative schedules)
            if hasattr(self, 'random_seed') and self.random_seed is not None:
                # Add more randomization for alternative schedules
                score += random.random() * 2.0  # Increased from 0.5 to 2.0
                
                # Add preference for different times of day
                if random.random() < 0.3:  # 30% chance to prefer different times
                    if start < 40:  # Morning preference
                        score *= 1.2
                    elif start > 60:  # Afternoon preference
                        score *= 1.1
            
            island_scores.append((score, (start, end)))
        
        if not island_scores:
            return None
            
        # Return the island with the highest score
        return max(island_scores, key=lambda x: x[0])[1]

    def islands_in_day(self, day_bits: str) -> set[tuple]:
        """Find islands of availability (minimum 1 hour = 4 slots)."""
        islands = []
        i = 0
        while i < len(day_bits):
            if day_bits[i] == '0':  # Found start of availability
                start = i
                while i < len(day_bits) and day_bits[i] == '0':
                    i += 1
                end = i - 1
                if (end - start + 1) >= 4:  # Minimum 1 hour
                    islands.append((start, end))
            else:
                i += 1
        return islands

    def compute_zero_density(self, x: int, y: int, day: str) -> float:
        """Compute the density of available employees in a time slot."""
        d = DAYS_OF_WEEK.index(day)
        total_zeros = 0
        for emp in self.employees:
            avail_str = emp.availability[d]
            total_zeros += avail_str[x:y+1].count('0')
        total_slots = (y - x + 1) * len(self.employees)
        return total_zeros / total_slots if total_slots > 0 else 0.0

    def extract_employee_availability_islands(self) -> dict:
        """Extract availability islands for each employee and day."""
        result = {}
        for emp in self.employees:
            result[emp.employee_id] = {}
            for day_idx, day_bits in enumerate(emp.availability):
                result[emp.employee_id][day_idx] = self.islands_in_day(day_bits)
        return result

            



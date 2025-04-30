import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))


from typing import List
from scheduler.models import Employee
from scheduler.constants import BITS_PER_DAY
from scheduler.constants import DAYS_OF_WEEK
from scheduler.constants import DAYS_OF_WORKING_WEEK
import random

class ScheduleEngine:
    def __init__(self,
                 employees: List[Employee],
                 max_man_hours: int = 200,
                 valid_work_days: List[str] = DAYS_OF_WEEK,
                 valid_work_hours: tuple = (28, 83)): # 0 = 12 am 96 = 11:59 pm, thus 28-83 represents a 14 hour window of 7-9
        """
        Initialize the scheduling engine.

        Args:
            employees (List[Employee]): List of employee model instances.
            max_man_hours (int): Global cap on man-hours across all employees.
            valid_work_days (List[str]): Subset of ["Monday", ..., "Sunday"] - bc could be one day off in a given week for a holiday
            valid_work_hours (tuple): (start_hour, end_hour) in 24-hour format.
        """
        self.employees = employees
        self.max_man_hours = max_man_hours
        self.valid_work_days = valid_work_days
        self.valid_work_hours = valid_work_hours
        self.total_emp_hour_limit_violations = 0
        self.scheduledHoursPerEmployee = {}


        """
        Generate a schedule based on employee availability and global constraints.

        Returns:
            dict: A mapping of employee_id to their weekly schedule.
                  The format of each schedule is defined as a list of 
                  7 bitstrings representing daily assignments.
        """
    def schedule(self) -> dict:
        empToSchedule = {}
        ## Dictionary of employee_id -> listof_availability_islands where
        ## each index of the list contains a set of availability islands
        ## for the day corresponding to that index
        ## E.x. list[1] = {(a,b) | (a,b) is an interval where this person is free on Tuesday}
        employeeToAvailabilityIslands = self.extract_employee_availability_islands()


        employee_ids = {emp.employee_id for emp in self.employees}
        ## print(valid_days_set)

        while len(employee_ids) > 0:
            curr_emp_id = random.sample(list(employee_ids), 1)[0]  
            curr_emp = next(emp for emp in self.employees if emp.employee_id == curr_emp_id) ## coresponding employee object
            emp_max_hours = curr_emp.params.get("max_hours", 0)  # Get the max_hours for the employeee (defaults to 0 if param missing)
           # print("max hours " + str(emp_max_hours))
            
            employee_ids.remove(curr_emp_id)
            valid_days_set = {i for i, day in enumerate(DAYS_OF_WEEK) if day in self.valid_work_days}  #G               


            ## Produce a list of size 7, namely schedule, which will be the schedule of e
            schedule = ["0" * BITS_PER_DAY for _ in range(len(DAYS_OF_WEEK))]
            ## Generate a set of valid work days
            ## For set of all work days - valid work days, produce the corresponding index in schedule
            ## and fill it with BITS_PER_DAY 0s (as this is a day they cannot work)
            ## Note that this is implicitly true because of the previous line
            
            
            ## A variable which will track the hours alloted thus far, allows us to probabalistically 
            ## ensure that as the hoursThusFar gets closer to max hours alloted for the student
            ## the probability of the student getting a shift gets smaller
            hoursThusFarForEmp = 0 
            
            while(len(valid_days_set) > 0):
                # d = random.sample(list(valid_days_set), 1)[0]
                d = self.sample_day_based_on_zero_density(curr_emp_id, valid_days_set, employeeToAvailabilityIslands)
                if(d == None): ## Case: no days with islands left for this individual
                    break
                valid_days_set.remove(d) ## Remove the one you picked so it reduces
                islands_e_d = employeeToAvailabilityIslands[curr_emp_id][d]



                
                if not islands_e_d: ## If no islands on this day, we can't assign them work here (no availability). 
                    continue
                ## Here the current scheme is a 'coin flip' (coin flip is weighed in order to prevent exceeding of max_hour_limit of emp) to decide whether or not emp works on a day
                ## Then, if they are working a 75% chance they work a shift that is 'low density'
                ## and a 25% chance they just work a random shift
                numerator = (emp_max_hours - hoursThusFarForEmp) if (emp_max_hours - hoursThusFarForEmp) > 0 else 0 ## if hoursThusFar is close in magnitude to emp_max_hours, it could still pass coin flip, but on next iteration hoursThusFar will be greater than emp_max_hours, this protects this case as result will be numerator is neg
                employeeHoursFactor = numerator/emp_max_hours
                if random.randint(0,1) < employeeHoursFactor: #0.5: ## 50% of the time you might not work that day
                    continue
                
                

                probPickLowDensity = random.randint(0,1) < 0.75 # some factor to say 20% of the time when available, they will not be scheduled
                day_name = DAYS_OF_WEEK[d]
                lowest_density_island = min(
                    islands_e_d,
                    key=lambda interval: self.compute_zero_density(interval[0], interval[1], day_name)
                )

                # Case where emp has some availability on this day
                chosen_island = random.sample(islands_e_d, 1)[0]
                if(probPickLowDensity):
                    chosen_island = lowest_density_island
                    
                start, end = chosen_island ## Destructure the starting and ending indices of availability island

                ## Ensure that adding in the hours from the chosen island will not tip over the employee past their max possible availability
                if(hoursThusFarForEmp + ((end - start + 1)/4)) > emp_max_hours:
                    continue
                
                
                hoursThusFarForEmp = hoursThusFarForEmp + ((end - start + 1)/4) ## Since we are giving this emp this shift, add it in
                day_bits = ['0'] * BITS_PER_DAY
                for i in range(start, end + 1):
                    day_bits[i] = '1'
                schedule[d] = ''.join(day_bits)
            
           # This should never happen, its really just a flag which triggers a print in the algo-run to warn that it has happened
            if(hoursThusFarForEmp > emp_max_hours): ## Checking if the LIMIT for a student's # of hours (currently 20 * 60 mins) has been exceeded
                self.total_emp_hour_limit_violations =  self.total_emp_hour_limit_violations + (hoursThusFarForEmp - emp_max_hours)
            self.scheduledHoursPerEmployee[curr_emp_id] = hoursThusFarForEmp
            empToSchedule[curr_emp_id] = schedule

            ## While the set of work days is not empty pick a random day d
                ## For the (e,d) pair use a probabilistic methodology to pick the island/subset of island necessary - the shift assigned
                ## Let us name the selected interval of indices (a,b). Append a string of length BITS_PER_DAY with ONLY 1s between a and b
                ## to the index in list meant by d
            ## Now, produce a key value pair <employee_id, schedule> and add to empToSchedule
        
        return empToSchedule

    import random

    def sample_day_based_on_zero_density(self, curr_emp_id, valid_days_set, employeeToAvailabilityIslands):
        day_scores = {}  # day -> best (min) zero density from islands
        
        for d in valid_days_set:
            islands_e_d = employeeToAvailabilityIslands[curr_emp_id][d]
            if not islands_e_d:
                continue  # No availability, skip
            
            day_name = DAYS_OF_WEEK[d]
            min_density = min(
                self.compute_zero_density(start, end, day_name)
                for (start, end) in islands_e_d
            )
            day_scores[d] = min_density
        if not day_scores:
            return None  # no valid day with islands

        # Convert min_densities to weights (lower density = higher weight)
        epsilon = 1e-6
        days = list(day_scores.keys())
        weights = [1 / (day_scores[day] + epsilon) for day in days]

        # Sample based on weights
        return random.choices(days, weights=weights, k=1)[0]

    
    """
    Given a bitstring representing availability for a single day,
    return a set of (start_idx, end_idx) tuples indicating all
    contiguous '0' blocks (islands of availability).

    Args:
        day_bits (str): A string of '0's and '1's representing availability.

    Returns:
        set[tuple]: A set of tuples (start_idx, end_idx), where each tuple
                    represents an inclusive range of available time blocks.
    """
    def islands_in_day(self, day_bits: str) -> set[tuple]:
        new_individual = day_bits[:]
        islands = []

        i = 0
        while i < len(new_individual):
            if new_individual[i] == '0':
                start = i
                while i < len(new_individual) and new_individual[i] == '0':
                    i += 1
                end = i - 1
                if (end - start + 1) >= 4:
                    islands.append((start, end))
            else:
                i += 1

        return islands
    
    def compute_zero_density(self, x: int, y: int, day: str) -> float:
        # Convert day name to index
        d = DAYS_OF_WEEK.index(day)

        total_zeros = 0
        for emp in self.employees:
            avail_str = emp.availability[d]  # Availability string for this day
            total_zeros += avail_str[x:y+1].count('0')

        total_slots = (y - x + 1) * len(self.employees)
        return total_zeros / total_slots if total_slots > 0 else 0.0

    


    """
    Extracts all availability islands for every employee in the database.

    An "island" is a contiguous sequence of '0's in a day's availability string,
    representing a block of available time.

    Returns:
        dict: Mapping of employee_id -> list of sets availability islands
        Each index in list refers to a day, and at each index we will find a set of availability
        islands, where each availability island is an interval (a,b) which is a run of 0s, an interval
        of time that the employee is free on that day
    """
    def extract_employee_availability_islands(self) -> dict:
        empToSetAvailability = {}
        for emp in self.employees:
            emp_island_list = [None] * len(DAYS_OF_WEEK) # Fill to prevent index out of bounds
            for index in range(len(DAYS_OF_WEEK)):
                avail_for_day = emp.availability[index]
               # print("availability string is " + avail_for_day)
                emp_island_list[index] = self.islands_in_day(avail_for_day)
               # print(emp_island_list[index])
            empToSetAvailability[emp.employee_id] = emp_island_list
          #  print(emp_island_list)
           # sys.exit()



        return empToSetAvailability
    

    
    

            



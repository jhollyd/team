import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))


from typing import List
from scheduler.models import Employee
from scheduler.constants import BITS_PER_DAY
from scheduler.constants import DAYS_OF_WEEK
import random

class ScheduleEngine:
    def __init__(self,
                 employees: List[Employee],
                 max_man_hours: int,
                 valid_work_days: List[str],
                 valid_work_hours: tuple):
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
            employeeToAvailabilityIslands = extract_employee_availability_islands()


            ## Generate a set of employee ids
            employee_ids = {emp.employee_id for emp in self.employees}
            ## While the set is not empty, pick an employee e at random
            while(len(employee_ids) > 0):
                curr_emp_id = random.sample(employee_ids, 1) # Pick random
                employee_ids = employee_ids.remove(curr_emp_id) # Remove

                ## Produce a list of size 7, namely schedule, which will be the schedule of e
                schedule = ["0" * BITS_PER_DAY for _ in range(len(DAYS_OF_WEEK))]
                ## Generate a set of valid work days
                ## For set of all work days - valid work days, produce the corresponding index in schedule
                ## and fill it with BITS_PER_DAY 0s (as this is a day they cannot work)
                ## Note that this is implicitly true because of the previous line

                valid_days_set = {i for i, day in enumerate(DAYS_OF_WEEK) if day in self.valid_work_days}

                while(len(valid_days_set) > 0):
                    d = random.sample(valid_days_set, 1)
                    valid_days_set.remove(d) ## Remove the one you picked so it reduces
                    islands_e_d = employeeToAvailabilityIslands[curr_emp_id][d]
                    
                    if not islands_e_d:
                        continue
                    # Case where emp has some availability on this day
                    chosen_island = random.sample(islands_e_d, 1)
                    # Pick an island
                    start, end = chosen_island 
                    day_bits = ['0'] * BITS_PER_DAY
                    for i in range(start, end + 1):
                        day_bits[i] = '1'
                    schedule[d] = ''.join(day_bits)
                empToSchedule[curr_emp_id] = schedule

                ## While the set of work days is not empty pick a random day d
                    ## For the (e,d) pair use a probabilistic methodology to pick the island/subset of island necessary - the shift assigned
                    ## Let us name the selected interval of indices (a,b). Append a string of length BITS_PER_DAY with ONLY 1s between a and b
                    ## to the index in list meant by d
                ## Now, produce a key value pair <employee_id, schedule> and add to empToSchedule
            
            return empToSchedule
        
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
        def islands_in_day(day_bits: str) -> set[tuple]:
            new_individual = day_bits[:]
            islands = []

            i = 0
            while i < len(new_individual):
                if new_individual[i] == 0:
                    start = i
                    while i < len(new_individual) and new_individual[i] == 0:
                        i += 1
                    end = i
                    if end - start >= 4:
                        islands.append((start, end))
                else:
                    i += 1

            return islands
        


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
        def extract_employee_availability_islands() -> dict:
            empToSetAvailability = {}
            for emp in self.employees:
                emp_island_list = [None] * len(DAYS_OF_WEEK) # Fill to prevent index out of bounds
                for index,day in DAYS_OF_WEEK:
                    avail_for_day = emp.availability[index]
                    emp_island_list[index] = islands_in_day(avail_for_day)
                
                empToSetAvailability[emp.employee_id] = emp_island_list



            return empToSetAvailability
        

        def main():
            empIdToSched = self.schedule()

        
        

                



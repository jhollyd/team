Instructions for running employee_schedule_viewer.py

1. Open a terminal and run "pip install streamlit"
2. Save the file employee_schedule_viewer.py wherever u would like (I used vscode)
3. Navigate to where the script is located and run "streamlit run employee_schedule_viewer.py"
4. A new tab should open up in your browser showing a webpage running locally. Click on the "Load Schedule" button on the lefthand side to view the schedule.

Instructions for running the current algo (on some simulated schedules)

1) Nav team\SCHEDULING\backend\source
2) Run command python manage.py run_schedule

How the algorithm works, generally:

Repeat the following algorithm, which generates 1 schedule for each employee, k times where k is sufficiently high to get good results:

Pick a random employee, e (LOOP CONTINUES TILL NO EMPLOYEES LEFT)
    Pick a day d, until you've picked all the days, where you are more likely to pick days for employee e for which they have lesser zero density (days where they are available when no one else is available)
        
        (A) Determine if the employee is working this day, or whether we should not give them a shift on this day and simply continue to the next day: This is done probabalistically - (maxHoursForEmployee - hoursAssignedThusFar)/maxHoursForEmployee. In this way, you can see that THE ORDER IN WHICH YOU PICK THE DAYS MATTERS - the first day you pick
        will have a higher probability of getting a shift than the last day you pick. This is why YOU SHOULD NOT DO THIS RANDOMLY -
        (and this is precisely why we used the heuristic above). The goal is to ensure that days with low zero density availabilities are picked first, since if an employee has some days where they are able to work difficult to man shifts, we should pick these
        days first so that the probability of getting a shift on these days is high.

        Decide which shift on a given day to give the employee: Allot to the employee the shift corresponding to their least zero-dense availability slot for the day OR a random availability slot (this is determined with a probability which is currently 0.75) 
    At the end of this loop, you have produced a schedule for employee e
At the end of this loop you've produced schedules for all employees e

Find the top 5 solutions based on unfilled shifts

Sort these based on the number of overfilled shifts (3+ people working on a shift)

Note that you need not worry about availability violations (as any shift assigned is already a subset of availability).

You also need not worry about employee max hour violations, as the algorithm does not allow any shift to be assigned that would increase hours assigned to exceed the max hours for a given employee

The algorithm is designed essentially to minimize the number of unfilled shifts by making several decisions to reduce unfilled shifts -
firstly, instead of picking days to fill for a given employee in a random order, we pick the days where an employee has the least zero_dense availabilities to fill first. Furthermore, once we decide the employee is working on a given day, we are much more likely
to give them their most zero-dense availability as their shift for the day, with a probability of around 0.75, as opposed to alloting
them one of their availability slots at random as their shift for the day.

Some other notes:

scheduleEngine is extremely modular - it doesn't care on what interval your working day is - i.e. on the bit of length 96, it doesn't
care if you working day is on (a,b) it really only works on one assumption: that the availability schedule provided is valid - in other
words, in any place there is a 0 on the availability schedule IT MUST BE THE CASE THAT THE EMPLOYEE CAN ACTUALLY WORK THERE (i.e. availability is a SUBSET of actual work day). This can be handled with a simple validation step before the running of the algorithm which should identify the valid intervals for each day and process each employees string for each day such that there are ALL 1s in
intervals where the employee cannot work.

Example: If for the next week monday-thursday is normal 7-9, then any bit outside of (28,83) for each 96 bit day encoding should be a 1
as no employee can work there. If Friday is special this week and is a 7-5, then for each employee, no bit on the string corresponding to friday outside of the interval (28, 67) should be a 0.

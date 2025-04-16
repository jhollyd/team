import random

## Function will parse over an availability string
## And collect the islands into an array - where islands are defined
## as a pair of start and end indices (x,y) 
## s.t. on the interval [x,y] the availability string 
## passed as argument has a run of 0s. In other words,
## we are collecting the intervals for which the individual
## is available. Implemented by Yan
def island_collection(individual):
    new_individual = individual[:]
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

def generate_block_availability():
    availability = []
    while len(availability) < 160:
        block_length = random.randint(1, 1)
        bit = random.randint(0, 1)
        bits_to_add = min(block_length * 4, 160 - len(availability))  # cap so we don’t overshoot
        availability.extend([str(bit)] * bits_to_add)
    return ''.join(availability)


## Function will eventually for each nurse use the substring
## [x,y] from each nurses availability in order to determine
## the 'density' of availabiltiy - in other words, density
## is a measurement of how many nurses are available
## to work in the time slot [x,y]. This will be implemented
## by Yan
def compute_zero_density(x, y, nurseDict):
    total_zeros = 0
    num_nurses = len(nurseDict)
    for availability in nurseDict.values():
        segment = availability[x:y+1]
        total_zeros += segment.count('0')
    total_slots = (y - x + 1) * num_nurses
    return total_zeros / total_slots

def compute_shift_coverage(master_schedule, nurses):
    num_slots = 160
    coverage = [0] * num_slots

    for i in range(len(nurses)):
        schedule = master_schedule[i * num_slots : (i + 1) * num_slots]
        for j in range(num_slots):
            if schedule[j] == '1':
                coverage[j] += 1

    print("\n--- Shift Coverage by Time Slot (0–159) ---\n")
    for i, count in enumerate(coverage):
        print(f"{i:3}: {count} nurse(s)", end="\n" if (i+1) % 10 == 0 else "\t")

    unmanned = [i for i, c in enumerate(coverage) if c < 2]
    if unmanned:
        print("\n\n⚠️  These shifts are unmanned (less than 2 nurses):")
        print(unmanned)
    else:
        print("\n✅ All shifts are sufficiently manned (2+ nurses).")

    return coverage

import tkinter as tk

import tkinter as tk

def visualize_availability_density(nurseDict):
    root = tk.Tk()
    root.title("Bit-by-Bit Nurse Availability (160 slots)")

    frame = tk.Frame(root)
    frame.pack(padx=10, pady=10)

    # Title/legend
    tk.Label(frame, text="Nurse Availability per 15-Minute Slot (0 to 159)", font=('Arial', 12, 'bold')).grid(row=0, column=0, columnspan=40, pady=5)
    legend = tk.Frame(frame)
    tk.Label(legend, bg="green", width=2).pack(side="left", padx=2)
    tk.Label(legend, text="2+ available").pack(side="left", padx=5)
    tk.Label(legend, bg="blue", width=2).pack(side="left", padx=2)
    tk.Label(legend, text="1 available").pack(side="left", padx=5)
    tk.Label(legend, bg="red", width=2).pack(side="left", padx=2)
    tk.Label(legend, text="0 available").pack(side="left", padx=5)
    legend.grid(row=1, column=0, columnspan=40, pady=5)

    # Compute per-bit availability
    coverage = [0] * 160
    for schedule in nurseDict.values():
        for i in range(160):
            if schedule[i] == '1':
                coverage[i] += 1

    # Bit-by-bit rendering
    for i in range(160):
        val = coverage[i]
        if val >= 2:
            color = "green"
        elif val == 1:
            color = "blue"
        else:
            color = "red"

        row = i // 32 + 2  # 5 rows total
        col = i % 32
        tk.Label(frame, bg=color, width=2, height=1, relief="solid").grid(row=row, column=col, padx=1, pady=1)

    root.mainloop()

    import tkinter as tk

def generateSolutions(nurses, nurseDict):
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

    islandMap = {}
    for nurse in nurses:
        weekly_availability = nurseDict[nurse]
        day_to_islands = {}
        for i, day in enumerate(days):
            day_slice = weekly_availability[i*32:(i+1)*32]
            bits = [int(b) for b in day_slice]
            islands = island_collection(bits)
            day_to_islands[day] = islands
        islandMap[nurse] = day_to_islands

    maxHoursDict = {nurse: 40 for nurse in nurses}

    master_schedule = ""
    for nurse in nurses:
        weekly_bits = ""
        for i, day in enumerate(days):
            islands = islandMap[nurse][day]
            if not islands:
                weekly_bits += "0" * 32
                continue

            best_island = None
            best_density = float('inf')
            for (start, end) in islands:
                abs_start = i * 32 + start
                abs_end = i * 32 + end - 1
                density = compute_zero_density(abs_start, abs_end, nurseDict)
                if density < best_density:
                    best_density = density
                    best_island = (start, end)
                
            ## otherwise, if the nurse has an availability, pick an island that will be their shift 
            ## However, when you have a max hour constraint per student that should factor into the probability of the coin flip of whether
            ## They work on a given day - p(work on a given day) = (student_max_hours - hours_allotted_thus_far)//student_max_hours OR 0
            ## If there is no shift s in islands where hours_allotted_thus_far + s.length < maxHours
            ## Another implications of this is that we should iterate through the days at random - otherwise it will be that you have
            ## higher odds to give a shift on an earlier day in the week than later days of the week
                best_island = random.sample(islands, 1)[0]

            shift = ["0"] * 32
            s, e = best_island
            for j in range(s, e):
                shift[j] = "1"
            weekly_bits += "".join(shift)

        master_schedule += weekly_bits

    return master_schedule

def analyze_shift_coverage(master_schedule, nurses):
    total_bits = 160
    counts = {0: 0, 1: 0, 2: 0, '2+': 0}

    for i in range(total_bits):
        nurses_working = 0
        for n in range(len(nurses)):
            idx = n * total_bits + i
            if master_schedule[idx] == '1':
                nurses_working += 1

        if nurses_working == 0:
            counts[0] += 1
        elif nurses_working == 1:
            counts[1] += 1
        elif nurses_working == 2:
            counts[2] += 1
        else:
            counts['2+'] += 1

    print("\n--- Shift Coverage Breakdown ---")
    print(f"Shifts with 0 nurses (unfilled):     {counts[0]}")
    print(f"Shifts with 1 nurse  (underfilled):  {counts[1]}")
    print(f"Shifts with exactly 2 nurses:        {counts[2]}")
    print(f"Shifts with more than 2 nurses:      {counts['2+']}")



def main():
    nurseDict = {}
    nurses = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
    for nurse in nurses:
        nurseDict[nurse] = generate_block_availability()
    top_solutions = []
    count = 0
    for i in range(10000):
        count = count + 1
        if(count % 500 == 0):
            print("Iteration: " + str(count))
        master_schedule = generateSolutions(nurses, nurseDict)

        # Count unfilled shifts
        unfilled_count = 0
        for j in range(160):  # 160 slots total
            column_total = 0
            for nurse_idx in range(len(nurses)):
                idx = nurse_idx * 160 + j
                if master_schedule[idx] == '1':
                    column_total += 1
            if column_total == 0:
                unfilled_count += 1

        # Store this solution
        top_solutions.append((unfilled_count, master_schedule))

        # Keep only top 3 (lowest unfilled shifts)
        top_solutions = sorted(top_solutions, key=lambda x: x[0])[:3]

    # Done — top_solutions contains the 3 best (least unfilled shifts)
    print("\nTop 3 Solutions (Least Unfilled Shifts):")
    for rank, (count, schedule) in enumerate(top_solutions, start=1):
        print(f"{rank}. Unfilled shifts: {count}")
    
    # Use the best solution found
    master_schedule = top_solutions[0][1]

    print("\n--- Final Schedule (Best Found) ---\n")
    for idx, nurse in enumerate(nurses):
        availability = nurseDict[nurse]
        schedule = master_schedule[idx * 160 : (idx + 1) * 160]

        print(f"Nurse {nurse} Availability : {availability}")
        print(f"Nurse {nurse} Work Schedule: {schedule}")
        print("-" * 80)

    analyze_shift_coverage(master_schedule, nurses)

main()

        

       




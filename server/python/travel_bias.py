import sys
import json
import random
import datetime

def calculate_cost(start, end, mode, pax, date_str, include_acc, meals_mask, actual_dist_str):
    # Deterministic seed based on route (excluding preferences & pax)
    # pax is excluded so transport cost stays consistent for Car/Bike
    input_str = f"{start.lower()}-{end.lower()}-{mode}-{date_str}"
    seed_value = sum(ord(c) for c in input_str)
    random.seed(seed_value)

    # Use actual distance from the map route
    try:
        dist_val = float(actual_dist_str)
    except:
        dist_val = 0

    if dist_val > 0.1:
        base_distance = dist_val
    else:
        # Fallback if no route distance provided
        base_distance = random.randint(30, 150)

    # ---- MILEAGE-BASED FUEL COST (INR) ----
    # Petrol price: ~₹105/litre (India avg)
    petrol_price = 105

    # Mileage (km per litre) for fuel-based vehicles
    mileage = {
        'Car': 20,    # car mileage 20 km/l as requested
        'Bike': 45,   # bike mileage 45 km/l as requested
    }

    # Ticket-based per-km rates for public transport
    ticket_rates = {
        'Train': 0.80,           # sleeper class avg
        'Bus': 1.20,             # state transport avg
        'Public Transport': 0.50  # metro/local
    }

    # Average speeds (km/h) for ETA calculation - UPDATED for India
    avg_speeds = {
        'Car': 40,
        'Bike': 45,
        'Train': 60,
        'Bus': 42,
        'Public Transport': 25
    }

    # Weekend / Holiday check
    date_obj = datetime.datetime.strptime(date_str, "%Y-%m-%d")
    is_weekend = date_obj.weekday() >= 5
    demand_multiplier = 1.0
    holiday_name = None

    if is_weekend:
        demand_multiplier = 1.1
        holiday_name = "Weekend Surcharge"

    # --- Transport Cost ---
    if mode in mileage:
        # Fuel cost = (distance / mileage) * petrol_price  (shared, NOT per pax)
        litres_needed = base_distance / mileage[mode]
        transport_cost = int(litres_needed * petrol_price * demand_multiplier)
    else:
        # Ticket cost = distance * rate * pax
        rate = ticket_rates.get(mode, 1.0)
        transport_cost = int(base_distance * rate * pax * demand_multiplier)

    # --- Estimated Travel Time (seconds) ---
    speed = avg_speeds.get(mode, 50)
    estimated_time_seconds = int((base_distance / speed) * 3600)

    # --- Food Cost ---
    # Realistic per-person meal costs in India:
    # Breakfast: ₹80-150, Lunch: ₹120-250, Dinner: ₹120-250
    bf_cost = random.randint(80, 150)
    lunch_cost = random.randint(120, 250)
    dinner_cost = random.randint(120, 250)

    meal_flags = [m == '1' for m in meals_mask.split(',')]

    total_food_cost = 0
    if len(meal_flags) >= 3:
        if meal_flags[0]: total_food_cost += (bf_cost * pax)
        if meal_flags[1]: total_food_cost += (lunch_cost * pax)
        if meal_flags[2]: total_food_cost += (dinner_cost * pax)

    # --- Accommodation ---
    accommodation_cost = 0
    if include_acc == 'true' and base_distance > 50:
        # Budget hotel: ₹600-1500 per room, 2 people per room
        rooms_needed = max(1, (pax + 1) // 2)
        per_room = random.randint(600, 1500)
        accommodation_cost = int(rooms_needed * per_room)

    # --- Miscellaneous (tolls, parking, entry fees) ---
    fixed_misc = random.randint(30, 100)   # tolls, parking
    per_person_misc = random.randint(30, 100)  # entry fees per person
    misc_cost = fixed_misc + (per_person_misc * pax)

    total_cost = transport_cost + total_food_cost + accommodation_cost + misc_cost

    # Tips
    tips_db = [
        f"Book {mode} tickets in advance for better prices.",
        "Carry a reusable water bottle to save money.",
        "Check weather before packing.",
        "Early morning travel avoids traffic and heat.",
        f"Compare prices across platforms for {mode} bookings.",
        "Keep digital copies of all IDs and tickets."
    ]
    selected_tips = random.sample(tips_db, 2)
    tips_str = " ".join(selected_tips)

    return {
        "totalCost": total_cost,
        "currency": "INR",
        "isHoliday": is_weekend,
        "holidayName": holiday_name,
        "estimatedTimeSeconds": estimated_time_seconds,
        "breakdown": {
            "transport": transport_cost,
            "food": total_food_cost,
            "accommodation": accommodation_cost,
            "miscellaneous": misc_cost
        },
        "tips": tips_str
    }

if __name__ == "__main__":
    try:
        if len(sys.argv) < 8:
            print(json.dumps({"error": "Insufficient arguments"}))
            sys.exit(1)

        start = sys.argv[1]
        dest = sys.argv[2]
        mode = sys.argv[3]
        pax = int(sys.argv[4])
        date = sys.argv[5]
        include_acc = sys.argv[6]
        meals_mask = sys.argv[7]

        actual_dist = "0"
        if len(sys.argv) > 8:
            actual_dist = sys.argv[8]

        result = calculate_cost(start, dest, mode, pax, date, include_acc, meals_mask, actual_dist)
        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

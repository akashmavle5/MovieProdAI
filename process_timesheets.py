import pandas as pd
import psycopg2
from decimal import Decimal

# ---------- Database Connection ----------
conn = psycopg2.connect(
    host="localhost",
    database="movie_paymaster",
    user="postgres",        # change if needed
    password="Vansh1707" # change this
)
cur = conn.cursor()

# ---------- Step 1: Read Timesheet CSV ----------
try:
    timesheet_df = pd.read_csv("timesheet_upload.csv")
    print("✅ CSV file loaded successfully.")
except FileNotFoundError:
    print("❌ Error: 'timesheet_upload.csv' file not found. Place it in the same folder as this script.")
    exit()

# ---------- Helper Function ----------
def to_float(value):
    """Convert Decimal to float safely"""
    return float(value) if isinstance(value, Decimal) else value

# ---------- Step 2: Process Each Row ----------
summary = {}
total_payroll = 0

for _, row in timesheet_df.iterrows():
    artist_type_id = int(row['artist_type_id'])
    work_date = row['work_date']
    hours_worked = float(row['hours_worked'])
    overtime_hours = float(row.get('overtime_hours', 0))
    comments = row.get('comments', None)

    # Insert timesheet record
    cur.execute("""
        INSERT INTO timesheets (artist_type_id, work_date, hours_worked, overtime_hours, comments)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING timesheet_id;
    """, (artist_type_id, work_date, hours_worked, overtime_hours, comments))
    timesheet_id = cur.fetchone()[0]

    # ---------- Step 3: Fetch Pay Rules ----------
    cur.execute("""
        SELECT base_rate, overtime_rate, meal_penalty_rate, holiday_bonus_rate
        FROM rules WHERE artist_type_id = %s
        ORDER BY effective_date DESC LIMIT 1;
    """, (artist_type_id,))
    rule = cur.fetchone()

    if not rule:
        print(f"⚠️ No rule found for artist_type_id {artist_type_id}")
        continue

    base_rate, overtime_rate, meal_penalty_rate, holiday_bonus_rate = map(to_float, rule)

    # ---------- Step 4: Calculate Payment ----------
    gross_pay = base_rate
    overtime_pay = overtime_hours * overtime_rate
    meal_penalty = meal_penalty_rate if hours_worked > 8 else 0
    holiday_bonus = base_rate * (holiday_bonus_rate - 1) if "holiday" in str(comments).lower() else 0
    total_pay = gross_pay + overtime_pay + meal_penalty + holiday_bonus

    # ---------- Step 5: Insert Payment ----------
    cur.execute("""
        INSERT INTO payments (timesheet_id, artist_type_id, gross_pay, overtime_pay, meal_penalty, holiday_bonus, total_pay)
        VALUES (%s, %s, %s, %s, %s, %s, %s);
    """, (timesheet_id, artist_type_id, gross_pay, overtime_pay, meal_penalty, holiday_bonus, total_pay))

    # ---------- Step 6: Add to Summary ----------
    summary[artist_type_id] = summary.get(artist_type_id, 0) + total_pay
    total_payroll += total_pay

conn.commit()
print("\n✅ Timesheets processed and payments calculated successfully.\n")

# ---------- Step 7: Display Payroll Summary ----------
print("📊 Payroll Summary by Artist Type:")
print("-" * 50)

# Fetch category names
for artist_type_id, total in summary.items():
    cur.execute("SELECT category_name FROM artist_types WHERE artist_type_id = %s;", (artist_type_id,))
    category = cur.fetchone()[0]
    print(f"{category:<25} → ${total:,.2f}")

print("-" * 50)
print(f"💰 Total Payroll for All Artists: ${total_payroll:,.2f}")

cur.close()
conn.close()

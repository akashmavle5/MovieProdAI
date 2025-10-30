import json
import random
import psycopg2  # For PostgreSQL. Use mysql.connector if you're using MySQL.

# ---------- Database Connection ----------
conn = psycopg2.connect(
    host="localhost",
    database="movie_paymaster",
    user="postgres",      # Change this if using MySQL or another username
    password="Vansh1707"
)
cur = conn.cursor()

# ---------- Step 1: Create Tables (if not exist) ----------
cur.execute("""
CREATE TABLE IF NOT EXISTS artist_types (
    artist_type_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);
""")

cur.execute("""
CREATE TABLE IF NOT EXISTS rules (
    rule_id SERIAL PRIMARY KEY,
    artist_type_id INT REFERENCES artist_types(artist_type_id) ON DELETE CASCADE,
    base_rate DECIMAL(10,2),
    overtime_rate DECIMAL(10,2),
    meal_penalty_rate DECIMAL(10,2),
    holiday_bonus_rate DECIMAL(10,2),
    mileage_rate DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'USD',
    effective_date DATE DEFAULT CURRENT_DATE,
    expiration_date DATE DEFAULT CURRENT_DATE + INTERVAL '1 year'
);
""")

cur.execute("""
CREATE TABLE IF NOT EXISTS special_conditions (
    condition_id SERIAL PRIMARY KEY,
    artist_type_id INT REFERENCES artist_types(artist_type_id) ON DELETE CASCADE,
    condition_name VARCHAR(100),
    description TEXT,
    compensation_rate DECIMAL(10,2),
    unit VARCHAR(50) DEFAULT 'per day'
);
""")
conn.commit()

# ---------- Step 2: Load JSON Data ----------
with open("union_pay_rules.json", "r") as file:
    data = json.load(file)

# Remove duplicates and normalize capitalization
categories = sorted(set([entry["Category"].strip().title() for entry in data]))

# ---------- Step 3: Insert Artist Types ----------
for category in categories:
    cur.execute("""
        INSERT INTO artist_types (category_name, description)
        VALUES (%s, %s)
        ON CONFLICT (category_name) DO NOTHING;
    """, (category, f"{category} artist type as per union agreement"))

conn.commit()

# ---------- Step 4: Insert Default Rule Entries ----------
for category in categories:
    cur.execute("SELECT artist_type_id FROM artist_types WHERE category_name = %s;", (category,))
    artist_id = cur.fetchone()[0]

    # Generate random default rates (you can replace with actual Paymaster data)
    base_rate = random.uniform(800, 2500)
    overtime = round(base_rate * 1.5 / 8, 2)
    meal_penalty = random.uniform(50, 150)
    holiday_bonus = random.uniform(1.5, 2.0)
    mileage = random.uniform(0.50, 1.00)

    cur.execute("""
        INSERT INTO rules (artist_type_id, base_rate, overtime_rate, meal_penalty_rate, holiday_bonus_rate, mileage_rate)
        VALUES (%s, %s, %s, %s, %s, %s);
    """, (artist_id, base_rate, overtime, meal_penalty, holiday_bonus, mileage))

conn.commit()

# ---------- Step 5: Insert Special Conditions ----------
conditions = [
    ("Hazard Pay", "Compensation for dangerous work environment"),
    ("Travel Per Diem", "Daily allowance for travel expenses"),
    ("Overnight Allowance", "Allowance for overnight stays on location")
]

for category in categories:
    cur.execute("SELECT artist_type_id FROM artist_types WHERE category_name = %s;", (category,))
    artist_id = cur.fetchone()[0]

    for cond_name, desc in conditions:
        rate = random.uniform(80, 250)
        cur.execute("""
            INSERT INTO special_conditions (artist_type_id, condition_name, description, compensation_rate)
            VALUES (%s, %s, %s, %s);
        """, (artist_id, cond_name, desc, rate))

conn.commit()

print("✅ Database successfully populated with artist types, rules, and special conditions.")

cur.close()
conn.close()
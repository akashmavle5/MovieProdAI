import re
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "paymaster",
    "user": "postgres",
    "password": "Vansh1707"  # ← replace with your actual password
}

# Load extracted CSV
df = pd.read_csv("union_pay_rules.csv")

# Connect to PostgreSQL
conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()

# Insert artist types dynamically
artist_types = set()
for cat in df["category"]:
    first_word = cat.split()[0].capitalize()
    artist_types.add(first_word)

for artist in artist_types:
    cur.execute(
        "INSERT INTO artist_types (type_name) VALUES (%s) ON CONFLICT (type_name) DO NOTHING;",
        (artist,)
    )

# Insert rules
records = []
for _, row in df.iterrows():
    category = str(row["category"])
    rule_type = str(row["rule_type"])
    raw_val = str(row["value"]).strip()

# Clean non-numeric characters and fix extra dots
if pd.isna(raw_val) or not re.search(r"\d", raw_val):
    value = None
else:
    # Remove extra dots/commas (keep only first dot)
    clean_val = re.sub(r"[^\d.]", "", raw_val)
    if clean_val.count(".") > 1:
        parts = clean_val.split(".")
        clean_val = parts[0] + "." + "".join(parts[1:])
    try:
        value = float(clean_val)
    except ValueError:
        value = None

    page = int(row["page"])

    # Map artist type from first word
    artist_name = category.split()[0].capitalize()
    cur.execute("SELECT id FROM artist_types WHERE type_name = %s;", (artist_name,))
    artist_id = cur.fetchone()[0]

    records.append((artist_id, rule_type, category, value, page))

execute_values(
    cur,
    """
    INSERT INTO rules (artist_type_id, rule_type, category, value, page)
    VALUES %s
    """,
    records
)

conn.commit()
cur.close()
conn.close()
print(f"✅ Successfully imported {len(records)} pay rules into PostgreSQL!")

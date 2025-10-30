from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import psycopg2
from io import BytesIO

app = FastAPI(title="Movie Payroll API")
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # you can restrict this later to ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Allow your React app to talk to the backend ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_CONFIG = dict(
    host="localhost",
    database="movie_paymaster",
    user="postgres",
    password="Vansh1707"
)

def get_conn():
    return psycopg2.connect(**DB_CONFIG)

@app.get("/summary/monthly")
def get_monthly_summary():
    conn = get_conn()
    df = pd.read_sql("SELECT * FROM monthly_payroll_summary ORDER BY month_start DESC;", conn)
    conn.close()
    return df.to_dict(orient="records")

@app.get("/summary/weekly")
def get_weekly_summary():
    conn = get_conn()
    df = pd.read_sql("SELECT * FROM weekly_payroll_summary ORDER BY week_start DESC;", conn)
    conn.close()
    return df.to_dict(orient="records")

@app.post("/upload_timesheet")
def upload_timesheet(file: UploadFile = File(...)):
    df = pd.read_csv(BytesIO(file.file.read()))
    conn = get_conn()
    cur = conn.cursor()
    for _, row in df.iterrows():
        cur.execute("""
            INSERT INTO timesheets (artist_type_id, work_date, hours_worked, overtime_hours, comments)
            VALUES (%s,%s,%s,%s,%s);
        """, (int(row['artist_type_id']), row['work_date'], float(row['hours_worked']),
              float(row.get('overtime_hours', 0)), row.get('comments', None)))
    conn.commit()
    cur.close()
    conn.close()
    return {"status": "success", "rows": len(df)}

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload_timesheet")
async def upload_timesheet(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
        print("\n✅ Uploaded CSV preview:")
        print(df.head())
        return {"message": f"Received {len(df)} records from {file.filename}"}
    except Exception as e:
        print("❌ Error processing file:", e)
        return {"error": "Invalid file format or upload failed."}
    
    from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io

app = FastAPI()

# ✅ Allow React frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🧮 Simple Pay Rule Configuration
BASE_RATES = {
    "Performer": 200,
    "Stunt": 300,
    "Background": 150
}

OVERTIME_RATE = 1.5   # 1.5x for overtime
PER_DIEM = 50         # fixed daily allowance
OVERTIME_THRESHOLD = 8  # hours

@app.post("/upload_timesheet")
async def upload_timesheet(file: UploadFile = File(...)):
    try:
        # Read CSV into DataFrame
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))

        # Validate columns
        required_cols = {"artist_id", "date", "hours_worked", "role"}
        if not required_cols.issubset(df.columns):
            return {"error": f"Missing columns. Required: {list(required_cols)}"}

        # Payroll calculation
        payroll_summary = []
        for _, row in df.iterrows():
            role = row["role"]
            hours = row["hours_worked"]
            base_rate = BASE_RATES.get(role, 0)

            # calculate overtime and regular hours
            regular_hours = min(hours, OVERTIME_THRESHOLD)
            overtime_hours = max(0, hours - OVERTIME_THRESHOLD)

            regular_pay = regular_hours * base_rate
            overtime_pay = overtime_hours * base_rate * OVERTIME_RATE
            total_pay = regular_pay + overtime_pay + PER_DIEM

            payroll_summary.append({
                "artist_id": row["artist_id"],
                "role": role,
                "hours_worked": hours,
                "regular_pay": regular_pay,
                "overtime_pay": overtime_pay,
                "per_diem": PER_DIEM,
                "total_pay": total_pay
            })

        result_df = pd.DataFrame(payroll_summary)
        total_records = len(result_df)

        return {
            "message": f"Processed {total_records} records successfully.",
            "data": payroll_summary
        }

    except Exception as e:
        print("❌ Error:", e)
        return {"error": str(e)}

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd, io, psycopg2
from psycopg2.extras import execute_batch

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Payroll rules ---
BASE_RATES = {"Performer": 200, "Stunt": 300, "Background": 150}
OVERTIME_RATE = 1.5
PER_DIEM = 50
OVERTIME_THRESHOLD = 8

# --- Database connection details ---
DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "paymaster",
    "user": "postgres",
    "password": "your_db_password_here"   # 🔒 replace this
}

def insert_payroll_rows(rows):
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        query = """
            INSERT INTO artist_payment_summary
            (artist_id, role, hours_worked, regular_pay, overtime_pay, per_diem, total_pay)
            VALUES (%(artist_id)s, %(role)s, %(hours_worked)s, %(regular_pay)s,
                    %(overtime_pay)s, %(per_diem)s, %(total_pay)s);
        """
        execute_batch(cur, query, rows)
        conn.commit()
        cur.close()
        conn.close()
        print(f"✅ {len(rows)} records saved to database.")
    except Exception as e:
        print("❌ Database insert error:", e)


@app.post("/upload_timesheet")
async def upload_timesheet(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
        df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

        required_cols = {"artist_id", "date", "hours_worked", "role"}
        if not required_cols.issubset(df.columns):
            return {"error": f"Missing columns. Required: {list(required_cols)}"}

        payroll_summary = []
        for _, r in df.iterrows():
            role = r["role"]
            hrs = r["hours_worked"]
            base = BASE_RATES.get(role, 0)
            regular = min(hrs, OVERTIME_THRESHOLD) * base
            overtime = max(0, hrs - OVERTIME_THRESHOLD) * base * OVERTIME_RATE
            total = regular + overtime + PER_DIEM
            payroll_summary.append({
                "artist_id": r["artist_id"],
                "role": role,
                "hours_worked": hrs,
                "regular_pay": regular,
                "overtime_pay": overtime,
                "per_diem": PER_DIEM,
                "total_pay": total
            })

        # 💾 Save to DB
        insert_payroll_rows(payroll_summary)

        return {
            "message": f"Processed & saved {len(payroll_summary)} records.",
            "data": payroll_summary
        }
    except Exception as e:
        print("❌ Error:", e)
        return {"error": str(e)}

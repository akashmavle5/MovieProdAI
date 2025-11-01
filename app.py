# ============================
# 🎬 Movie Payroll API + AI Assistant (FINAL STABLE VERSION)
# ============================

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import pandas as pd
import psycopg2, psycopg2.extras
import io, os, datetime
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from dotenv import load_dotenv

# ==========================================
# 🚀 APP INITIALIZATION
# ==========================================
app = FastAPI(title="🎬 Movie Payroll API + AI Assistant")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables (for API key)
load_dotenv()

# ✅ Debug check — confirm key loaded
OPENAI_KEY = os.getenv("OPENAI_API_KEY")
if OPENAI_KEY:
    print("✅ Loaded OpenAI API key:", OPENAI_KEY[:10], "********")
else:
    print("❌ OPENAI_API_KEY not found. Check your .env file.")

# PostgreSQL Configuration
DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "paymaster",
    "user": "postgres",
    "password": "Vansh1707"
}

# =====================================================
# 📤 Upload Timesheet — Payroll Processing
# =====================================================
@app.post("/upload_timesheet")
async def upload_timesheet(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
        df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

        required_cols = {"artist_id", "role", "hours_worked"}
        if not required_cols.issubset(df.columns):
            return {"error": f"Missing columns. Required: {list(required_cols)}"}

        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        results = []

        for _, row in df.iterrows():
            role = str(row["role"]).capitalize()
            hours = float(row["hours_worked"])
            artist_id = int(row["artist_id"])
            is_holiday = str(row.get("is_holiday", "FALSE")).strip().upper() == "TRUE"
            is_hazard = str(row.get("is_hazard", "FALSE")).strip().upper() == "TRUE"

            # 1️⃣ Get artist_type_id
            cur.execute("SELECT id FROM artist_types WHERE LOWER(type_name) = LOWER(%s) LIMIT 1;", (role,))
            artist_type = cur.fetchone()
            artist_type_id = artist_type["id"] if artist_type else None

            if not artist_type_id:
                base_rate, overtime_rate, per_diem = 0, 1.5, 0
            else:
                def get_rule(rule_type):
                    cur.execute("""
                        SELECT value FROM rules
                        WHERE artist_type_id = %s AND rule_type = %s
                        LIMIT 1;
                    """, (artist_type_id, rule_type))
                    r = cur.fetchone()
                    return r["value"] if r else None

                base_rate = get_rule("base_rate") or 0
                overtime_rate = get_rule("overtime_rate") or 1.5
                per_diem = get_rule("per_diem") or 0

            # 2️⃣ Payroll Computation
            regular_hours = min(hours, 8)
            overtime_hours = max(0, min(hours - 8, 4))
            doubletime_hours = max(0, hours - 12)

            regular_pay = regular_hours * base_rate
            overtime_pay = overtime_hours * base_rate * overtime_rate
            doubletime_pay = doubletime_hours * base_rate * 2.0

            holiday_bonus = regular_pay * 0.5 if is_holiday else 0
            hazard_bonus = base_rate * 0.2 * hours if is_hazard else 0

            total_pay = (
                regular_pay + overtime_pay + doubletime_pay +
                per_diem + holiday_bonus + hazard_bonus
            )

            # 3️⃣ Insert into DB
            cur.execute("""
                INSERT INTO artist_payment_summary
                (artist_id, role, hours_worked, regular_pay, overtime_pay, per_diem, total_pay)
                VALUES (%s, %s, %s, %s, %s, %s, %s);
            """, (
                artist_id, role, hours,
                regular_pay + holiday_bonus,
                overtime_pay + doubletime_pay + hazard_bonus,
                per_diem,
                total_pay
            ))

            results.append({
                "artist_id": artist_id,
                "role": role,
                "hours_worked": hours,
                "regular_pay": regular_pay,
                "overtime_pay": overtime_pay,
                "per_diem": per_diem,
                "holiday_bonus": holiday_bonus,
                "hazard_bonus": hazard_bonus,
                "total_pay": total_pay
            })

        conn.commit()
        cur.close()
        conn.close()

        return {"message": f"✅ Processed {len(results)} records successfully", "data": results}

    except Exception as e:
        print("❌ Error:", e)
        return {"error": str(e)}

# =====================================================
# 💰 Fetch Payments Endpoint
# =====================================================
@app.get("/payments")
def get_payments():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT id, artist_id, role, hours_worked, regular_pay,
                   overtime_pay, per_diem, total_pay, upload_date
            FROM artist_payment_summary
            ORDER BY id DESC
            LIMIT 100;
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return {"data": rows}
    except Exception as e:
        print("❌ Error fetching payments:", e)
        return {"error": str(e)}

# =====================================================
# 📄 Deal Memo Generator
# =====================================================
@app.get("/generate_deal_memo/{artist_id}")
def generate_deal_memo(artist_id: int):
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT * FROM artist_payment_summary
            WHERE artist_id = %s
            ORDER BY upload_date DESC
            LIMIT 1;
        """, (artist_id,))
        record = cur.fetchone()
        cur.close()
        conn.close()

        if not record:
            return {"error": f"No record found for artist_id {artist_id}"}

        output_dir = os.path.join(os.getcwd(), "deal_memos")
        os.makedirs(output_dir, exist_ok=True)
        filename = f"deal_memo_{artist_id}_{datetime.date.today()}.pdf"
        filepath = os.path.join(output_dir, filename)

        c = canvas.Canvas(filepath, pagesize=letter)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(220, 750, "🎬 Deal Memo Summary")
        c.setFont("Helvetica", 12)
        y = 700
        for key, value in record.items():
            c.drawString(100, y, f"{key}: {value}")
            y -= 20
        c.setFont("Helvetica-Oblique", 10)
        c.drawString(100, 80, f"Generated on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        c.save()

        return FileResponse(filepath, media_type="application/pdf", filename=filename)

    except Exception as e:
        print("❌ PDF generation error:", e)
        return {"error": str(e)}

# =====================================================
# 🤖 AI Assistant (LangChain + OpenAI — Final FIXED VERSION)
# =====================================================
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
from pydantic import BaseModel
import os

# ✅ Load .env file
load_dotenv()

# ✅ Get environment variables
api_key = os.getenv("OPENAI_API_KEY")
org_id = os.getenv("OPENAI_ORG_ID")
project_id = os.getenv("OPENAI_PROJECT_ID")

# 🚨 Validate key
if not api_key:
    raise ValueError("❌ OPENAI_API_KEY missing in .env file")

# ✅ Set environment variables for SDK
os.environ["OPENAI_API_KEY"] = api_key
if org_id:
    os.environ["OPENAI_ORG_ID"] = org_id
if project_id:
    os.environ["OPENAI_PROJECT_ID"] = project_id

print("✅ Loaded OpenAI API key:", api_key[:15], "********")

# ✅ Initialize ChatOpenAI
# (Passing API key explicitly fixes the 401 + project argument issues)
llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.3,
    openai_api_key=api_key,   # ✅ Force key use, even if it's `sk-proj`
)

# ✅ Define prompt
prompt = ChatPromptTemplate.from_template("""
You are a payroll assistant for the movie industry union Paymaster 2025-2026.
Answer user questions about payroll, overtime, per diems, bonuses, and rates.

If the question is about rates, refer to:
- The 'rules' table.
If about total pay, refer to:
- The 'artist_payment_summary' table.

User: {input}
Assistant:
""")

# ✅ Input schema for FastAPI
class ChatRequest(BaseModel):
    message: str

# ✅ Chat endpoint
@app.post("/chat")
async def chat_with_ai(request: ChatRequest):
    try:
        user_input = request.message.strip()
        if not user_input:
            return {"error": "Missing input message"}

        chain = prompt | llm
        response = chain.invoke({"input": user_input})
        return {"reply": response.content}

    except Exception as e:
        print("❌ AI Error:", e)
        return {"error": str(e)}









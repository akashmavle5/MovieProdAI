# ============================
# 🎬 Movie Payroll API + AI Assistant (FINAL HYBRID RAG VERSION)
# ============================

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from pydantic import BaseModel
import pandas as pd
import psycopg2, psycopg2.extras
import io, os, datetime, re
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from dotenv import load_dotenv
from urllib.parse import urlparse
from typing import Optional, List
from PyPDF2 import PdfReader

# ==========================================
# 🚀 APP INITIALIZATION
# ==========================================
app = FastAPI(title="🎬 MovieProdAI — Payroll & AI Assistant")

# ==========================================
# 🌐 CORS CONFIGURATION
# ==========================================
origins = [
    "https://fancy-jelly-a6995a.netlify.app",
    "http://localhost:5173",
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 🏠 Root Route — Health Check
# ==========================================
@app.get("/", response_class=HTMLResponse)
def home():
    return """
    <html><head><title>🎬 MovieProdAI</title></head>
    <body style='font-family: Arial; text-align: center; padding-top: 80px;'>
        <h1>✅ MovieProdAI API is running successfully!</h1>
        <p>Timesheet upload, payroll summary, and AI assistant are active.</p>
    </body></html>
    """

# ==========================================
# 🔐 ENVIRONMENT VARIABLES
# ==========================================
load_dotenv()
OPENAI_KEY = os.getenv("OPENAI_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

# ==========================================
# 🗄️ DATABASE CONFIGURATION
# ==========================================
if DATABASE_URL:
    parsed = urlparse(DATABASE_URL)
    DB_CONFIG = {
        "host": parsed.hostname,
        "port": parsed.port or 5432,
        "dbname": parsed.path.lstrip("/"),
        "user": parsed.username,
        "password": parsed.password,
    }
else:
    DB_CONFIG = {
        "host": "dpg-d436lupr0fns73emvnpg-a.oregon-postgres.render.com",
        "port": 5432,
        "dbname": "paymaster_db",
        "user": "paymaster_db_user",
        "password": "xaLU8XvhQjvH2nKBNKnB1zL5fPACyatV",
    }

# ==========================================
# 📤 Upload Timesheet — Payroll Processing
# ==========================================
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
            role = str(row["role"]).strip().lower()
            hours = float(row["hours_worked"])
            artist_id = int(row["artist_id"])
            is_holiday = str(row.get("is_holiday", "FALSE")).strip().upper() == "TRUE"
            is_hazard = str(row.get("is_hazard", "FALSE")).strip().upper() == "TRUE"

            cur.execute("""
                SELECT id FROM artist_types WHERE LOWER(type_name) LIKE %s LIMIT 1;
            """, (f"%{role}%",))
            artist_type = cur.fetchone()
            artist_type_id = artist_type["id"] if artist_type else None

            if not artist_type_id:
                cur.execute("""
                    INSERT INTO artist_types (type_name) VALUES (%s) RETURNING id;
                """, (role.capitalize(),))
                artist_type_id = cur.fetchone()["id"]
                cur.execute("""
                    INSERT INTO rules (artist_type_id, rule_type, value)
                    VALUES
                    (%s, 'base_rate', 100),
                    (%s, 'overtime_rate', 1.5),
                    (%s, 'per_diem', 50);
                """, (artist_type_id, artist_type_id, artist_type_id))
                conn.commit()

            def get_rule(rule_type):
                cur.execute("""
                    SELECT value FROM rules
                    WHERE artist_type_id = %s AND rule_type = %s LIMIT 1;
                """, (artist_type_id, rule_type))
                r = cur.fetchone()
                return r["value"] if r else None

            base_rate = get_rule("base_rate") or 100
            overtime_rate = get_rule("overtime_rate") or 1.5
            per_diem = get_rule("per_diem") or 50

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

            cur.execute("""
                INSERT INTO artist_payment_summary
                (artist_id, role, hours_worked, regular_pay, overtime_pay, per_diem, total_pay)
                VALUES (%s, %s, %s, %s, %s, %s, %s);
            """, (
                artist_id, role.capitalize(), hours,
                regular_pay + holiday_bonus,
                overtime_pay + doubletime_pay + hazard_bonus,
                per_diem, total_pay
            ))

            results.append({
                "artist_id": artist_id,
                "role": role.capitalize(),
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

# ==========================================
# 💰 Fetch Payments Endpoint
# ==========================================
@app.get("/payments")
def get_payments():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT id, artist_id, role, hours_worked, regular_pay,
                   overtime_pay, per_diem, total_pay, upload_date
            FROM artist_payment_summary
            ORDER BY id DESC LIMIT 100;
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return {"data": rows}
    except Exception as e:
        print("❌ Error fetching payments:", e)
        return {"error": str(e)}

# ==========================================
# 📄 Deal Memo Generator
# ==========================================
@app.get("/generate_deal_memo/{artist_id}")
def generate_deal_memo(artist_id: int):
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT * FROM artist_payment_summary
            WHERE artist_id = %s ORDER BY upload_date DESC LIMIT 1;
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
        c.drawString(100, 80, f"Generated on: {datetime.datetime.now()}")
        c.save()
        return FileResponse(filepath, media_type="application/pdf", filename=filename)

    except Exception as e:
        print("❌ PDF generation error:", e)
        return {"error": str(e)}

# ==========================================
# 🤖 ChatGPT Assistant (General Payroll Queries)
# ==========================================
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("❌ OPENAI_API_KEY missing in .env or Render settings")

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.3, openai_api_key=api_key)
prompt = ChatPromptTemplate.from_template("""
You are a payroll assistant for the movie industry union Paymaster 2025-2026.
Answer user questions about payroll, overtime, per diems, bonuses, and rates.

If the question is about rates, refer to 'rules' table.
If about total pay, refer to 'artist_payment_summary' table.

User: {input}
Assistant:
""")

class ChatRequest(BaseModel):
    message: str

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

# ==========================================
# 📚 RAG System — Upload & Query Documents
# ==========================================
def _extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(pdf_bytes))
    text = "\n".join([page.extract_text() or "" for page in reader.pages])
    return " ".join(text.split())

def _chunk(text: str, size: int = 1500, overlap: int = 200) -> List[str]:
    chunks, start = [], 0
    while start < len(text):
        end = start + size
        chunks.append(text[start:end])
        start = end - overlap
        if start < 0: start = 0
    return chunks

@app.post("/rag/upload")
async def rag_upload(file: UploadFile = File(...), title: Optional[str] = Form(None)):
    """Upload & index a PDF or TXT into PostgreSQL documents table."""
    try:
        filename = file.filename or "document"
        raw = await file.read()
        if filename.lower().endswith(".pdf"):
            content_text = _extract_text_from_pdf_bytes(raw)
        elif filename.lower().endswith(".txt"):
            content_text = raw.decode("utf-8", errors="ignore")
        else:
            return {"error": "Unsupported file type. Upload PDF or TXT."}

        if not content_text.strip():
            return {"error": "No readable text found in document."}

        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO documents (title, content) VALUES (%s, %s) RETURNING id;",
            (title or filename, content_text)
        )
        doc_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        return {"message": f"✅ Indexed '{filename}' successfully!", "doc_id": doc_id}

    except Exception as e:
        print("RAG upload error:", e)
        return {"error": str(e)}

@app.post("/rag/ask")
async def rag_ask(payload: dict):
    """Ask questions over uploaded docs. Uses FTS + GPT fallback."""
    try:
        question = (payload.get("question") or "").strip()
        if not question:
            return {"error": "Missing question text."}

        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT id, title, content,
                   ts_rank_cd(tsv, plainto_tsquery('english', %s)) AS rank
            FROM documents
            WHERE tsv @@ plainto_tsquery('english', %s)
            ORDER BY rank DESC LIMIT 3;
        """, (question, question))
        rows = cur.fetchall()
        cur.close()
        conn.close()

        if not rows:
            return {"answer": "No matching content found in uploaded union documents.", "sources": []}

        # Build a limited context for GPT
        context_parts = []
        for r in rows:
            snippet = r["content"][:1200]
            context_parts.append(f"### Source: {r['title']} (id={r['id']})\n{snippet}")
        context = "\n\n".join(context_parts)

        prompt_text = f"""
You are a union payroll assistant. Use the following context from official union documents.
If you don't find an answer, say "Not found in current policy documents."

Question: {question}

Context:
{context}
"""
        response = llm.invoke(prompt_text)
        final_answer = getattr(response, "content", str(response))
        return {"answer": final_answer, "sources": rows}

    except Exception as e:
        print("RAG ask error:", e)
        return {"error": str(e)}

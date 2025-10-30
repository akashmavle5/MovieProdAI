# ============================
# Movie Paymaster Rule Extractor
# Author: Vansh Shriwastava
# Date: 2025
# ============================

import fitz  # PyMuPDF
import re
import json
import pandas as pd


PDF_PATH = "Paymaster 2025-2026 (Aug 2025)-11.pdf"
doc = fitz.open(PDF_PATH)

print(f"[INFO] Loaded '{PDF_PATH}' with {len(doc)} pages")


pdf_text = ""
for page in doc:
    pdf_text += page.get_text("text") + "\n"


patterns = {
    "Category": r"(Performer|Actor|Stunt|Coordinator|Pilot|Dancer|Musician|Model|Crew|Technician|Background Actor|Stand-in|Dubbing Artist)",
    "Base Rate": r"(?:Base|Daily|Hourly|Weekly)\s*(?:Rate|Pay)[:\-]?\s*(?:₹|\$)?\s*([\d,]+)",
    "Overtime Rate": r"(?:Overtime|OT)\s*(?:Rate|Pay|Multiplier)?[:\-]?\s*(?:x)?\s*([0-9.]+)",
    "Per Diem": r"(?:Per\s*Diem|Meal\s*Allowance|Lodging)[:\-]?\s*(?:₹|\$)?\s*([\d,]+)",
    "Mileage": r"(?:Mileage|Travel\s*Allowance)[:\-]?\s*(?:₹|\$)?\s*([\d,]+)\s*(?:per\s*(?:km|mile))?",
    "Meal Penalty": r"(?:Meal\s*Penalty|Meal\s*Deduction)[:\-]?\s*(?:₹|\$)?\s*([\d,]+)",
    "Holiday Pay": r"(?:Holiday|Festival|Hazard|Night)\s*(?:Pay|Bonus)?[:\-]?\s*(?:₹|\$)?\s*([\d,]+|[0-9.]+x)"
}


records = []
lines = pdf_text.split("\n")

for i, line in enumerate(lines):
    entry = {}
    for key, pattern in patterns.items():
        match = re.search(pattern, line, re.IGNORECASE)
        if match:
            entry[key] = match.group(1).strip()
    
    if "Category" in entry:
        
        context = " ".join(lines[i:i+5])
        for key, pattern in patterns.items():
            match = re.search(pattern, context, re.IGNORECASE)
            if match and key not in entry:
                entry[key] = match.group(1).strip()
        records.append(entry)


unique_records = []
seen = set()

for rec in records:
    cat = rec.get("Category")
    if cat and cat not in seen:
        seen.add(cat)
        unique_records.append(rec)

print(f"[INFO] Extracted {len(unique_records)} unique artist pay categories")


json_path = "union_pay_rules.json"
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(unique_records, f, indent=4, ensure_ascii=False)


csv_path = "union_pay_rules.csv"
df = pd.DataFrame(unique_records)
df.to_csv(csv_path, index=False, encoding="utf-8")

print(f"[SUCCESS] Exported data to:\n- {json_path}\n- {csv_path}")

import fitz  # PyMuPDF
import pandas as pd
import re

pdf_path = "Paymaster 2025-2026 (Aug 2025)-11.pdf"
rules = []

# Open the document
doc = fitz.open(pdf_path)
page_count = len(doc)

for page_num, page in enumerate(doc, start=1):
    text = page.get_text("text")
    lines = text.split("\n")

    for line in lines:
        if not line.strip():
            continue

        match = re.match(r"(.+?)\s*[:\-]\s*\$?([\d,.]+)", line)
        if match:
            category = match.group(1).strip()
            value = match.group(2).replace(",", "")
            try:
                value = float(value)
            except ValueError:
                pass

            # Identify rule type
            if "overtime" in category.lower():
                rule_type = "overtime_rate"
            elif "per diem" in category.lower():
                rule_type = "per_diem"
            elif "base" in category.lower():
                rule_type = "base_rate"
            elif "holiday" in category.lower():
                rule_type = "holiday_bonus"
            elif "meal" in category.lower():
                rule_type = "meal_penalty"
            else:
                rule_type = "other"

            rules.append({
                "page": page_num,
                "category": category,
                "rule_type": rule_type,
                "value": value
            })

# Close the document
doc.close()

# Convert and save
df = pd.DataFrame(rules)
df.to_csv("union_pay_rules.csv", index=False)
df.to_json("union_pay_rules.json", orient="records", indent=4)

print(f"✅ Extraction complete! {len(df)} entries found across {page_count} pages.")

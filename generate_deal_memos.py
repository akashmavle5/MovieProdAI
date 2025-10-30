import psycopg2
import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

# ---------- Database Connection ----------
conn = psycopg2.connect(
    host="localhost",
    database="movie_paymaster",
    user="postgres",        # Change this
    password="Vansh1707" # Change this
)

# ---------- Step 1: Fetch Data ----------
query = "SELECT * FROM artist_payment_summary ORDER BY artist_category, work_date;"
df = pd.read_sql(query, conn)

if df.empty:
    print("⚠️ No data found in artist_payment_summary. Run your timesheet processor first.")
    conn.close()
    exit()

# ---------- Step 2: Generate PDF per Artist ----------
styles = getSampleStyleSheet()

for category in df['artist_category'].unique():
    artist_df = df[df['artist_category'] == category]
    filename = f"DealMemo_{category.replace(' ', '_')}.pdf"

    doc = SimpleDocTemplate(filename, pagesize=letter)
    elements = []

    # Title
    elements.append(Paragraph(f"Deal Memo - {category}", styles['Title']))
    elements.append(Spacer(1, 12))

    # Table data
    table_data = [['Work Date', 'Hours Worked', 'Overtime', 'Gross Pay', 'Overtime Pay', 'Meal Penalty', 'Total Pay']]
    for _, row in artist_df.iterrows():
        table_data.append([
            str(row['work_date']),
            f"{row['hours_worked']:.2f}",
            f"{row['overtime_hours']:.2f}",
            f"${row['gross_pay']:.2f}",
            f"${row['overtime_pay']:.2f}",
            f"${row['meal_penalty']:.2f}",
            f"${row['total_pay']:.2f}"
        ])

    # Add totals row
    total_sum = artist_df['total_pay'].sum()
    table_data.append(['', '', '', '', '', 'Total:', f"${total_sum:.2f}"])

    table = Table(table_data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightblue),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('BACKGROUND', (-2, -1), (-1, -1), colors.beige),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ]))

    elements.append(table)
    elements.append(Spacer(1, 12))
    elements.append(Paragraph("Generated automatically by Movie Billing System", styles['Normal']))

    doc.build(elements)
    print(f"✅ Generated: {filename}")

conn.close()
print("\nAll deal memos generated successfully.")

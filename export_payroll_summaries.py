import psycopg2
import pandas as pd

conn = psycopg2.connect(
    host="localhost",
    database="movie_paymaster",
    user="postgres",
    password="Vansh1707"
)

for view_name in ["weekly_payroll_summary", "monthly_payroll_summary"]:
    df = pd.read_sql(f"SELECT * FROM {view_name} ORDER BY 1,3;", conn)
    filename = f"{view_name}.csv"
    df.to_csv(filename, index=False)
    print(f"✅ Exported {view_name} → {filename}")

conn.close()

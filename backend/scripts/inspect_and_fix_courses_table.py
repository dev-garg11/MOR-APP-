import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import engine

def inspect_and_fix_table():
    with engine.connect() as conn:
        res = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'courses';"))
        cols = res.fetchall()
        print("Existing columns in courses table:", cols)

        # Alter table to add any missing columns
        alter_statements = [
            "ALTER TABLE courses ADD COLUMN IF NOT EXISTS slug VARCHAR(120);",
            "ALTER TABLE courses ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'General';",
            "ALTER TABLE courses ADD COLUMN IF NOT EXISTS level VARCHAR(50) DEFAULT 'Beginner to Advanced';",
            "ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration VARCHAR(100) DEFAULT '6 Months';",
            "ALTER TABLE courses ADD COLUMN IF NOT EXISTS fees NUMERIC(10,2) DEFAULT 0;",
            "ALTER TABLE courses ADD COLUMN IF NOT EXISTS emi VARCHAR(100);",
            "ALTER TABLE courses ADD COLUMN IF NOT EXISTS thumbnail VARCHAR(500);",
            "ALTER TABLE courses ADD COLUMN IF NOT EXISTS tag VARCHAR(100);",
            "ALTER TABLE courses ADD COLUMN IF NOT EXISTS short_desc TEXT;",
            "ALTER TABLE courses ADD COLUMN IF NOT EXISTS full_desc TEXT;",
            "ALTER TABLE courses ADD COLUMN IF NOT EXISTS tools JSONB;",
            "ALTER TABLE courses ADD COLUMN IF NOT EXISTS outcomes JSONB;",
            "ALTER TABLE courses ADD COLUMN IF NOT EXISTS requirements JSONB;",
            "ALTER TABLE courses ADD COLUMN IF NOT EXISTS career_roles JSONB;",
            "ALTER TABLE courses ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'draft';",
            "ALTER TABLE courses ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();",
            "ALTER TABLE courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();",
        ]

        for stmt in alter_statements:
            print("Executing:", stmt)
            conn.execute(text(stmt))
        conn.commit()

        # Re-check columns
        res2 = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'courses';"))
        print("\nUpdated columns in courses table:", res2.fetchall())

if __name__ == "__main__":
    inspect_and_fix_table()


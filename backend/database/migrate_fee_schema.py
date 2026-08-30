import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import engine


STATEMENTS = [
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0",
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS fee_due_date DATE",
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS login_id VARCHAR(50)",
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_students_login_id ON students(login_id) WHERE login_id IS NOT NULL",
    """
    CREATE TABLE IF NOT EXISTS fee_payments (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id),
        amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
        payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
        payment_mode VARCHAR(30) NOT NULL DEFAULT 'cash',
        notes TEXT,
        received_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """,
    "CREATE INDEX IF NOT EXISTS idx_fee_payments_student ON fee_payments(student_id)",
    "CREATE INDEX IF NOT EXISTS idx_fee_payments_date ON fee_payments(payment_date)",
]


def migrate() -> None:
    with engine.begin() as connection:
        for statement in STATEMENTS:
            connection.execute(text(statement))
    print("Fee schema migration completed successfully.")


if __name__ == "__main__":
    migrate()

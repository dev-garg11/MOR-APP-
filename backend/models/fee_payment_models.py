import sys
from pathlib import Path
from sqlalchemy import Column, Date, ForeignKey, Integer, Numeric, String, Text, TIMESTAMP
from sqlalchemy.sql import func

_backend_root = str(Path(__file__).resolve().parent.parent)
if _backend_root not in sys.path:
    sys.path.insert(0, _backend_root)

from database import Base



class FeePayment(Base):
    __tablename__ = "fee_payments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_date = Column(Date, nullable=False, server_default=func.current_date())
    payment_mode = Column(String(30), nullable=False, default="cash")
    notes = Column(Text, nullable=True)
    received_by = Column(String(100), nullable=True)
    transaction_ref = Column(String(100), nullable=True, index=True)
    receipt_number = Column(String(100), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())


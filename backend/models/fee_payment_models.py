from sqlalchemy import Column, Date, ForeignKey, Integer, Numeric, String, Text, TIMESTAMP
from sqlalchemy.sql import func
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


class StudentEmi(Base):
    __tablename__ = "student_emis"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    emi_number = Column(Integer, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    due_date = Column(Date, nullable=False)
    status = Column(String(30), nullable=False, default="pending")  # pending, paid, overdue
    payment_date = Column(Date, nullable=True)
    payment_mode = Column(String(50), nullable=True)
    transaction_reference = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
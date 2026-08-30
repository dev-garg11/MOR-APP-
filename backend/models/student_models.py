from sqlalchemy import Column, Integer, String, Numeric, Date, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from database import Base
from models.lead_models import Lead

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    login_id = Column(String(50), unique=True, nullable=True, index=True)
    password_hash = Column(String(255), nullable=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(15), nullable=False)
    email = Column(String(100))
    course = Column(String(100), nullable=False)
    batch = Column(String(50))
    mode = Column(String(20), default="offline")
    enrollment_date = Column(Date, server_default=func.current_date())
    fees_total = Column(Numeric(10, 2))
    fees_paid = Column(Numeric(10, 2), default=0)
    discount_amount = Column(Numeric(10, 2), default=0, nullable=False)
    fee_due_date = Column(Date, nullable=True)
    status = Column(String(30), default="active")
    created_at = Column(TIMESTAMP, server_default=func.now())

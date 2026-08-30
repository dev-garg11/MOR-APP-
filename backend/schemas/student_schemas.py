from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from decimal import Decimal

class StudentCreate(BaseModel):
    lead_id: Optional[int] = None
    name: str
    phone: str
    email: Optional[str] = None
    course: str
    batch: Optional[str] = None
    mode: Optional[str] = "offline"
    fees_total: Optional[Decimal] = None
    fees_paid: Optional[Decimal] = Decimal("0")
    discount_amount: Optional[Decimal] = Decimal("0")
    fee_due_date: Optional[date] = None

class StudentUpdate(BaseModel):
    batch: Optional[str] = None
    mode: Optional[str] = None
    status: Optional[str] = None

class StudentResponse(BaseModel):
    id: int
    login_id: Optional[str] = None
    lead_id: Optional[int] = None
    name: str
    phone: str
    email: Optional[str] = None
    course: str
    batch: Optional[str] = None
    mode: str
    enrollment_date: Optional[date] = None
    fees_total: Optional[Decimal] = None
    fees_paid: Optional[Decimal] = None
    discount_amount: Decimal
    fee_due_date: Optional[date] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

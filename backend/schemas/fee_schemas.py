from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class FeePlanUpdate(BaseModel):
    fees_total: Optional[Decimal] = Field(default=None, ge=0)
    discount_amount: Optional[Decimal] = Field(default=None, ge=0)
    fee_due_date: Optional[date] = None


class FeePaymentCreate(BaseModel):
    student_id: int
    amount: Decimal = Field(gt=0)
    payment_date: Optional[date] = None
    payment_mode: str = "cash"
    notes: Optional[str] = None


class FeePaymentUpdate(BaseModel):
    amount: Optional[Decimal] = Field(default=None, gt=0)
    payment_date: Optional[date] = None
    payment_mode: Optional[str] = None
    notes: Optional[str] = None


class FeePaymentResponse(BaseModel):
    id: int
    student_id: int
    amount: Decimal
    payment_date: date
    payment_mode: str
    notes: Optional[str] = None
    received_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class FeeSummary(BaseModel):
    student_id: int
    student_name: str
    fees_total: Decimal
    discount_amount: Decimal
    payable_amount: Decimal
    fees_paid: Decimal
    pending_amount: Decimal
    fee_due_date: Optional[date] = None
    fee_status: str
    payments: list[FeePaymentResponse] = []


class PaymentOrderCreateRequest(BaseModel):
    student_id: Optional[int] = None
    amount_rupees: Optional[Decimal] = Field(default=None, gt=0)


class PaymentOrderResponse(BaseModel):
    message: str
    order_id: str
    amount: int  # amount in paise
    currency: str = "INR"
    key_id: str
    student_id: Optional[int] = None
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    student_phone: Optional[str] = None


class PaymentVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    student_id: Optional[int] = None


class PaymentVerifyResponse(BaseModel):
    status: str
    message: str
    payment_id: int
    amount: Decimal
    transaction_ref: str
    receipt_number: Optional[str] = None
    student_id: int
    student_name: str
    fees_paid: Decimal
    pending_amount: Decimal
    already_processed: bool = False


# Backward compatibility aliases
RazorpayVerifyResponse = PaymentVerifyResponse
RazorpayOrderResponse = PaymentOrderResponse
RazorpayOrderCreate = PaymentOrderCreateRequest
RazorpayVerifyRequest = PaymentVerifyRequest



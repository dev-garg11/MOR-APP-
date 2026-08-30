import hashlib
import hmac
import os
import sys
import time
from datetime import date
from decimal import Decimal
from pathlib import Path
from typing import Optional

# Ensure backend root directory is in sys.path for VS Code Pylance resolution
_backend_root = str(Path(__file__).resolve().parent.parent)
if _backend_root not in sys.path:
    sys.path.insert(0, _backend_root)

import razorpay
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database import get_db
from models.fee_payment_models import FeePayment
from models.student_models import Student
from schemas.fee_schemas import (
    PaymentOrderCreateRequest,
    PaymentOrderResponse,
    PaymentVerifyRequest,
    PaymentVerifyResponse,
    RazorpayOrderCreate,
    RazorpayOrderResponse,
    RazorpayVerifyRequest,
    RazorpayVerifyResponse,
)
from services.audit_service import log_activity
from services.auth_dependency import get_optional_current_student


load_dotenv()

router = APIRouter(prefix="/payments", tags=["Payments"])

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
    RAZORPAY_KEY_ID = RAZORPAY_KEY_ID or "rzp_test_TP8YigFhKRQMu3"
    RAZORPAY_KEY_SECRET = RAZORPAY_KEY_SECRET or "aZtP3Hw7kzP63IZRezH67QWY"

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
ZERO = Decimal("0.00")


def money(value) -> Decimal:
    return Decimal(str(value or ZERO))


# =====================================================================
# 1. CREATE RAZORPAY ORDER
# =====================================================================
@router.post("/create-order", response_model=PaymentOrderResponse)
def create_order(
    payload: Optional[PaymentOrderCreateRequest] = None,
    amount: Optional[int] = Query(default=None, description="Amount in paise (legacy support)"),
    db: Session = Depends(get_db),
    auth_student: Optional[dict] = Depends(get_optional_current_student),
):
    """
    Creates a Razorpay Order for online fee payment.
    - Validates student fee dues from DB.
    - Attaches student metadata to Razorpay order notes.
    """
    student = None
    target_student_id = (
        (auth_student and auth_student.get("student_id"))
        or (payload and payload.student_id)
    )

    if target_student_id:
        student = db.query(Student).filter(Student.id == target_student_id).first()
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student record not found.",
            )

    amount_paise = None

    if payload and payload.amount_rupees is not None:
        amount_paise = int(payload.amount_rupees * 100)
    elif amount is not None:
        amount_paise = int(amount)
    elif student:
        payable = max(money(student.fees_total) - money(student.discount_amount), ZERO)
        pending = max(payable - money(student.fees_paid), ZERO)
        if pending <= ZERO:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No pending fee dues. Student fees are fully cleared.",
            )
        amount_paise = int(pending * 100)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount or student information is required to create a payment order.",
        )

    if amount_paise <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment amount must be greater than zero.",
        )

    student_tag = f"std_{student.id}" if student else "anon"
    receipt_id = f"rcpt_{student_tag}_{int(time.time())}"[:40]

    notes = {
        "institution": "Morph Academy",
        "timestamp": str(int(time.time())),
    }
    if student:
        notes["student_id"] = str(student.id)
        notes["student_name"] = str(student.name or "")
        notes["student_login_id"] = str(student.login_id or "")

    try:
        order_data = {
            "amount": amount_paise,
            "currency": "INR",
            "receipt": receipt_id,
            "notes": notes,
        }
        order = client.order.create(data=order_data)

        return PaymentOrderResponse(
            message="Razorpay order created successfully",
            order_id=order["id"],
            amount=order["amount"],
            currency=order["currency"],
            key_id=RAZORPAY_KEY_ID,
            student_id=student.id if student else None,
            student_name=student.name if student else None,
            student_email=student.email if student else None,
            student_phone=student.phone if student else None,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Razorpay order generation failed: {str(e)}",
        )


# =====================================================================
# 2. VERIFY RAZORPAY PAYMENT & ATOMIC DATABASE UPDATE
# =====================================================================
@router.post("/verify", response_model=PaymentVerifyResponse)
def verify_payment(
    payload: PaymentVerifyRequest,
    db: Session = Depends(get_db),
    auth_student: Optional[dict] = Depends(get_optional_current_student),
):
    """
    Verifies the cryptographic Razorpay payment signature using HMAC-SHA256.
    Upon verification:
    - Checks for duplicate processing (idempotency).
    - Atomically inserts a FeePayment record.
    - Atomically increments student.fees_paid.
    - Rolls back on any failure.
    """
    order_id = payload.razorpay_order_id.strip()
    payment_id = payload.razorpay_payment_id.strip()
    received_signature = payload.razorpay_signature.strip()

    if not order_id or not payment_id or not received_signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order ID, Payment ID, and Signature are required for payment verification.",
        )

    # 1. Cryptographic HMAC-SHA256 Signature Verification
    message = f"{order_id}|{payment_id}".encode("utf-8")
    secret_bytes = RAZORPAY_KEY_SECRET.encode("utf-8")
    generated_signature = hmac.new(secret_bytes, message, hashlib.sha256).hexdigest()

    if not hmac.compare_digest(generated_signature, received_signature):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment signature verification failed. Untrusted or tampered transaction.",
        )

    # 2. Idempotency Check: Prevent duplicate payment recording
    existing_payment = (
        db.query(FeePayment)
        .filter(FeePayment.transaction_ref == payment_id)
        .first()
    )
    if existing_payment:
        student = db.query(Student).filter(Student.id == existing_payment.student_id).first()
        payable = max(money(student.fees_total) - money(student.discount_amount), ZERO) if student else ZERO
        pending = max(payable - money(student.fees_paid), ZERO) if student else ZERO

        return PaymentVerifyResponse(
            status="success",
            message="Payment has already been verified and recorded.",
            payment_id=existing_payment.id,
            amount=existing_payment.amount,
            transaction_ref=payment_id,
            receipt_number=existing_payment.receipt_number,
            student_id=existing_payment.student_id,
            student_name=student.name if student else "Student",
            fees_paid=student.fees_paid if student else existing_payment.amount,
            pending_amount=pending,
            already_processed=True,
        )

    # 3. Fetch verified payment & order details from Razorpay
    verified_amount_paise = None
    order_notes = {}
    try:
        rzp_payment = client.payment.fetch(payment_id)
        if rzp_payment.get("order_id") != order_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment does not match the specified Order ID.",
            )
        payment_status = str(rzp_payment.get("status", "")).lower()
        if payment_status not in ["captured", "authorized"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment status is '{payment_status}'. Payment not captured.",
            )
        verified_amount_paise = rzp_payment.get("amount")

        rzp_order = client.order.fetch(order_id)
        order_notes = rzp_order.get("notes") or {}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not confirm payment status with Razorpay Gateway: {str(e)}",
        )

    if not verified_amount_paise or verified_amount_paise <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payment amount received from payment gateway.",
        )

    amount_rupees = Decimal(str(verified_amount_paise)) / Decimal("100")

    # 4. Resolve and Lock Student Record
    target_student_id = None
    if auth_student and auth_student.get("student_id"):
        target_student_id = int(auth_student["student_id"])
    elif payload.student_id:
        target_student_id = int(payload.student_id)
    elif order_notes.get("student_id"):
        target_student_id = int(order_notes["student_id"])

    if not target_student_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student identification required to credit fee payment.",
        )

    if auth_student and auth_student.get("student_id"):
        if int(auth_student["student_id"]) != target_student_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only verify and credit payments to your own student account.",
            )

    student = db.query(Student).filter(Student.id == target_student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student #{target_student_id} not found in database.",
        )

    # 5. Atomic Database Update (Rollback on failure)
    try:
        new_total_paid = money(student.fees_paid) + amount_rupees
        student.fees_paid = new_total_paid

        new_fee_payment = FeePayment(
            student_id=student.id,
            amount=amount_rupees,
            payment_date=date.today(),
            payment_mode="Online (Razorpay)",
            transaction_ref=payment_id,
            receipt_number=order_id,
            notes=f"Razorpay Online Payment Verified. Payment ID: {payment_id} | Order ID: {order_id}",
            received_by="Razorpay Payment Gateway",
        )
        db.add(new_fee_payment)
        db.commit()
        db.refresh(new_fee_payment)
        db.refresh(student)

        try:
            log_activity(
                db,
                None,
                "online_payment_verified",
                "fee_payment",
                new_fee_payment.id,
                f"student_id={student.id} amount={amount_rupees} rzp_pay_id={payment_id}",
            )
        except Exception:
            pass

        payable = max(money(student.fees_total) - money(student.discount_amount), ZERO)
        pending = max(payable - money(student.fees_paid), ZERO)

        return PaymentVerifyResponse(
            status="success",
            message="Payment successfully verified and fee record updated!",
            payment_id=new_fee_payment.id,
            amount=amount_rupees,
            transaction_ref=payment_id,
            receipt_number=order_id,
            student_id=student.id,
            student_name=student.name,
            fees_paid=student.fees_paid,
            pending_amount=pending,
            already_processed=False,
        )

    except Exception as db_err:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database update failed during payment recording: {str(db_err)}",
        )
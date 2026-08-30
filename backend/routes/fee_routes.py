from datetime import date
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.fee_payment_models import FeePayment
from models.student_models import Student
from schemas.fee_schemas import (
    FeePaymentCreate,
    FeePaymentResponse,
    FeePaymentUpdate,
    FeePlanUpdate,
    FeeSummary,
)
from services.auth_dependency import require_admin
from services.audit_service import log_activity

router = APIRouter(prefix="/fees", tags=["Fees"])
ZERO = Decimal("0.00")


def money(value) -> Decimal:
    return Decimal(value or ZERO)


def build_summary(student: Student, payments: list[FeePayment] | None = None, as_of_date: date | None = None) -> FeeSummary:
    fees_total = money(student.fees_total)
    discount_amount = money(student.discount_amount)
    fees_paid = money(student.fees_paid)
    payable_amount = max(fees_total - discount_amount, ZERO)
    pending_amount = max(payable_amount - fees_paid, ZERO)
    check_date = as_of_date or date.today()

    if pending_amount == ZERO:
        fee_status = "paid"
    elif student.fee_due_date and student.fee_due_date < check_date:
        fee_status = "overdue"
    else:
        fee_status = "pending"

    return FeeSummary(
        student_id=student.id,
        student_name=student.name,
        fees_total=fees_total,
        discount_amount=discount_amount,
        payable_amount=payable_amount,
        fees_paid=fees_paid,
        pending_amount=pending_amount,
        fee_due_date=student.fee_due_date,
        fee_status=fee_status,
        payments=payments or [],
    )


def get_student_or_404(student_id: int, db: Session) -> Student:
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.put("/student/{student_id}/plan", response_model=FeeSummary)
def update_fee_plan(
    student_id: int,
    updates: FeePlanUpdate,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    student = get_student_or_404(student_id, db)
    data = updates.model_dump(exclude_unset=True)

    total = money(data.get("fees_total", student.fees_total))
    discount = money(data.get("discount_amount", student.discount_amount))
    paid = money(student.fees_paid)
    if discount > total:
        raise HTTPException(status_code=400, detail="Discount cannot be greater than total fees")
    if paid > total - discount:
        raise HTTPException(status_code=400, detail="Fee plan cannot be lower than the amount already paid")

    for key, value in data.items():
        setattr(student, key, value)
    db.commit()
    db.refresh(student)
    log_activity(db, admin, "updated_fee_plan", "fee", student.id, str(data))
    return build_summary(student)


@router.post("/payments", response_model=FeePaymentResponse)
def record_payment(
    payment: FeePaymentCreate,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    student = get_student_or_404(payment.student_id, db)
    payable = max(money(student.fees_total) - money(student.discount_amount), ZERO)
    new_total_paid = money(student.fees_paid) + payment.amount
    if new_total_paid > payable:
        raise HTTPException(status_code=400, detail="Payment cannot exceed the student's payable fees")

    new_payment = FeePayment(
        **payment.model_dump(exclude={"payment_date"}),
        payment_date=payment.payment_date or date.today(),
        received_by=admin.get("email"),
    )
    student.fees_paid = new_total_paid
    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)
    log_activity(db, admin, "recorded_fee_payment", "fee_payment", new_payment.id, f"student={student.id} amount={new_payment.amount}")
    return new_payment


@router.put("/payments/{payment_id}", response_model=FeePaymentResponse)
def update_payment(
    payment_id: int,
    updates: FeePaymentUpdate,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    payment = db.query(FeePayment).filter(FeePayment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Fee payment not found")

    student = get_student_or_404(payment.student_id, db)
    data = updates.model_dump(exclude_unset=True)
    new_amount = data.get("amount", payment.amount)
    payable = max(money(student.fees_total) - money(student.discount_amount), ZERO)
    revised_paid = money(student.fees_paid) - money(payment.amount) + new_amount
    if revised_paid > payable:
        raise HTTPException(status_code=400, detail="Payment cannot exceed the student's payable fees")

    for key, value in data.items():
        if value is not None:
            setattr(payment, key, value)
    student.fees_paid = revised_paid
    db.commit()
    db.refresh(payment)
    log_activity(db, admin, "updated_fee_payment", "fee_payment", payment.id, str(data))
    return payment


@router.get("/student/{student_id}", response_model=FeeSummary)
def get_student_fee_summary(
    student_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    student = get_student_or_404(student_id, db)
    payments = (
        db.query(FeePayment)
        .filter(FeePayment.student_id == student_id)
        .order_by(FeePayment.payment_date.desc(), FeePayment.id.desc())
        .all()
    )
    return build_summary(student, payments)


@router.get("/pending", response_model=List[FeeSummary])
def get_pending_fees(
    as_of_date: Optional[date] = None,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    summaries = [build_summary(student, as_of_date=as_of_date) for student in db.query(Student).all()]
    return [summary for summary in summaries if summary.pending_amount > ZERO]


@router.delete("/payments/{payment_id}")
def delete_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    payment = db.query(FeePayment).filter(FeePayment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Fee payment not found")

    student = get_student_or_404(payment.student_id, db)
    student.fees_paid = max(money(student.fees_paid) - money(payment.amount), ZERO)
    log_activity(db, admin, "deleted_fee_payment", "fee_payment", payment.id, f"student={student.id} amount={payment.amount}")
    db.delete(payment)
    db.commit()
    return {"message": "Fee payment deleted successfully"}

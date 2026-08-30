import calendar
from datetime import date
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.fee_payment_models import FeePayment, StudentEmi
from models.student_models import Student
from schemas.fee_schemas import (
    EmiScheduleCreateRequest,
    EmiScheduleResponse,
    FeePaymentCreate,
    FeePaymentResponse,
    FeePaymentUpdate,
    FeePlanUpdate,
    FeeSummary,
    StudentEmiResponse,
)
from services.auth_dependency import require_admin
from services.audit_service import log_activity

router = APIRouter(prefix="/fees", tags=["Fees"])
ZERO = Decimal("0.00")


def money(value) -> Decimal:
    return Decimal(str(value or ZERO))


def add_months_safe(start_date: date, months_to_add: int) -> date:
    """
    Safely adds months to a date handling 28/29/30/31 day month boundaries and leap years.
    """
    month = start_date.month - 1 + months_to_add
    year = start_date.year + month // 12
    month = month % 12 + 1
    day = start_date.day
    max_day = calendar.monthrange(year, month)[1]
    return date(year, month, min(day, max_day))


def sync_emi_statuses(emis: list[StudentEmi], db: Optional[Session] = None) -> list[StudentEmi]:
    """
    Dynamically marks unpaid EMIs as 'overdue' if due_date is in the past, or 'pending' if in the future.
    """
    today = date.today()
    modified = False
    for emi in emis:
        if emi.status != "paid":
            new_status = "overdue" if emi.due_date < today else "pending"
            if emi.status != new_status:
                emi.status = new_status
                modified = True
    if modified and db:
        try:
            db.commit()
        except Exception:
            pass
    return emis


def allocate_payment_to_emis(
    student_id: int,
    payment_amount: Decimal,
    db: Session,
    payment_mode: str = "Online",
    ref: Optional[str] = None,
):
    """
    Allocates verified payments sequentially against unpaid/overdue EMIs.
    """
    unpaid_emis = (
        db.query(StudentEmi)
        .filter(
            StudentEmi.student_id == student_id,
            StudentEmi.status.in_(["pending", "overdue"]),
        )
        .order_by(StudentEmi.emi_number.asc())
        .all()
    )

    remaining_payment = money(payment_amount)
    for emi in unpaid_emis:
        if remaining_payment <= ZERO:
            break
        emi_amt = money(emi.amount)
        if remaining_payment >= emi_amt:
            emi.status = "paid"
            emi.payment_date = date.today()
            emi.payment_mode = payment_mode
            emi.transaction_reference = ref
            emi.notes = f"Paid via {payment_mode} (Ref: {ref or 'Direct'})"
            remaining_payment -= emi_amt
        else:
            emi.notes = f"Partial payment received: Rs. {remaining_payment} of Rs. {emi_amt}"
            break


def build_summary(
    student: Student,
    payments: list[FeePayment] | None = None,
    emis: list[StudentEmi] | None = None,
    as_of_date: date | None = None,
    db: Optional[Session] = None,
) -> FeeSummary:
    fees_total = money(student.fees_total)
    discount_amount = money(student.discount_amount)
    fees_paid = money(student.fees_paid)
    payable_amount = max(fees_total - discount_amount, ZERO)
    pending_amount = max(payable_amount - fees_paid, ZERO)
    check_date = as_of_date or date.today()

    if emis is None and db:
        emis = (
            db.query(StudentEmi)
            .filter(StudentEmi.student_id == student.id)
            .order_by(StudentEmi.emi_number.asc())
            .all()
        )

    if emis:
        emis = sync_emi_statuses(emis, db)

    next_emi = None
    if emis:
        for e in emis:
            if e.status in ["pending", "overdue"]:
                next_emi = e
                break

    effective_due_date = student.fee_due_date
    if next_emi and next_emi.due_date:
        effective_due_date = next_emi.due_date

    if pending_amount == ZERO:
        fee_status = "paid"
    elif effective_due_date and effective_due_date < check_date:
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
        fee_due_date=effective_due_date,
        fee_status=fee_status,
        payments=payments or [],
        emis=emis or [],
        next_emi=StudentEmiResponse.model_validate(next_emi) if next_emi else None,
        emi_plan_months=len(emis) if emis else None,
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
    return build_summary(student, db=db)


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
    
    # Allocate payment to existing EMIs
    allocate_payment_to_emis(
        student.id,
        payment.amount,
        db,
        payment_mode=payment.payment_mode or "cash",
        ref=new_payment.transaction_ref,
    )
    
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
    return build_summary(student, payments, db=db)


@router.get("/pending", response_model=List[FeeSummary])
def get_pending_fees(
    as_of_date: Optional[date] = None,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    summaries = [build_summary(student, as_of_date=as_of_date, db=db) for student in db.query(Student).all()]
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


# =====================================================================
# EMI SCHEDULE GENERATION & RETRIEVAL (Admin / HR)
# =====================================================================
@router.post("/students/{student_id}/emi-schedule", response_model=EmiScheduleResponse)
def create_or_regenerate_emi_schedule(
    student_id: int,
    payload: EmiScheduleCreateRequest,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    """
    Generates or regenerates an automated 3, 6, or 12 month EMI schedule based on the student's actual outstanding fee dues.
    """
    months = payload.months
    if months not in [3, 6, 12]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid EMI plan duration. Allowed plans are 3, 6, or 12 months only.",
        )

    student = get_student_or_404(student_id, db)
    fees_total = money(student.fees_total)
    discount_amount = money(student.discount_amount)
    fees_paid = money(student.fees_paid)
    payable = max(fees_total - discount_amount, ZERO)
    outstanding = max(payable - fees_paid, ZERO)

    if outstanding <= ZERO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student has no outstanding dues to schedule an EMI plan. Fees are fully cleared.",
        )

    existing_emis = (
        db.query(StudentEmi)
        .filter(StudentEmi.student_id == student.id)
        .order_by(StudentEmi.emi_number.asc())
        .all()
    )

    paid_emis = [e for e in existing_emis if e.status == "paid"]
    unpaid_emis = [e for e in existing_emis if e.status != "paid"]

    # Duplicate check: If identical pending schedule already exists
    if len(existing_emis) == months and not paid_emis:
        existing_total = sum(money(e.amount) for e in existing_emis)
        if existing_total == outstanding:
            return EmiScheduleResponse(
                student_id=student.id,
                student_name=student.name,
                months=months,
                outstanding_amount=outstanding,
                installment_amount=existing_emis[0].amount,
                installments=[StudentEmiResponse.model_validate(e) for e in existing_emis],
                already_scheduled=True,
            )

    start_ref = payload.start_date or date.today()

    total_paise = int(outstanding * 100)
    base_paise = total_paise // months
    remainder_paise = total_paise % months

    for e in unpaid_emis:
        db.delete(e)
    db.flush()

    new_installments = []
    start_num = len(paid_emis) + 1

    for i in range(months):
        paisa = base_paise + (1 if i < remainder_paise else 0)
        inst_amount = Decimal(paisa) / Decimal(100)
        due = add_months_safe(start_ref, i + 1)
        inst_status = "overdue" if due < date.today() else "pending"

        emi_obj = StudentEmi(
            student_id=student.id,
            emi_number=start_num + i,
            amount=inst_amount,
            due_date=due,
            status=inst_status,
            notes=f"{months}-Month EMI Plan (Installment {start_num + i} of {len(paid_emis) + months})",
        )
        db.add(emi_obj)
        new_installments.append(emi_obj)

    if new_installments:
        student.fee_due_date = new_installments[0].due_date

    db.commit()

    all_current_emis = (
        db.query(StudentEmi)
        .filter(StudentEmi.student_id == student.id)
        .order_by(StudentEmi.emi_number.asc())
        .all()
    )

    log_activity(
        db,
        admin,
        "generated_emi_schedule",
        "student_emi",
        student.id,
        f"student={student.id} months={months} outstanding={outstanding}",
    )

    return EmiScheduleResponse(
        student_id=student.id,
        student_name=student.name,
        months=months,
        outstanding_amount=outstanding,
        installment_amount=new_installments[0].amount if new_installments else ZERO,
        installments=[StudentEmiResponse.model_validate(e) for e in all_current_emis],
        already_scheduled=False,
    )


@router.get("/students/{student_id}/emi-schedule", response_model=EmiScheduleResponse)
def get_student_emi_schedule(
    student_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    student = get_student_or_404(student_id, db)
    fees_total = money(student.fees_total)
    discount_amount = money(student.discount_amount)
    fees_paid = money(student.fees_paid)
    payable = max(fees_total - discount_amount, ZERO)
    outstanding = max(payable - fees_paid, ZERO)

    emis = (
        db.query(StudentEmi)
        .filter(StudentEmi.student_id == student.id)
        .order_by(StudentEmi.emi_number.asc())
        .all()
    )
    emis = sync_emi_statuses(emis, db)

    inst_amt = emis[0].amount if emis else ZERO
    return EmiScheduleResponse(
        student_id=student.id,
        student_name=student.name,
        months=len(emis),
        outstanding_amount=outstanding,
        installment_amount=inst_amt,
        installments=[StudentEmiResponse.model_validate(e) for e in emis],
        already_scheduled=True,
    )

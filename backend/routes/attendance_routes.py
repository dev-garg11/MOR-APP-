from datetime import date as date_type
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from models.attendance_models import Attendance
from schemas.attendance_schemas import AttendanceCreate, AttendanceResponse, AttendanceUpdate
from services.audit_service import log_activity
from services.auth_dependency import get_current_admin, require_admin

router = APIRouter(prefix="/attendance", tags=["Attendance"])


# 1. Attendance mark karo (ek student, ek din - agar already marked hai to update karo - UPSERT)
@router.post("/", response_model=AttendanceResponse)
def mark_attendance(
    record: AttendanceCreate,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    data = record.model_dump()
    target_date = data.get("date") or date_type.today()
    data["date"] = target_date

    # 1. Check if record already exists for this student on this date
    existing = (
        db.query(Attendance)
        .filter(
            Attendance.student_id == data["student_id"],
            Attendance.date == target_date,
        )
        .first()
    )

    if existing:
        existing.status = data["status"]
        if data.get("marked_by"):
            existing.marked_by = data["marked_by"]
        db.commit()
        db.refresh(existing)
        try:
            log_activity(
                db,
                admin,
                "updated_attendance",
                "attendance",
                existing.id,
                f"student={existing.student_id} status={existing.status}",
            )
        except Exception:
            pass
        return existing

    # 2. If not found, insert new record with safety fallback
    try:
        new_record = Attendance(**data)
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        try:
            log_activity(
                db,
                admin,
                "marked_attendance",
                "attendance",
                new_record.id,
                f"student={new_record.student_id} status={new_record.status}",
            )
        except Exception:
            pass
        return new_record
    except IntegrityError:
        db.rollback()
        existing = db.query(Attendance).filter(Attendance.student_id == data["student_id"], Attendance.date == target_date).first()
        if existing:
            existing.status = data["status"]
            if data.get("marked_by"):
                existing.marked_by = data["marked_by"]
            db.commit()
            db.refresh(existing)
            return existing
        raise HTTPException(status_code=400, detail="Could not record attendance")


# 2. Attendance list dikhao (date ya student se filter kar sakte ho)
@router.get("/", response_model=List[AttendanceResponse])
def get_attendance(
    student_id: Optional[int] = None,
    date: Optional[date_type] = None,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    query = db.query(Attendance)
    if student_id:
        query = query.filter(Attendance.student_id == student_id)
    if date:
        query = query.filter(Attendance.date == date)
    return query.order_by(Attendance.date.desc()).all()


# 3. Ek student ki attendance history dikhao
@router.get("/student/{student_id}", response_model=List[AttendanceResponse])
def get_student_attendance(
    student_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    return (
        db.query(Attendance)
        .filter(Attendance.student_id == student_id)
        .order_by(Attendance.date.desc())
        .all()
    )


# 4. Attendance record update karo
@router.put("/{attendance_id}", response_model=AttendanceResponse)
def update_attendance(
    attendance_id: int,
    updates: AttendanceUpdate,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    record = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    for key, value in updates.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(record, key, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Attendance already exists for this student on the selected date",
        )
    db.refresh(record)
    try:
        log_activity(
            db,
            admin,
            "updated_attendance",
            "attendance",
            record.id,
            f"student={record.student_id} status={record.status}",
        )
    except Exception:
        pass
    return record


# 5. Attendance record delete karo
@router.delete("/{attendance_id}")
def delete_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    record = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    try:
        log_activity(
            db,
            admin,
            "deleted_attendance",
            "attendance",
            record.id,
            f"student={record.student_id}",
        )
    except Exception:
        pass
    db.delete(record)
    db.commit()
    return {"message": "Attendance record deleted successfully"}

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from database import get_db
from models.student_models import Student
from schemas.student_schemas import StudentCreate, StudentUpdate, StudentResponse
from schemas.student_portal_schemas import StudentCredentialsUpdate
from services.auth_dependency import require_admin
from services.auth_service import hash_password
from services.audit_service import log_activity

router = APIRouter(prefix="/students", tags=["Students"])

@router.post("/", response_model=StudentResponse)
def create_student(student: StudentCreate, db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    new_student = Student(**student.model_dump())
    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    # Auto-generate unique login_id if not present
    if not new_student.login_id:
        from datetime import datetime
        year = datetime.now().year
        new_student.login_id = f"MA-{year}-{new_student.id:03d}"
    
    # Auto-set default password if not present
    if not new_student.password_hash:
        new_student.password_hash = hash_password("Student@12345")

    # Record initial admission down-payment receipt if fees_paid > 0
    if new_student.fees_paid and float(new_student.fees_paid) > 0:
        from models.fee_payment_models import FeePayment
        import datetime
        payment = FeePayment(
            student_id=new_student.id,
            amount=new_student.fees_paid,
            payment_date=datetime.date.today(),
            payment_mode="Online / NetBanking",
            notes="Admission Registration & Initial Down-Payment",
            received_by=admin.get("email", "Admissions Desk"),
        )
        db.add(payment)

    db.commit()
    db.refresh(new_student)

    log_activity(db, admin, "created_student", "student", new_student.id, f"{new_student.name} ({new_student.login_id})")
    return new_student

@router.get("/", response_model=List[StudentResponse])
def get_students(
    course: str = None,
    status: str = None,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    query = db.query(Student)
    if course:
        query = query.filter(Student.course == course)
    if status:
        query = query.filter(Student.status == status)
    return query.order_by(Student.created_at.desc()).all()

@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: int, db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@router.put("/{student_id}", response_model=StudentResponse)
def update_student(student_id: int, updates: StudentUpdate, db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    update_data = updates.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(student, key, value)

    db.commit()
    db.refresh(student)
    log_activity(db, admin, "updated_student", "student", student.id, str(update_data))
    return student

@router.delete("/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    log_activity(db, admin, "deleted_student", "student", student.id, student.name)
    db.delete(student)
    db.commit()
    return {"message": "Student deleted successfully"}


@router.post("/{student_id}/credentials")
def set_student_credentials(
    student_id: int,
    credentials: StudentCredentialsUpdate,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    student.login_id = credentials.login_id or student.login_id or f"STU-{student.id:05d}"
    student.password_hash = hash_password(credentials.password)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="This student login ID is already in use")

    log_activity(db, admin, "created_student_credentials", "student", student.id, student.login_id)
    return {
        "message": "Student login credentials created successfully",
        "login_id": student.login_id,
    }

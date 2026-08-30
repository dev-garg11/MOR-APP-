from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.attendance_models import Attendance
from models.fee_payment_models import FeePayment
from models.student_models import Student
from routes.fee_routes import build_summary
from schemas.attendance_schemas import AttendanceResponse
from schemas.fee_schemas import FeeSummary
from schemas.student_portal_schemas import StudentLogin, StudentTokenResponse
from schemas.student_schemas import StudentResponse
from services.auth_dependency import get_current_student
from services.auth_service import create_access_token, verify_password

auth_router = APIRouter(prefix="/student-auth", tags=["Student Auth"])
portal_router = APIRouter(prefix="/student-portal", tags=["Student Portal"])


@auth_router.post("/login", response_model=StudentTokenResponse)
def student_login(credentials: StudentLogin, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.login_id == credentials.login_id).first()
    if not student or not student.password_hash or not verify_password(credentials.password, student.password_hash):
        raise HTTPException(status_code=401, detail="Invalid student login ID or password")

    token = create_access_token(
        {"sub": str(student.id), "role": "student", "student_id": student.id}
    )
    return StudentTokenResponse(access_token=token, student_id=student.id, login_id=student.login_id)


def get_logged_in_student(student_data: dict, db: Session) -> Student:
    student = db.query(Student).filter(Student.id == student_data["student_id"]).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student account no longer exists")
    return student


@portal_router.get("/me", response_model=StudentResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    student_data: dict = Depends(get_current_student),
):
    return get_logged_in_student(student_data, db)


@portal_router.get("/me/fees", response_model=FeeSummary)
def get_my_fees(
    db: Session = Depends(get_db),
    student_data: dict = Depends(get_current_student),
):
    student = get_logged_in_student(student_data, db)
    payments = (
        db.query(FeePayment)
        .filter(FeePayment.student_id == student.id)
        .order_by(FeePayment.payment_date.desc(), FeePayment.id.desc())
        .all()
    )
    return build_summary(student, payments)


@portal_router.get("/me/attendance", response_model=list[AttendanceResponse])
def get_my_attendance(
    db: Session = Depends(get_db),
    student_data: dict = Depends(get_current_student),
):
    student = get_logged_in_student(student_data, db)
    return (
        db.query(Attendance)
        .filter(Attendance.student_id == student.id)
        .order_by(Attendance.date.desc())
        .all()
    )


@portal_router.get("/me/assignments")
def get_my_assignments(
    db: Session = Depends(get_db),
    student_data: dict = Depends(get_current_student),
):
    student = get_logged_in_student(student_data, db)
    from models.batch_models import Batch
    from models.assignment_models import Assignment, StudentAssignmentSubmission

    batch = db.query(Batch).filter(Batch.name == student.batch).first()
    if not batch:
        return []

    assignments = (
        db.query(Assignment)
        .filter(Assignment.batch_id == batch.id)
        .order_by(Assignment.created_at.desc())
        .all()
    )

    results = []
    for a in assignments:
        sub = (
            db.query(StudentAssignmentSubmission)
            .filter(
                StudentAssignmentSubmission.assignment_id == a.id,
                StudentAssignmentSubmission.student_id == student.id,
            )
            .first()
        )
        results.append({
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "due_date": a.due_date,
            "max_marks": a.max_marks,
            "course_name": a.course.name if a.course else student.course,
            "batch_name": student.batch,
            "status": sub.status if sub else "pending",
            "submission_date": sub.submission_date if sub else None,
            "content": sub.content if sub else None,
            "file_url": sub.file_url if sub else None,
            "marks": float(sub.marks) if sub and sub.marks is not None else None,
            "feedback": sub.feedback if sub else None,
        })
    return results


@portal_router.post("/assignments/{assignment_id}/submit")
def submit_my_assignment(
    assignment_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    student_data: dict = Depends(get_current_student),
):
    student = get_logged_in_student(student_data, db)
    from datetime import datetime, timezone
    from models.assignment_models import Assignment, StudentAssignmentSubmission

    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    existing = (
        db.query(StudentAssignmentSubmission)
        .filter(
            StudentAssignmentSubmission.assignment_id == assignment_id,
            StudentAssignmentSubmission.student_id == student.id,
        )
        .first()
    )

    content = payload.get("content") or "Project completed and ready for evaluation."
    file_url = payload.get("file_url")

    if not existing:
        new_sub = StudentAssignmentSubmission(
            assignment_id=assignment_id,
            student_id=student.id,
            content=content,
            file_url=file_url,
            status="submitted",
            submission_date=datetime.now(timezone.utc),
        )
        db.add(new_sub)
    else:
        existing.content = content
        existing.file_url = file_url
        existing.status = "submitted"
        existing.submission_date = datetime.now(timezone.utc)

    db.commit()

    return {
        "message": f"Assignment '{assignment.title}' submitted successfully!",
        "assignment_id": assignment.id,
        "student_id": student.id,
        "status": "submitted",
    }


@portal_router.get("/me/curriculum")
def get_my_curriculum(
    db: Session = Depends(get_db),
    student_data: dict = Depends(get_current_student),
):
    student = get_logged_in_student(student_data, db)
    from models.batch_models import Batch, BatchLessonProgress
    from models.courses_models import Course, CourseModule, CourseLesson

    batch = db.query(Batch).filter(Batch.name == student.batch).first()
    course = None
    if batch and batch.course:
        course = batch.course
    elif student.course:
        course = db.query(Course).filter(Course.name == student.course).first()

    if not course:
        # Fallback to first active course
        course = db.query(Course).first()

    if not course:
        return {
            "course_name": student.course or "Studio Course",
            "batch_name": student.batch or "Batch",
            "total_topics": 0,
            "completed_topics": 0,
            "completion_percentage": 0,
            "modules": [],
        }

    batch_id = batch.id if batch else None
    completed_lesson_ids = set()
    if batch_id:
        completed_lesson_ids = {
            r.lesson_id
            for r in db.query(BatchLessonProgress.lesson_id)
            .filter(
                BatchLessonProgress.batch_id == batch_id,
                BatchLessonProgress.is_completed == True,
            )
            .all()
        }

    modules_data = []
    total_lessons = 0
    completed_lessons = 0

    for m in course.modules:
        lessons_data = []
        for l in m.lessons:
            total_lessons += 1
            is_done = l.id in completed_lesson_ids
            if is_done:
                completed_lessons += 1
            lessons_data.append({
                "id": l.id,
                "title": l.title,
                "duration": l.duration or "45 Mins",
                "order_index": l.order_index,
                "is_completed": is_done,
                "status": "completed" if is_done else "upcoming",
            })
        modules_data.append({
            "id": m.id,
            "title": m.title,
            "description": m.description,
            "order_index": m.order_index,
            "lessons": lessons_data,
        })

    pct = round((completed_lessons / total_lessons) * 100) if total_lessons > 0 else 0

    return {
        "course_id": course.id,
        "course_name": course.name,
        "batch_id": batch_id,
        "batch_name": student.batch or "Studio Cohort",
        "total_topics": total_lessons,
        "completed_topics": completed_lessons,
        "completion_percentage": pct,
        "modules": modules_data,
    }



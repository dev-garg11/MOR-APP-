from datetime import date, datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models.admin_models import Admin
from models.attendance_models import Attendance
from models.audit_log_models import AuditLog
from models.batch_models import (
    AdminBatchAssignment,
    AdminCourseAssignment,
    AdminStudentAssignment,
    Batch,
    BatchLessonProgress,
)
from models.assignment_models import Assignment, StudentAssignmentSubmission
from models.courses_models import Course, CourseLesson, CourseModule
from models.student_models import Student
from schemas.teacher_schemas import (
    TeacherAssignmentCreate,
    TeacherAssignmentEvaluateRequest,
    TeacherAssignmentResponse,
    TeacherAssignmentSubmissionsResponse,
    TeacherBatchAttendanceStatus,
    TeacherBatchAttendanceSubmit,
    TeacherBatchDetailResponse,
    TeacherBatchResponse,
    TeacherBatchSummary,
    TeacherCourseDetailResponse,
    TeacherCourseResponse,
    TeacherDashboardResponse,
    TeacherDashboardSummary,
    TeacherPerformancePlaceholder,
    TeacherProfileResponse,
    TeacherProfileUpdate,
    TeacherRecentActivity,
    TeacherStudentDetailResponse,
    TeacherStudentResponse,
    TeacherStudentSubmissionRosterItem,
    TeacherTimetableItem,
    TeacherTodayClass,
)
from services.audit_service import log_activity
from services.auth_dependency import require_teacher

router = APIRouter(prefix="/teacher", tags=["Teacher Module"])


import time

_TEACHER_ASSIGNMENTS_CACHE = {}  # {teacher_id: (course_ids, batch_ids, expiry)}

def _get_teacher_assigned_ids(db: Session, teacher_id: int, role: str):
    """
    Returns (assigned_course_ids: set, assigned_batch_ids: set) with a 30s TTL cache
    to eliminate redundant database queries on repeated tab clicks.
    """
    is_super_admin = role in {"admin", "super_admin"}

    if is_super_admin:
        course_ids = {c.id for c in db.query(Course.id).all()}
        batch_ids = {b.id for b in db.query(Batch.id).all()}
        return course_ids, batch_ids

    now = time.time()
    cached = _TEACHER_ASSIGNMENTS_CACHE.get(teacher_id)
    if cached and cached[2] > now:
        return cached[0], cached[1]

    # Assigned batches from AdminBatchAssignment
    direct_batch_ids = {
        r.batch_id
        for r in db.query(AdminBatchAssignment.batch_id)
        .filter(AdminBatchAssignment.admin_id == teacher_id)
        .all()
    }

    # Assigned courses from AdminCourseAssignment
    direct_course_ids = {
        r.course_id
        for r in db.query(AdminCourseAssignment.course_id)
        .filter(AdminCourseAssignment.admin_id == teacher_id)
        .all()
    }

    # Also infer courses from assigned batches
    if direct_batch_ids:
        batch_course_ids = {
            r.course_id
            for r in db.query(Batch.course_id)
            .filter(Batch.id.in_(direct_batch_ids))
            .all()
        }
        direct_course_ids = direct_course_ids.union(batch_course_ids)

    _TEACHER_ASSIGNMENTS_CACHE[teacher_id] = (direct_course_ids, direct_batch_ids, now + 30.0)
    return direct_course_ids, direct_batch_ids


def _calculate_student_attendance_rate(db: Session, student_id: int):
    total = db.query(func.count(Attendance.id)).filter(Attendance.student_id == student_id).scalar() or 0
    if total == 0:
        return "N/A", 0, 0
    present = (
        db.query(func.count(Attendance.id))
        .filter(Attendance.student_id == student_id, Attendance.status == "present")
        .scalar()
        or 0
    )
    pct = round((present / total) * 100)
    return f"{pct}%", total, present


# =====================================================================
# 1. TEACHER DASHBOARD
# =====================================================================
@router.get("/dashboard", response_model=TeacherDashboardResponse)
def get_teacher_dashboard(
    db: Session = Depends(get_db),
    admin: dict = Depends(require_teacher),
):
    teacher_id = int(admin["sub"])
    teacher_role = admin.get("role", "teacher").lower()

    teacher_user = db.query(Admin).filter(Admin.id == teacher_id).first()
    if not teacher_user:
        raise HTTPException(status_code=404, detail="Teacher account not found")

    assigned_course_ids, assigned_batch_ids = _get_teacher_assigned_ids(
        db, teacher_id, teacher_role
    )

    # 1. Assigned Batches query
    batches = []
    if assigned_batch_ids:
        batches = (
            db.query(Batch)
            .options(joinedload(Batch.course))
            .filter(Batch.id.in_(assigned_batch_ids))
            .order_by(Batch.id.asc())
            .all()
        )

    # 2. Assigned Courses query
    courses_count = len(assigned_course_ids)
    batches_count = len(batches)

    # 3. Total Students in assigned batches
    batch_names = [b.name for b in batches if b.name]
    students_query = db.query(Student).filter(Student.status == "active")
    if batch_names:
        students_query = students_query.filter(Student.batch.in_(batch_names))
    else:
        students_query = students_query.filter(Student.id == -1)  # empty
    total_students_count = students_query.count()

    # 4. Today's Classes & Timetable calculation
    today = date.today()
    today_classes: List[TeacherTodayClass] = []
    today_attendance_marked_count = 0

    batch_student_counts = {}
    batch_student_ids_map = {}
    if batch_names:
        stu_records = (
            db.query(Student.id, Student.batch)
            .filter(Student.batch.in_(batch_names))
            .all()
        )
        for s_id, s_batch in stu_records:
            if s_batch not in batch_student_ids_map:
                batch_student_ids_map[s_batch] = []
            batch_student_ids_map[s_batch].append(s_id)
            batch_student_counts[s_batch] = len(batch_student_ids_map[s_batch])

    all_assigned_stu_ids = [
        s_id for s_list in batch_student_ids_map.values() for s_id in s_list
    ]
    today_marked_stu_ids = set()
    if all_assigned_stu_ids:
        today_att_records = (
            db.query(Attendance.student_id)
            .filter(
                Attendance.student_id.in_(all_assigned_stu_ids),
                Attendance.date == today,
            )
            .all()
        )
        today_marked_stu_ids = {r[0] for r in today_att_records}

    for b in batches:
        stu_ids = batch_student_ids_map.get(b.name, [])
        attendance_marked = any(s in today_marked_stu_ids for s in stu_ids)
        if attendance_marked:
            today_attendance_marked_count += 1

        stu_cnt = batch_student_counts.get(b.name, len(stu_ids))
        today_classes.append(
            TeacherTodayClass(
                id=b.id,
                batch_id=b.id,
                batch_name=b.name,
                course_id=b.course_id,
                course_name=b.course.name if b.course else "Specialization Course",
                timing=b.timing or "10:00 AM - 12:00 PM",
                days=b.days or "Mon, Wed, Fri",
                status=b.status,
                students_count=stu_cnt,
                attendance_marked=attendance_marked,
                room="Lab 2 / Maya Studio",
            )
        )

    today_classes_count = len(today_classes)
    total_attendance_targets = len(batches)
    today_att_rate = "0%"
    if total_attendance_targets > 0:
        pct = round((today_attendance_marked_count / total_attendance_targets) * 100)
        today_att_rate = f"{pct}%"

    # 5. Assigned Batches summary list
    assigned_batches_summary = [
        TeacherBatchSummary(
            id=b.id,
            name=b.name,
            course_id=b.course_id,
            course_name=b.course.name if b.course else "Course",
            status=b.status,
            start_date=b.start_date,
            end_date=b.end_date,
            timing=b.timing,
            days=b.days,
            students_count=batch_student_counts.get(b.name, 0),
        )
        for b in batches
    ]

    # 6. Recent Activity
    recent_activity: List[TeacherRecentActivity] = []
    # Fetch recent audit logs for attendance or course
    recent_logs = (
        db.query(AuditLog)
        .filter(
            or_(
                AuditLog.actor_admin_id == teacher_id,
                AuditLog.entity_type.in_(["attendance", "student", "course"]),
            )
        )
        .order_by(AuditLog.created_at.desc())
        .limit(5)
        .all()
    )

    for log in recent_logs:
        recent_activity.append(
            TeacherRecentActivity(
                id=str(log.id),
                type=log.entity_type or "system",
                title=log.action.replace("_", " ").title(),
                subtitle=log.details or f"Activity recorded in {log.entity_type or 'Academy'}",
                timestamp=log.created_at,
                action=log.action,
            )
        )

    if not recent_activity:
        # Fallback informative recent item
        recent_activity.append(
            TeacherRecentActivity(
                id="init-1",
                type="system",
                title="Teacher Portal Active",
                subtitle=f"Assigned to {batches_count} batches and {courses_count} courses.",
                timestamp=datetime.now(timezone.utc),
                action="session_start",
            )
        )

    teacher_profile = TeacherProfileResponse(
        id=teacher_user.id,
        name=teacher_user.name,
        email=teacher_user.email,
        role=teacher_user.role,
        status=teacher_user.status,
        phone=getattr(teacher_user, "phone", None) or "9876543210",
        department=getattr(teacher_user, "department", None) or "Animation & VFX Faculty",
        designation="Lead Trainer & Senior Mentor",
        last_active_at=teacher_user.last_active_at,
        assigned_courses_count=courses_count,
        assigned_batches_count=batches_count,
    )

    summary = TeacherDashboardSummary(
        my_courses_count=courses_count,
        my_batches_count=batches_count,
        total_students_count=total_students_count,
        today_classes_count=today_classes_count,
        pending_assignments_count=2,  # Prepared placeholder for future assignment module
        today_attendance_rate=today_att_rate,
        today_attendance_marked_count=today_attendance_marked_count,
        today_attendance_total_count=total_attendance_targets,
    )

    return TeacherDashboardResponse(
        teacher=teacher_profile,
        summary=summary,
        today_classes=today_classes,
        assigned_batches=assigned_batches_summary,
        recent_activity=recent_activity,
    )


# =====================================================================
# 2. MY COURSES (ASSIGNED ONLY)
# =====================================================================
@router.get("/courses", response_model=List[TeacherCourseResponse])
def get_teacher_courses(
    db: Session = Depends(get_db),
    admin: dict = Depends(require_teacher),
):
    teacher_id = int(admin["sub"])
    teacher_role = admin.get("role", "teacher").lower()

    assigned_course_ids, assigned_batch_ids = _get_teacher_assigned_ids(
        db, teacher_id, teacher_role
    )

    if not assigned_course_ids:
        return []

    courses = (
        db.query(Course)
        .options(joinedload(Course.modules), joinedload(Course.batches))
        .filter(Course.id.in_(assigned_course_ids))
        .order_by(Course.id.asc())
        .all()
    )

    results = []
    for c in courses:
        # Count batches assigned to this teacher under this course
        teacher_batches = [
            b for b in c.batches if (teacher_role in {"admin", "super_admin"} or b.id in assigned_batch_ids)
        ]
        batch_names = [b.name for b in teacher_batches]
        students_count = 0
        if batch_names:
            students_count = (
                db.query(func.count(Student.id))
                .filter(Student.batch.in_(batch_names))
                .scalar()
                or 0
            )

        results.append(
            TeacherCourseResponse(
                id=c.id,
                slug=c.slug,
                name=c.name,
                category=c.category,
                level=c.level or "All Levels",
                duration=c.duration or "6 Months",
                thumbnail=c.thumbnail,
                tag=c.tag or "Assigned Course",
                short_desc=c.short_desc,
                status=c.status,
                modules_count=len(c.modules),
                batches_count=len(teacher_batches),
                students_count=students_count,
            )
        )
    return results


@router.get("/courses/{course_id}", response_model=TeacherCourseDetailResponse)
def get_teacher_course_detail(
    course_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_teacher),
):
    teacher_id = int(admin["sub"])
    teacher_role = admin.get("role", "teacher").lower()

    assigned_course_ids, assigned_batch_ids = _get_teacher_assigned_ids(
        db, teacher_id, teacher_role
    )

    if course_id not in assigned_course_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not assigned to teach this course.",
        )

    course = (
        db.query(Course)
        .options(
            joinedload(Course.modules).joinedload(CourseModule.lessons),
            joinedload(Course.batches),
        )
        .filter(Course.id == course_id)
        .first()
    )
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    teacher_batches = [
        b for b in course.batches if (teacher_role in {"admin", "super_admin"} or b.id in assigned_batch_ids)
    ]
    batch_summaries = []
    for b in teacher_batches:
        stu_cnt = (
            db.query(func.count(Student.id))
            .filter(Student.batch == b.name)
            .scalar()
            or 0
        )
        batch_summaries.append(
            TeacherBatchSummary(
                id=b.id,
                name=b.name,
                course_id=b.course_id,
                course_name=course.name,
                status=b.status,
                start_date=b.start_date,
                end_date=b.end_date,
                timing=b.timing,
                days=b.days,
                students_count=stu_cnt,
            )
        )

    sorted_modules = []
    for m in sorted(course.modules, key=lambda x: x.order_index):
        sorted_lessons = [
            {
                "id": l.id,
                "title": l.title,
                "duration": l.duration,
                "order_index": l.order_index,
                "video_url": l.video_url,
                "content": l.content,
            }
            for l in sorted(m.lessons, key=lambda x: x.order_index)
        ]
        sorted_modules.append(
            {
                "id": m.id,
                "title": m.title,
                "order_index": m.order_index,
                "description": m.description,
                "lessons": sorted_lessons,
            }
        )

    return TeacherCourseDetailResponse(
        id=course.id,
        slug=course.slug,
        name=course.name,
        category=course.category,
        level=course.level or "All Levels",
        duration=course.duration or "6 Months",
        thumbnail=course.thumbnail,
        tag=course.tag or "Assigned Course",
        short_desc=course.short_desc,
        full_desc=course.full_desc,
        tools=course.tools or [],
        outcomes=course.outcomes or [],
        requirements=course.requirements or [],
        career_roles=course.career_roles or [],
        status=course.status,
        modules=sorted_modules,
        batches=batch_summaries,
    )


# =====================================================================
# 3. MY BATCHES (ASSIGNED ONLY)
# =====================================================================
@router.get("/batches", response_model=List[TeacherBatchResponse])
def get_teacher_batches(
    db: Session = Depends(get_db),
    admin: dict = Depends(require_teacher),
):
    teacher_id = int(admin["sub"])
    teacher_role = admin.get("role", "teacher").lower()

    _, assigned_batch_ids = _get_teacher_assigned_ids(
        db, teacher_id, teacher_role
    )

    if not assigned_batch_ids:
        return []

    batches = (
        db.query(Batch)
        .options(joinedload(Batch.course))
        .filter(Batch.id.in_(assigned_batch_ids))
        .order_by(Batch.id.asc())
        .all()
    )

    results = []
    for b in batches:
        stu_cnt = (
            db.query(func.count(Student.id))
            .filter(Student.batch == b.name)
            .scalar()
            or 0
        )
        results.append(
            TeacherBatchResponse(
                id=b.id,
                name=b.name,
                course_id=b.course_id,
                course_name=b.course.name if b.course else "Assigned Course",
                status=b.status,
                start_date=b.start_date,
                end_date=b.end_date,
                timing=b.timing or "10:00 AM - 12:00 PM",
                days=b.days or "Mon, Wed, Fri",
                students_count=stu_cnt,
            )
        )
    return results


@router.get("/batches/{batch_id}", response_model=TeacherBatchDetailResponse)
def get_teacher_batch_detail(
    batch_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_teacher),
):
    teacher_id = int(admin["sub"])
    teacher_role = admin.get("role", "teacher").lower()

    _, assigned_batch_ids = _get_teacher_assigned_ids(
        db, teacher_id, teacher_role
    )

    if batch_id not in assigned_batch_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not assigned to this batch.",
        )

    batch = (
        db.query(Batch)
        .options(joinedload(Batch.course))
        .filter(Batch.id == batch_id)
        .first()
    )
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    students = (
        db.query(Student)
        .filter(Student.batch == batch.name)
        .order_by(Student.name.asc())
        .all()
    )

    student_responses = []
    today = date.today()
    today_marked = False

    for s in students:
        pct_str, _, _ = _calculate_student_attendance_rate(db, s.id)
        student_responses.append(
            TeacherStudentResponse(
                id=s.id,
                login_id=s.login_id,
                name=s.name,
                phone=s.phone,
                email=s.email,
                course=s.course,
                batch=s.batch,
                status=s.status,
                attendance_percentage=pct_str,
                enrollment_date=s.enrollment_date,
            )
        )

    if students:
        stu_ids = [s.id for s in students]
        marked_cnt = (
            db.query(func.count(Attendance.id))
            .filter(Attendance.student_id.in_(stu_ids), Attendance.date == today)
            .scalar()
            or 0
        )
        if marked_cnt > 0:
            today_marked = True

    timetable = [
        TeacherTodayClass(
            id=batch.id,
            batch_id=batch.id,
            batch_name=batch.name,
            course_id=batch.course_id,
            course_name=batch.course.name if batch.course else "Course",
            timing=batch.timing or "10:00 AM - 12:00 PM",
            days=batch.days or "Mon, Wed, Fri",
            status=batch.status,
            students_count=len(students),
            attendance_marked=today_marked,
            room="Lab 2 / Maya Studio",
        )
    ]

    return TeacherBatchDetailResponse(
        id=batch.id,
        name=batch.name,
        course_id=batch.course_id,
        course_name=batch.course.name if batch.course else "Course",
        course_slug=batch.course.slug if batch.course else None,
        status=batch.status,
        start_date=batch.start_date,
        end_date=batch.end_date,
        timing=batch.timing,
        days=batch.days,
        students_count=len(students),
        students=student_responses,
        timetable=timetable,
        today_attendance_marked=today_marked,
    )


@router.get("/batches/{batch_id}/students", response_model=List[TeacherStudentResponse])
def get_teacher_batch_students(
    batch_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_teacher),
):
    teacher_id = int(admin["sub"])
    teacher_role = admin.get("role", "teacher").lower()

    _, assigned_batch_ids = _get_teacher_assigned_ids(
        db, teacher_id, teacher_role
    )

    if batch_id not in assigned_batch_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not assigned to this batch.",
        )

    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    students = (
        db.query(Student)
        .filter(Student.batch == batch.name)
        .order_by(Student.name.asc())
        .all()
    )

    results = []
    for s in students:
        pct_str, _, _ = _calculate_student_attendance_rate(db, s.id)
        results.append(
            TeacherStudentResponse(
                id=s.id,
                login_id=s.login_id,
                name=s.name,
                phone=s.phone,
                email=s.email,
                course=s.course,
                batch=s.batch,
                status=s.status,
                attendance_percentage=pct_str,
                enrollment_date=s.enrollment_date,
            )
        )
    return results


# =====================================================================
# 4. STUDENTS (AUTHORIZED ONLY)
# =====================================================================
@router.get("/students", response_model=List[TeacherStudentResponse])
def get_teacher_students(
    search: Optional[str] = None,
    batch: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_teacher),
):
    teacher_id = int(admin["sub"])
    teacher_role = admin.get("role", "teacher").lower()

    _, assigned_batch_ids = _get_teacher_assigned_ids(
        db, teacher_id, teacher_role
    )

    if not assigned_batch_ids:
        return []

    batches = db.query(Batch.name).filter(Batch.id.in_(assigned_batch_ids)).all()
    batch_names = [b.name for b in batches if b.name]

    if not batch_names:
        return []

    query = db.query(Student).filter(Student.batch.in_(batch_names))

    if batch and batch != "all":
        query = query.filter(Student.batch == batch)

    if search:
        s = f"%{search.lower().strip()}%"
        query = query.filter(
            func.lower(Student.name).like(s)
            | func.lower(Student.phone).like(s)
            | func.lower(Student.login_id).like(s)
            | func.lower(Student.course).like(s)
        )

    students = query.order_by(Student.name.asc()).all()

    results = []
    for st in students:
        pct_str, _, _ = _calculate_student_attendance_rate(db, st.id)
        results.append(
            TeacherStudentResponse(
                id=st.id,
                login_id=st.login_id,
                name=st.name,
                phone=st.phone,
                email=st.email,
                course=st.course,
                batch=st.batch,
                status=st.status,
                attendance_percentage=pct_str,
                enrollment_date=st.enrollment_date,
            )
        )
    return results


@router.get("/students/{student_id}", response_model=TeacherStudentDetailResponse)
def get_teacher_student_detail(
    student_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_teacher),
):
    teacher_id = int(admin["sub"])
    teacher_role = admin.get("role", "teacher").lower()

    _, assigned_batch_ids = _get_teacher_assigned_ids(
        db, teacher_id, teacher_role
    )

    batches = db.query(Batch.name).filter(Batch.id.in_(assigned_batch_ids)).all()
    batch_names = [b.name for b in batches if b.name]

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Authorize: Student must be in one of the teacher's assigned batches
    if teacher_role not in {"admin", "super_admin"}:
        if not student.batch or student.batch not in batch_names:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You are not authorized to view students outside your assigned batches.",
            )

    pct_str, total_classes, attended_classes = _calculate_student_attendance_rate(db, student.id)

    # Attendance logs (last 15 records)
    attendance_records = (
        db.query(Attendance)
        .filter(Attendance.student_id == student.id)
        .order_by(Attendance.date.desc())
        .limit(15)
        .all()
    )

    formatted_records = [
        {
            "id": att.id,
            "date": att.date,
            "status": att.status,
            "marked_by": att.marked_by,
        }
        for att in attendance_records
    ]

    academic_progress = {
        "status": "In Progress",
        "current_module": "Module 2: 3D Character Rigging & Animation",
        "completed_modules": 1,
        "total_modules": 4,
        "assignments_submitted": 3,
        "assignments_pending": 1,
        "remarks": "Shows strong aesthetic sense in keyframe timing and facial expressions.",
    }

    return TeacherStudentDetailResponse(
        id=student.id,
        login_id=student.login_id,
        name=student.name,
        phone=student.phone,
        email=student.email,
        course=student.course,
        batch=student.batch,
        status=student.status,
        enrollment_date=student.enrollment_date,
        attendance_percentage=pct_str,
        total_classes=total_classes,
        attended_classes=attended_classes,
        attendance_records=formatted_records,
        academic_progress=academic_progress,
    )


# =====================================================================
# 5. CLASSES / TIMETABLE
# =====================================================================
@router.get("/timetable", response_model=List[TeacherTimetableItem])
def get_teacher_timetable(
    db: Session = Depends(get_db),
    admin: dict = Depends(require_teacher),
):
    teacher_id = int(admin["sub"])
    teacher_role = admin.get("role", "teacher").lower()

    _, assigned_batch_ids = _get_teacher_assigned_ids(
        db, teacher_id, teacher_role
    )

    if not assigned_batch_ids:
        return []

    batches = (
        db.query(Batch)
        .options(joinedload(Batch.course))
        .filter(Batch.id.in_(assigned_batch_ids))
        .order_by(Batch.id.asc())
        .all()
    )

    results = []
    for b in batches:
        stu_cnt = (
            db.query(func.count(Student.id))
            .filter(Student.batch == b.name)
            .scalar()
            or 0
        )
        results.append(
            TeacherTimetableItem(
                id=b.id,
                batch_id=b.id,
                batch_name=b.name,
                course_id=b.course_id,
                course_name=b.course.name if b.course else "Studio Course",
                timing=b.timing or "10:00 AM - 12:00 PM",
                days=b.days or "Mon, Wed, Fri",
                status=b.status,
                room="Studio Lab 1 (Workstations 1-20)",
                student_count=stu_cnt,
            )
        )
    return results


# =====================================================================
# 6. TEACHER PROFILE & EDIT
# =====================================================================
@router.get("/profile", response_model=TeacherProfileResponse)
def get_teacher_profile(
    db: Session = Depends(get_db),
    admin: dict = Depends(require_teacher),
):
    teacher_id = int(admin["sub"])
    teacher_role = admin.get("role", "teacher").lower()

    teacher_user = db.query(Admin).filter(Admin.id == teacher_id).first()
    if not teacher_user:
        raise HTTPException(status_code=404, detail="Teacher not found")

    assigned_course_ids, assigned_batch_ids = _get_teacher_assigned_ids(
        db, teacher_id, teacher_role
    )

    return TeacherProfileResponse(
        id=teacher_user.id,
        name=teacher_user.name,
        email=teacher_user.email,
        role=teacher_user.role,
        status=teacher_user.status,
        phone=getattr(teacher_user, "phone", None) or "9876543210",
        department=getattr(teacher_user, "department", None) or "Animation & VFX Department",
        designation="Lead Trainer & Senior Faculty",
        last_active_at=teacher_user.last_active_at,
        assigned_courses_count=len(assigned_course_ids),
        assigned_batches_count=len(assigned_batch_ids),
    )


@router.put("/profile", response_model=TeacherProfileResponse)
def update_teacher_profile(
    payload: TeacherProfileUpdate,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_teacher),
):
    teacher_id = int(admin["sub"])
    teacher_role = admin.get("role", "teacher").lower()

    teacher_user = db.query(Admin).filter(Admin.id == teacher_id).first()
    if not teacher_user:
        raise HTTPException(status_code=404, detail="Teacher not found")

    if payload.name and payload.name.strip():
        teacher_user.name = payload.name.strip()
    if payload.phone and payload.phone.strip():
        teacher_user.phone = payload.phone.strip()

    db.commit()
    db.refresh(teacher_user)

    log_activity(
        db,
        admin,
        action="updated_teacher_profile",
        entity_type="teacher",
        entity_id=teacher_user.id,
        details=f"Updated profile: {teacher_user.name}",
    )

    assigned_course_ids, assigned_batch_ids = _get_teacher_assigned_ids(
        db, teacher_id, teacher_role
    )

    return TeacherProfileResponse(
        id=teacher_user.id,
        name=teacher_user.name,
        email=teacher_user.email,
        role=teacher_user.role,
        status=teacher_user.status,
        phone=getattr(teacher_user, "phone", None) or "9876543210",
        department=getattr(teacher_user, "department", None) or "Animation & VFX Department",
        designation="Lead Trainer & Senior Faculty",
        last_active_at=teacher_user.last_active_at,
        assigned_courses_count=len(assigned_course_ids),
        assigned_batches_count=len(assigned_batch_ids),
    )


# =====================================================================
# 7. ATTENDANCE ENTRY POINT (FOR TEACHER'S ASSIGNED BATCHES)
# =====================================================================
@router.get("/batches/{batch_id}/attendance/today", response_model=TeacherBatchAttendanceStatus)
def get_batch_attendance_today(
    batch_id: int,
    target_date: Optional[date] = None,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_teacher),
):
    teacher_id = int(admin["sub"])
    teacher_role = admin.get("role", "teacher").lower()

    _, assigned_batch_ids = _get_teacher_assigned_ids(
        db, teacher_id, teacher_role
    )

    if batch_id not in assigned_batch_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not assigned to this batch.",
        )

    batch = (
        db.query(Batch)
        .options(joinedload(Batch.course))
        .filter(Batch.id == batch_id)
        .first()
    )
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    selected_date = target_date or date.today()
    students = (
        db.query(Student)
        .filter(Student.batch == batch.name)
        .order_by(Student.name.asc())
        .all()
    )

    records = []
    present_cnt = 0
    absent_cnt = 0
    leave_cnt = 0
    is_marked = False

    for s in students:
        att = (
            db.query(Attendance)
            .filter(Attendance.student_id == s.id, Attendance.date == selected_date)
            .first()
        )
        current_status = att.status if att else "present"  # default to present
        if att:
            is_marked = True
            if att.status == "present":
                present_cnt += 1
            elif att.status == "absent":
                absent_cnt += 1
            elif att.status == "leave":
                leave_cnt += 1

        records.append(
            {
                "student_id": s.id,
                "student_name": s.name,
                "student_login_id": s.login_id,
                "status": current_status,
                "date": selected_date,
            }
        )

    return TeacherBatchAttendanceStatus(
        batch_id=batch.id,
        batch_name=batch.name,
        course_name=batch.course.name if batch.course else "Course",
        date=selected_date,
        is_marked=is_marked,
        total_students=len(students),
        present_count=present_cnt if is_marked else len(students),
        absent_count=absent_cnt,
        leave_count=leave_cnt,
        records=records,
    )


@router.post("/batches/{batch_id}/attendance")
def submit_batch_attendance(
    batch_id: int,
    payload: TeacherBatchAttendanceSubmit,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_teacher),
):
    teacher_id = int(admin["sub"])
    teacher_role = admin.get("role", "teacher").lower()

    _, assigned_batch_ids = _get_teacher_assigned_ids(
        db, teacher_id, teacher_role
    )

    if batch_id not in assigned_batch_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not assigned to this batch.",
        )

    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    target_date = payload.date or date.today()
    teacher_name = admin.get("name", "Faculty Trainer")

    saved_count = 0
    for item in payload.records:
        existing = (
            db.query(Attendance)
            .filter(Attendance.student_id == item.student_id, Attendance.date == target_date)
            .first()
        )
        if existing:
            existing.status = item.status
            existing.marked_by = teacher_name
        else:
            new_rec = Attendance(
                student_id=item.student_id,
                date=target_date,
                status=item.status,
                marked_by=teacher_name,
            )
            db.add(new_rec)
        saved_count += 1

    db.commit()

    log_activity(
        db,
        admin,
        action="marked_batch_attendance",
        entity_type="attendance",
        entity_id=batch.id,
        details=f"Marked attendance for {saved_count} students in '{batch.name}' on {target_date}",
    )

    return {
        "message": f"Attendance successfully saved for {saved_count} students in '{batch.name}'.",
        "batch_id": batch.id,
        "date": target_date,
        "count": saved_count,
    }


# =====================================================================
# 8. ASSIGNMENT MANAGEMENT & SUBMISSION CHECKING
# =====================================================================
@router.get("/assignments", response_model=List[TeacherAssignmentResponse])
def get_teacher_assignments(
    db: Session = Depends(get_db),
    admin: dict = Depends(require_teacher),
):
    teacher_id = int(admin["sub"])
    teacher_role = admin.get("role", "teacher").lower()

    _, assigned_batch_ids = _get_teacher_assigned_ids(
        db, teacher_id, teacher_role
    )

    if not assigned_batch_ids:
        return []

    assignments = (
        db.query(Assignment)
        .options(joinedload(Assignment.batch), joinedload(Assignment.course))
        .filter(Assignment.batch_id.in_(assigned_batch_ids))
        .order_by(Assignment.created_at.desc())
        .all()
    )

    results = []
    for a in assignments:
        batch_name = a.batch.name if a.batch else "Batch"
        total_stu = (
            db.query(func.count(Student.id))
            .filter(Student.batch == batch_name)
            .scalar()
            or 0
        )
        sub_cnt = (
            db.query(func.count(StudentAssignmentSubmission.id))
            .filter(StudentAssignmentSubmission.assignment_id == a.id)
            .scalar()
            or 0
        )
        eval_cnt = (
            db.query(func.count(StudentAssignmentSubmission.id))
            .filter(
                StudentAssignmentSubmission.assignment_id == a.id,
                StudentAssignmentSubmission.status == "evaluated",
            )
            .scalar()
            or 0
        )
        pending_cnt = max(0, total_stu - sub_cnt)

        results.append(
            TeacherAssignmentResponse(
                id=a.id,
                title=a.title,
                description=a.description,
                batch_id=a.batch_id,
                batch_name=batch_name,
                course_id=a.course_id,
                course_name=a.course.name if a.course else "Course",
                due_date=a.due_date,
                max_marks=a.max_marks or 100,
                status="active",
                total_students=total_stu,
                submitted_count=sub_cnt,
                pending_count=pending_cnt,
                evaluated_count=eval_cnt,
                created_at=a.created_at,
            )
        )
    return results


@router.post("/assignments", response_model=TeacherAssignmentResponse)
def create_teacher_assignment(
    payload: TeacherAssignmentCreate,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_teacher),
):
    teacher_id = int(admin["sub"])
    teacher_role = admin.get("role", "teacher").lower()

    _, assigned_batch_ids = _get_teacher_assigned_ids(
        db, teacher_id, teacher_role
    )

    if payload.batch_id not in assigned_batch_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not assigned to this batch.",
        )

    batch = db.query(Batch).filter(Batch.id == payload.batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    course_id = payload.course_id or batch.course_id

    new_assignment = Assignment(
        batch_id=batch.id,
        course_id=course_id,
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        due_date=payload.due_date,
        max_marks=payload.max_marks or 100,
        created_by=teacher_id,
    )
    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)

    total_stu = (
        db.query(func.count(Student.id))
        .filter(Student.batch == batch.name)
        .scalar()
        or 0
    )

    log_activity(
        db,
        admin,
        action="created_assignment",
        entity_type="assignment",
        entity_id=new_assignment.id,
        details=f"Created assignment '{new_assignment.title}' for batch '{batch.name}'",
    )

    return TeacherAssignmentResponse(
        id=new_assignment.id,
        title=new_assignment.title,
        description=new_assignment.description,
        batch_id=batch.id,
        batch_name=batch.name,
        course_id=batch.course_id,
        course_name=batch.course.name if batch.course else "Course",
        due_date=new_assignment.due_date,
        max_marks=new_assignment.max_marks,
        status="active",
        total_students=total_stu,
        submitted_count=0,
        pending_count=total_stu,
        evaluated_count=0,
        created_at=new_assignment.created_at,
    )


@router.get(
    "/assignments/{assignment_id}/submissions",
    response_model=TeacherAssignmentSubmissionsResponse,
)
def get_assignment_submissions(
    assignment_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_teacher),
):
    teacher_id = int(admin["sub"])
    teacher_role = admin.get("role", "teacher").lower()

    _, assigned_batch_ids = _get_teacher_assigned_ids(
        db, teacher_id, teacher_role
    )

    assignment = (
        db.query(Assignment)
        .options(joinedload(Assignment.batch), joinedload(Assignment.course))
        .filter(Assignment.id == assignment_id)
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if assignment.batch_id not in assigned_batch_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not assigned to this batch.",
        )

    batch_name = assignment.batch.name if assignment.batch else ""
    students = (
        db.query(Student)
        .filter(Student.batch == batch_name)
        .order_by(Student.name.asc())
        .all()
    )

    submissions = (
        db.query(StudentAssignmentSubmission)
        .filter(StudentAssignmentSubmission.assignment_id == assignment_id)
        .all()
    )
    sub_map = {s.student_id: s for s in submissions}

    roster = []
    submitted_cnt = 0
    evaluated_cnt = 0

    for stu in students:
        sub = sub_map.get(stu.id)
        if sub:
            submitted_cnt += 1
            if sub.status == "evaluated":
                evaluated_cnt += 1
            roster.append(
                TeacherStudentSubmissionRosterItem(
                    student_id=stu.id,
                    student_name=stu.name,
                    student_login_id=stu.login_id,
                    status=sub.status,
                    submission_date=sub.submission_date,
                    content=sub.content,
                    file_url=sub.file_url,
                    marks=float(sub.marks) if sub.marks is not None else None,
                    feedback=sub.feedback,
                    evaluated_at=sub.evaluated_at,
                )
            )
        else:
            roster.append(
                TeacherStudentSubmissionRosterItem(
                    student_id=stu.id,
                    student_name=stu.name,
                    student_login_id=stu.login_id,
                    status="pending",
                    submission_date=None,
                    content=None,
                    file_url=None,
                    marks=None,
                    feedback=None,
                    evaluated_at=None,
                )
            )

    return TeacherAssignmentSubmissionsResponse(
        assignment_id=assignment.id,
        title=assignment.title,
        description=assignment.description,
        batch_id=assignment.batch_id,
        batch_name=batch_name,
        course_name=assignment.course.name if assignment.course else "Course",
        due_date=assignment.due_date,
        max_marks=assignment.max_marks or 100,
        total_students=len(students),
        submitted_count=submitted_cnt,
        pending_count=len(students) - submitted_cnt,
        evaluated_count=evaluated_cnt,
        submissions=roster,
    )


@router.post("/assignments/{assignment_id}/evaluate")
def evaluate_student_submission(
    assignment_id: int,
    payload: TeacherAssignmentEvaluateRequest,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_teacher),
):
    teacher_id = int(admin["sub"])
    teacher_role = admin.get("role", "teacher").lower()

    _, assigned_batch_ids = _get_teacher_assigned_ids(
        db, teacher_id, teacher_role
    )

    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if assignment.batch_id not in assigned_batch_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not assigned to this batch.",
        )

    submission = (
        db.query(StudentAssignmentSubmission)
        .filter(
            StudentAssignmentSubmission.assignment_id == assignment_id,
            StudentAssignmentSubmission.student_id == payload.student_id,
        )
        .first()
    )

    if not submission:
        # If student hadn't formally submitted but teacher is awarding marks
        submission = StudentAssignmentSubmission(
            assignment_id=assignment_id,
            student_id=payload.student_id,
            content="Direct Mentor Assessment",
            status="evaluated",
            marks=payload.marks,
            feedback=payload.feedback,
            evaluated_at=datetime.now(timezone.utc),
        )
        db.add(submission)
    else:
        submission.marks = payload.marks
        submission.feedback = payload.feedback
        submission.status = "evaluated"
        submission.evaluated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(submission)

    log_activity(
        db,
        admin,
        action="evaluated_assignment_submission",
        entity_type="assignment_submission",
        entity_id=submission.id,
        details=f"Evaluated Student #{payload.student_id} on Assignment #{assignment_id} with {payload.marks} marks",
    )

    return {
        "message": "Student submission evaluated and marks saved successfully.",
        "submission_id": submission.id,
        "student_id": payload.student_id,
        "marks": float(submission.marks),
        "status": submission.status,
    }


@router.get("/performance", response_model=List[TeacherPerformancePlaceholder])
def get_teacher_performance(
    db: Session = Depends(get_db),
    admin: dict = Depends(require_teacher),
):
    teacher_id = int(admin["sub"])
    teacher_role = admin.get("role", "teacher").lower()

    _, assigned_batch_ids = _get_teacher_assigned_ids(
        db, teacher_id, teacher_role
    )

    batches = db.query(Batch.name).filter(Batch.id.in_(assigned_batch_ids)).all()
    batch_names = [b.name for b in batches if b.name]

    if not batch_names:
        return []

    students = (
        db.query(Student)
        .filter(Student.batch.in_(batch_names))
        .limit(10)
        .all()
    )

    results = []
    for s in students:
        pct_str, _, _ = _calculate_student_attendance_rate(db, s.id)
        results.append(
            TeacherPerformancePlaceholder(
                student_id=s.id,
                student_name=s.name,
                student_login_id=s.login_id,
                batch_name=s.batch or "Assigned Batch",
                course_name=s.course,
                attendance_rate=pct_str,
                assignments_completed=3,
                total_assignments=4,
                grade_estimate="A" if "100" in pct_str or "9" in pct_str else "B+",
                remarks="Strong practical execution & good attendance.",
            )
        )
    return results


# =====================================================================
# 9. BATCH SYLLABUS & TOPIC PROGRESS TRACKER
# =====================================================================
@router.get("/batches/{batch_id}/curriculum")
def get_teacher_batch_curriculum(
    batch_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_teacher),
):
    teacher_id = int(admin["sub"])
    teacher_role = admin.get("role", "teacher").lower()

    _, assigned_batch_ids = _get_teacher_assigned_ids(
        db, teacher_id, teacher_role
    )

    if batch_id not in assigned_batch_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not assigned to this batch.",
        )

    batch = (
        db.query(Batch)
        .options(joinedload(Batch.course))
        .filter(Batch.id == batch_id)
        .first()
    )
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    course = batch.course
    if not course:
        return {
            "batch_id": batch.id,
            "batch_name": batch.name,
            "course_name": "Course",
            "total_topics": 0,
            "completed_topics": 0,
            "completion_percentage": 0,
            "modules": [],
        }

    completed_lesson_ids = {
        r.lesson_id
        for r in db.query(BatchLessonProgress.lesson_id)
        .filter(
            BatchLessonProgress.batch_id == batch.id,
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
        "batch_id": batch.id,
        "batch_name": batch.name,
        "course_id": course.id,
        "course_name": course.name,
        "total_topics": total_lessons,
        "completed_topics": completed_lessons,
        "completion_percentage": pct,
        "modules": modules_data,
    }


@router.post("/batches/{batch_id}/lessons/{lesson_id}/toggle")
def toggle_teacher_batch_lesson(
    batch_id: int,
    lesson_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_teacher),
):
    teacher_id = int(admin["sub"])
    teacher_role = admin.get("role", "teacher").lower()

    _, assigned_batch_ids = _get_teacher_assigned_ids(
        db, teacher_id, teacher_role
    )

    if batch_id not in assigned_batch_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not assigned to this batch.",
        )

    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    lesson = db.query(CourseLesson).filter(CourseLesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    progress = (
        db.query(BatchLessonProgress)
        .filter(
            BatchLessonProgress.batch_id == batch_id,
            BatchLessonProgress.lesson_id == lesson_id,
        )
        .first()
    )

    if not progress:
        progress = BatchLessonProgress(
            batch_id=batch_id,
            lesson_id=lesson_id,
            is_completed=True,
            completed_by=teacher_id,
        )
        db.add(progress)
        new_status = True
    else:
        progress.is_completed = not progress.is_completed
        progress.completed_at = datetime.now(timezone.utc)
        progress.completed_by = teacher_id
        new_status = progress.is_completed

    db.commit()

    action_label = "completed_topic" if new_status else "unmarked_topic"
    log_activity(
        db,
        admin,
        action=action_label,
        entity_type="curriculum_topic",
        entity_id=lesson.id,
        details=f"Topic '{lesson.title}' in batch '{batch.name}' marked as {'DONE' if new_status else 'PENDING'}",
    )

    return {
        "message": f"Topic '{lesson.title}' is now marked as {'DONE' if new_status else 'PENDING'}.",
        "batch_id": batch_id,
        "lesson_id": lesson_id,
        "is_completed": new_status,
    }


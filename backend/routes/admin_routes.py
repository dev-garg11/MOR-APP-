from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models.admin_models import Admin
from models.audit_log_models import AuditLog
from schemas.admin_schemas import (
    AdminSignup,
    AdminLogin,
    AdminResponse,
    TokenResponse,
    MessageResponse,
    StaffActivitySummary,
    UnifiedLoginRequest,
    UnifiedTokenResponse,
    UnifiedUserResponse,
)
from services.auth_service import hash_password, verify_password, create_access_token
from services.auth_dependency import (
    get_current_admin,
    get_optional_current_admin,
    require_admin,
    require_super_admin,
    require_hr,
    require_teacher,
)
from services.audit_service import log_activity

router = APIRouter(prefix="/auth", tags=["Admin Auth"])


# 1. Naya admin/counselor register karo
# - Pehla account hamesha 'admin' (Super Admin) role ke sath, aur turant 'active' hota hai.
# - Uske baad koi bhi naya staff account, chahe Super Admin banaye ya khud request kare,
#   'pending' status me create hota hai — Super Admin ki approval ke baad hi login chalega.
@router.post("/signup", response_model=TokenResponse)
def signup(
    admin: AdminSignup,
    db: Session = Depends(get_db),
    current_admin: dict | None = Depends(get_optional_current_admin),
):
    admin_exists = db.query(Admin.id).filter(Admin.role == "admin").first() is not None
    is_super_admin_creating = bool(current_admin and current_admin.get("role") == "admin")

    if admin_exists and not is_super_admin_creating and admin.role == "admin":
        raise HTTPException(status_code=403, detail="Only an existing Super Admin can create another admin account")
    if not admin_exists and admin.role != "admin":
        raise HTTPException(status_code=400, detail="The first account must be created with the admin role")

    existing = db.query(Admin).filter(Admin.email == admin.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # First account ever, OR created directly by a logged-in Super Admin -> active immediately.
    # Anyone self-requesting access (no token) after that -> pending, needs approval.
    initial_status = "active" if (not admin_exists or is_super_admin_creating) else "pending"

    new_admin = Admin(
        name=admin.name,
        email=admin.email,
        password_hash=hash_password(admin.password),
        role=admin.role,
        status=initial_status,
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    log_activity(
        db,
        current_admin,
        action="created_staff" if is_super_admin_creating else "requested_staff_access",
        entity_type="staff",
        entity_id=new_admin.id,
        details=f"{new_admin.name} <{new_admin.email}> role={new_admin.role} status={initial_status}",
    )

    if initial_status == "pending":
        # No usable token yet — the account must be approved first.
        raise HTTPException(
            status_code=201,
            detail="Request submitted. A Super Admin must approve your account before you can log in.",
        )

    token = create_access_token({"sub": str(new_admin.id), "email": new_admin.email, "role": new_admin.role})
    return TokenResponse(access_token=token, admin=new_admin)


# 2. Staff / Admin Login
@router.post("/login", response_model=TokenResponse)
def login(credentials: AdminLogin, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.email == credentials.email).first()
    if not admin or not verify_password(credentials.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if admin.status == "pending":
        raise HTTPException(status_code=403, detail="Your account is awaiting Super Admin approval.")
    if admin.status != "active":
        raise HTTPException(status_code=403, detail="Your account has been deactivated. Contact the Super Admin.")

    admin.last_active_at = datetime.now(timezone.utc)
    db.commit()

    token = create_access_token({"sub": str(admin.id), "email": admin.email, "role": admin.role, "name": admin.name})
    return TokenResponse(access_token=token, admin=admin)


# 3. Current Authenticated Staff Profile
@router.get("/me", response_model=AdminResponse)
def get_current_user_profile(
    db: Session = Depends(get_db),
    admin_payload: dict = Depends(get_current_admin),
):
    admin_id = int(admin_payload["sub"])
    admin = db.query(Admin).filter(Admin.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="User account not found")
    return admin


# 4. Universal Unified Login (Super Admin, HR, Teacher, Student)
@router.post("/unified-login", response_model=UnifiedTokenResponse)
def unified_login(credentials: UnifiedLoginRequest, db: Session = Depends(get_db)):
    ident = credentials.identifier.strip().lower()
    from models.student_models import Student

    # Check Staff accounts first (by email)
    admin = db.query(Admin).filter(func.lower(Admin.email) == ident).first()
    if admin:
        if not verify_password(credentials.password, admin.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials or password")

        if admin.status == "pending":
            raise HTTPException(status_code=403, detail="Your staff account is awaiting Super Admin approval.")
        if admin.status != "active":
            raise HTTPException(status_code=403, detail="Your staff account has been deactivated or suspended.")

        admin.last_active_at = datetime.now(timezone.utc)
        db.commit()

        raw_role = admin.role.lower()
        if raw_role in {"admin", "super_admin"}:
            normalized_role = "SUPER_ADMIN"
            dest = "super_admin"
        elif raw_role in {"hr", "counselor"}:
            normalized_role = "HR"
            dest = "hr"
        elif raw_role in {"teacher", "trainer"}:
            normalized_role = "TEACHER"
            dest = "teacher"
        else:
            normalized_role = "STAFF"
            dest = "staff"

        token = create_access_token({
            "sub": str(admin.id),
            "email": admin.email,
            "role": admin.role,
            "name": admin.name,
        })

        return UnifiedTokenResponse(
            access_token=token,
            role=normalized_role,
            destination=dest,
            user=UnifiedUserResponse(
                id=admin.id,
                name=admin.name,
                identifier=admin.email,
                role=normalized_role,
                status=admin.status,
            ),
        )

    # Check Student accounts (by login_id or email)
    student = db.query(Student).filter(
        (func.lower(Student.login_id) == ident) | (func.lower(Student.email) == ident)
    ).first()

    if student and student.password_hash and verify_password(credentials.password, student.password_hash):
        if student.status != "active":
            raise HTTPException(status_code=403, detail="Your student account has been deactivated or suspended.")

        token = create_access_token({
            "sub": str(student.id),
            "role": "student",
            "student_id": student.id,
            "name": student.name,
        })

        return UnifiedTokenResponse(
            access_token=token,
            role="STUDENT",
            destination="student",
            user=UnifiedUserResponse(
                id=student.id,
                name=student.name,
                identifier=student.login_id or student.email,
                role="STUDENT",
                status=student.status,
            ),
        )

    raise HTTPException(status_code=401, detail="Invalid login identifier or password")


# ------------------------------------------------------------------
# Super Admin only: staff directory, approvals, deactivation, and
# per-staff work tracking.
# ------------------------------------------------------------------

@router.get("/staff", response_model=list[AdminResponse])
def list_staff(
    status_filter: str | None = None,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
):
    query = db.query(Admin)
    if status_filter:
        query = query.filter(Admin.status == status_filter)
    return query.order_by(Admin.created_at.desc()).all()


@router.get("/staff/pending", response_model=list[AdminResponse])
def list_pending_staff(db: Session = Depends(get_db), _: dict = Depends(require_admin)):
    return db.query(Admin).filter(Admin.status == "pending").order_by(Admin.created_at.desc()).all()


@router.put("/staff/{staff_id}/approve", response_model=AdminResponse)
def approve_staff(staff_id: int, db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    staff = db.query(Admin).filter(Admin.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    staff.status = "active"
    db.commit()
    db.refresh(staff)
    log_activity(db, admin, "approved_staff", "staff", staff.id, f"{staff.name} <{staff.email}>")
    return staff


@router.put("/staff/{staff_id}/reject", response_model=MessageResponse)
def reject_staff(staff_id: int, db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    staff = db.query(Admin).filter(Admin.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    if staff.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending requests can be rejected")
    log_activity(db, admin, "rejected_staff", "staff", staff.id, f"{staff.name} <{staff.email}>")
    db.delete(staff)
    db.commit()
    return MessageResponse(message="Staff request rejected and removed.")


@router.put("/staff/{staff_id}/deactivate", response_model=AdminResponse)
def deactivate_staff(staff_id: int, db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    """Use when a staff member has left — blocks login without deleting their work history."""
    staff = db.query(Admin).filter(Admin.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    if staff.role == "admin" and admin.get("sub") == str(staff.id):
        raise HTTPException(status_code=400, detail="You cannot deactivate your own Super Admin account")
    staff.status = "inactive"
    db.commit()
    db.refresh(staff)
    log_activity(db, admin, "deactivated_staff", "staff", staff.id, f"{staff.name} <{staff.email}>")
    return staff


@router.put("/staff/{staff_id}/reactivate", response_model=AdminResponse)
def reactivate_staff(staff_id: int, db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    staff = db.query(Admin).filter(Admin.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    staff.status = "active"
    db.commit()
    db.refresh(staff)
    log_activity(db, admin, "reactivated_staff", "staff", staff.id, f"{staff.name} <{staff.email}>")
    return staff


@router.delete("/staff/{staff_id}", response_model=MessageResponse)
def delete_staff(staff_id: int, db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    staff = db.query(Admin).filter(Admin.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    if admin.get("sub") == str(staff.id):
        raise HTTPException(status_code=400, detail="You cannot delete your own account while logged in as it")
    log_activity(db, admin, "deleted_staff", "staff", staff.id, f"{staff.name} <{staff.email}>")
    db.delete(staff)
    db.commit()
    return MessageResponse(message="Staff account deleted.")


@router.get("/staff/{staff_id}/activity", response_model=StaffActivitySummary)
def get_staff_activity(staff_id: int, db: Session = Depends(get_db), _: dict = Depends(require_admin)):
    """
    Work-tracking dashboard for one staff member: how much they've done,
    how much recently, and what they touched most recently (a rough
    "currently working on" signal).
    """
    staff = db.query(Admin).filter(Admin.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    total_actions = (
        db.query(func.count(AuditLog.id)).filter(AuditLog.actor_admin_id == staff_id).scalar()
    )
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    recent_actions = (
        db.query(func.count(AuditLog.id))
        .filter(AuditLog.actor_admin_id == staff_id, AuditLog.created_at >= thirty_days_ago)
        .scalar()
    )
    latest_log = (
        db.query(AuditLog)
        .filter(AuditLog.actor_admin_id == staff_id)
        .order_by(AuditLog.created_at.desc())
        .first()
    )
    currently_working_on = None
    if latest_log:
        currently_working_on = f"{latest_log.action.replace('_', ' ')} ({latest_log.entity_type})"

    return StaffActivitySummary(
        staff_id=staff.id,
        name=staff.name,
        email=staff.email,
        role=staff.role,
        status=staff.status,
        tasks_completed=total_actions or 0,
        tasks_last_30_days=recent_actions or 0,
        last_active_at=staff.last_active_at,
        currently_working_on=currently_working_on,
    )


# ------------------------------------------------------------------
# Teacher / Faculty Onboarding & Course Allocation
# ------------------------------------------------------------------
@router.get("/teachers")
def list_teachers(
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
):
    from collections import defaultdict
    from models.batch_models import AdminBatchAssignment, AdminCourseAssignment, Batch
    from models.courses_models import Course

    teachers = db.query(Admin).filter(Admin.role == "teacher").all()
    if not teachers:
        return []

    t_ids = [t.id for t in teachers]

    course_rows = (
        db.query(AdminCourseAssignment.admin_id, Course.name)
        .join(Course, AdminCourseAssignment.course_id == Course.id)
        .filter(AdminCourseAssignment.admin_id.in_(t_ids))
        .all()
    )
    courses_map = defaultdict(list)
    for admin_id, c_name in course_rows:
        courses_map[admin_id].append(c_name)

    batch_rows = (
        db.query(AdminBatchAssignment.admin_id, Batch.name)
        .join(Batch, AdminBatchAssignment.batch_id == Batch.id)
        .filter(AdminBatchAssignment.admin_id.in_(t_ids))
        .all()
    )
    batches_map = defaultdict(list)
    for admin_id, b_name in batch_rows:
        batches_map[admin_id].append(b_name)

    return [
        {
            "id": t.id,
            "name": t.name,
            "email": t.email,
            "role": t.role,
            "status": t.status,
            "assigned_courses": courses_map.get(t.id, []),
            "assigned_batches": batches_map.get(t.id, []),
            "created_at": t.created_at,
        }
        for t in teachers
    ]


@router.post("/teachers/onboard")
def onboard_teacher(
    payload: dict,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(require_admin),
):
    from models.batch_models import AdminBatchAssignment, AdminCourseAssignment, Batch
    from models.courses_models import Course

    name = payload.get("name")
    email = payload.get("email", "").strip().lower()
    password = payload.get("password") or "Teacher@12345"
    course_id = payload.get("course_id")
    batch_id = payload.get("batch_id")

    if not name or not email:
        raise HTTPException(status_code=400, detail="Name and Email are required.")

    existing = db.query(Admin).filter(Admin.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"An account with email '{email}' already exists.")

    new_teacher = Admin(
        name=name.strip(),
        email=email,
        password_hash=hash_password(password),
        role="teacher",
        status="active",
    )
    db.add(new_teacher)
    db.commit()
    db.refresh(new_teacher)

    # Assign Course if valid
    assigned_course_name = None
    if course_id:
        course_obj = db.query(Course).filter(Course.id == course_id).first()
        if course_obj:
            c_assignment = AdminCourseAssignment(admin_id=new_teacher.id, course_id=course_obj.id)
            db.add(c_assignment)
            assigned_course_name = course_obj.name

    # Assign Batch if valid
    assigned_batch_name = None
    if batch_id:
        batch_obj = db.query(Batch).filter(Batch.id == batch_id).first()
        if batch_obj:
            b_assignment = AdminBatchAssignment(admin_id=new_teacher.id, batch_id=batch_obj.id)
            db.add(b_assignment)
            assigned_batch_name = batch_obj.name
            if not assigned_course_name and batch_obj.course_id:
                c_assignment = AdminCourseAssignment(admin_id=new_teacher.id, course_id=batch_obj.course_id)
                db.add(c_assignment)
                c_obj = db.query(Course).filter(Course.id == batch_obj.course_id).first()
                if c_obj:
                    assigned_course_name = c_obj.name

    db.commit()

    log_activity(
        db,
        current_admin,
        action="onboarded_teacher",
        entity_type="teacher",
        entity_id=new_teacher.id,
        details=f"Onboarded teacher {new_teacher.name} <{new_teacher.email}> assigned to course: {assigned_course_name}, batch: {assigned_batch_name}",
    )

    return {
        "message": f"Faculty member '{new_teacher.name}' onboarded successfully!",
        "teacher": {
            "id": new_teacher.id,
            "name": new_teacher.name,
            "email": new_teacher.email,
            "role": new_teacher.role,
            "status": new_teacher.status,
            "default_password": password,
            "assigned_course": assigned_course_name,
            "assigned_batch": assigned_batch_name,
        },
    }


@router.put("/teachers/{teacher_id}/status")
def update_teacher_status(
    teacher_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(require_admin),
):
    teacher = db.query(Admin).filter(Admin.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Faculty member not found.")

    new_status = payload.get("status", "active").lower()
    valid_statuses = {"active", "on_leave", "offline", "absent", "inactive"}
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{new_status}'. Allowed statuses: {sorted(list(valid_statuses))}",
        )

    teacher.status = new_status
    db.commit()
    db.refresh(teacher)

    log_activity(
        db,
        current_admin,
        action="updated_teacher_status",
        entity_type="teacher",
        entity_id=teacher.id,
        details=f"HR/Admin updated faculty member '{teacher.name}' status to '{new_status}'",
    )

    return {
        "message": f"Faculty '{teacher.name}' status updated to '{new_status}' successfully!",
        "teacher": {
            "id": teacher.id,
            "name": teacher.name,
            "email": teacher.email,
            "role": teacher.role,
            "status": teacher.status,
        },
    }



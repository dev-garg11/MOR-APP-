from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from database import get_db
from models.admin_models import Admin
from models.student_models import Student
from services.auth_service import decode_access_token

security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)

SUPER_ADMIN_ROLES = {"super_admin", "admin"}
HR_ROLES = {"super_admin", "admin", "hr", "counselor"}
TEACHER_ROLES = {"super_admin", "admin", "teacher", "trainer"}
ALL_STAFF_ROLES = {"super_admin", "admin", "hr", "counselor", "teacher", "trainer"}


import time

_STAFF_STATUS_CACHE = {}  # {admin_id: (status: str, expiry: float)}

def _ensure_staff_status_ok(payload: dict, db: Session) -> Admin:
    """
    Checks staff account status with a 30s in-memory TTL cache to eliminate
    unnecessary cross-region network roundtrips while keeping deactivations active.
    """
    admin_id = payload.get("sub")
    if not admin_id or not str(admin_id).isdigit():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token identifier.",
        )

    aid = int(admin_id)
    now = time.time()
    cached = _STAFF_STATUS_CACHE.get(aid)
    if cached and cached[1] > now:
        cached_status = cached[0]
        if cached_status != "active":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your staff account is inactive or suspended. Contact the Super Admin.",
            )
        # Fast path: query once or return row
        admin_row = db.query(Admin).filter(Admin.id == aid).first()
        return admin_row

    admin_row = db.query(Admin).filter(Admin.id == aid).first()
    if admin_row is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This staff account no longer exists.",
        )
    
    _STAFF_STATUS_CACHE[aid] = (admin_row.status, now + 30.0)

    if admin_row.status == "pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your staff account is awaiting Super Admin approval.",
        )
    if admin_row.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your staff account is inactive or suspended. Contact the Super Admin.",
        )
    return admin_row


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token. Please login again.",
        )

    user_role = str(payload.get("role", "")).lower()
    if user_role not in ALL_STAFF_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff credentials required for this action.",
        )

    admin_row = _ensure_staff_status_ok(payload, db)
    # Return normalized payload with verified database role
    payload["role"] = admin_row.role.lower()
    payload["name"] = admin_row.name
    return payload


def require_super_admin(
    admin: dict = Depends(get_current_admin),
):
    if admin.get("role") not in SUPER_ADMIN_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="SUPER_ADMIN permission required for this action.",
        )
    return admin


def require_hr(
    admin: dict = Depends(get_current_admin),
):
    if admin.get("role") not in HR_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HR / Counselor permission required for this action.",
        )
    return admin


# Backward-compatible alias — allows Super Admin, Admin, HR, and Counselors
require_admin = require_hr


def require_teacher(
    admin: dict = Depends(get_current_admin),
):
    if admin.get("role") not in TEACHER_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teacher / Trainer permission required for this action.",
        )
    return admin


def get_optional_current_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_security),
    db: Session = Depends(get_db),
):
    if credentials is None:
        return None

    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token. Please login again.",
        )
    _ensure_staff_status_ok(payload, db)
    return payload


def get_current_student(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token. Please login again.",
        )

    if payload.get("role") != "student" or not payload.get("student_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student portal access required for this action.",
        )

    student_id = payload.get("student_id")
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Student account not found.",
        )
    return payload


def get_optional_current_student(
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_security),
    db: Session = Depends(get_db),
):
    if credentials is None:
        return None

    payload = decode_access_token(credentials.credentials)
    if payload is None:
        return None

    if payload.get("role") != "student" or not payload.get("student_id"):
        return None

    student_id = payload.get("student_id")
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student or student.status != "active":
        return None

    return payload


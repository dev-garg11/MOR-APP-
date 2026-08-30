from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models.attendance_models import Attendance
from models.audit_log_models import AuditLog
from models.lead_models import Lead
from models.student_models import Student
from routes.fee_routes import ZERO, build_summary
from schemas.admin_schemas import AuditLogEntry
from services.auth_dependency import require_admin

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/overview")
def get_dashboard_overview(db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    lead_status_chart = [
        {"label": status, "count": count}
        for status, count in db.query(Lead.status, func.count(Lead.id)).group_by(Lead.status).all()
    ]
    student_course_chart = [
        {"label": course, "count": count}
        for course, count in db.query(Student.course, func.count(Student.id)).group_by(Student.course).all()
    ]

    start_date = date.today() - timedelta(days=6)
    attendance_rows = (
        db.query(Attendance.date, Attendance.status, func.count(Attendance.id))
        .filter(Attendance.date >= start_date)
        .group_by(Attendance.date, Attendance.status)
        .all()
    )
    attendance_by_date = {
        (start_date + timedelta(days=offset)).isoformat(): {"date": (start_date + timedelta(days=offset)).isoformat(), "present": 0, "absent": 0, "leave": 0}
        for offset in range(7)
    }
    for attendance_date, attendance_status, count in attendance_rows:
        attendance_by_date[attendance_date.isoformat()][attendance_status] = count

    fee_summaries = [build_summary(student) for student in db.query(Student).all()]
    total_fees = sum((summary.fees_total for summary in fee_summaries), ZERO)
    total_discount = sum((summary.discount_amount for summary in fee_summaries), ZERO)
    total_paid = sum((summary.fees_paid for summary in fee_summaries), ZERO)
    total_pending = sum((summary.pending_amount for summary in fee_summaries), ZERO)

    recent_leads = (
        db.query(Lead)
        .order_by(Lead.created_at.desc())
        .limit(5)
        .all()
    )
    return {
        "totals": {
            "leads": db.query(func.count(Lead.id)).scalar(),
            "students": db.query(func.count(Student.id)).scalar(),
            "fees_total": total_fees,
            "discount_total": total_discount,
            "fees_paid": total_paid,
            "fees_pending": total_pending,
            "overdue_students": sum(summary.fee_status == "overdue" for summary in fee_summaries),
        },
        "lead_status_chart": lead_status_chart,
        "student_course_chart": student_course_chart,
        "attendance_last_7_days": list(attendance_by_date.values()),
        "recent_leads": [
            {
                "id": lead.id,
                "name": lead.name,
                "phone": lead.phone,
                "status": lead.status,
                "course_interest": lead.course_interest,
                "created_at": lead.created_at,
            }
            for lead in recent_leads
        ],
    }


@router.get("/audit-trail", response_model=list[AuditLogEntry])
def get_audit_trail(
    limit: int = 50,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
):
    """Institution-wide 'who did what, when' feed for the Super Admin overview."""
    return (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(min(limit, 200))
        .all()
    )

from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from database import Base


class AuditLog(Base):
    """
    One row per meaningful staff action (create/update/delete on leads,
    students, attendance, fees, or staff accounts). Powers:
      - GET /auth/staff/{id}/activity  -> per-staff work-tracking dashboard
      - GET /dashboard/audit-trail     -> institution-wide recent activity feed
    """

    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    actor_name = Column(String(100), nullable=False)
    actor_role = Column(String(30), nullable=True)
    action = Column(String(50), nullable=False)  # e.g. "created_student", "approved_staff"
    entity_type = Column(String(30), nullable=False)  # e.g. "student", "attendance", "fee", "staff", "lead"
    entity_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

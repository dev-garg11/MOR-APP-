from datetime import datetime, timezone
from sqlalchemy.orm import Session

from models.admin_models import Admin
from models.audit_log_models import AuditLog


def log_activity(
    db: Session,
    admin: dict | None,
    action: str,
    entity_type: str,
    entity_id: int | None = None,
    details: str | None = None,
) -> None:
    """
    Writes one audit trail row and bumps the acting staff member's
    last_active_at timestamp. `admin` is the decoded JWT payload
    (dict with sub/email/role), as provided by auth_dependency functions.
    Never raises — a logging failure should never break or roll back the real request.
    """
    try:
        actor_admin_id = None
        actor_name = "System"
        actor_role = None

        if admin:
            actor_role = admin.get("role")
            actor_admin_id = int(admin["sub"]) if (admin.get("sub") and str(admin["sub"]).isdigit()) else None
            actor_name = admin.get("email", "Staff")

            if actor_admin_id:
                try:
                    db.query(Admin).filter(Admin.id == actor_admin_id).update(
                        {"last_active_at": datetime.now(timezone.utc)}
                    )
                except Exception:
                    pass

        audit_entry = AuditLog(
            actor_admin_id=actor_admin_id,
            actor_name=actor_name,
            actor_role=actor_role,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
        )
        db.add(audit_entry)
        db.commit()
    except Exception as error:
        # Do not rollback the caller's main entity
        try:
            db.rollback()
        except Exception:
            pass
        print(f"audit_service.log_activity note: {error}")

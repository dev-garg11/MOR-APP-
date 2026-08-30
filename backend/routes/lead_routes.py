from datetime import date, datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from database import get_db
from models.lead_models import Lead
from schemas.lead_schemas import (
    LeadCreate,
    LeadUpdate,
    LeadResponse,
    LeadStatsResponse,
    LeadStatusUpdate,
    LeadNoteCreate,
)
from services.auth_dependency import get_current_admin, require_admin
from services.audit_service import log_activity

router = APIRouter(prefix="/leads", tags=["Leads"])

VALID_STATUSES = {
    "new",
    "contacted",
    "follow_up",
    "interested",
    "admitted",
    "not_interested",
    "closed",
}


# 1. Public: anyone visiting the site can submit an enquiry without logging in.
@router.post("/", response_model=LeadResponse)
def create_lead(lead: LeadCreate, db: Session = Depends(get_db)):
    new_lead = Lead(**lead.model_dump())
    db.add(new_lead)
    db.commit()
    db.refresh(new_lead)
    try:
        log_activity(
            db,
            None,
            "created_lead",
            "lead",
            new_lead.id,
            f"{new_lead.name} <{new_lead.phone}> course={new_lead.course_interest}",
        )
    except Exception:
        pass
    return new_lead


# 2. HR Dashboard: Real-time calculated statistics
@router.get("/stats/overview", response_model=LeadStatsResponse)
def get_lead_stats(
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    status_counts = dict(db.query(Lead.status, func.count(Lead.id)).group_by(Lead.status).all())
    total = sum(status_counts.values())

    today = date.today()
    today_followups = (
        db.query(func.count(Lead.id))
        .filter(
            Lead.next_follow_up <= today,
            Lead.status.in_(["new", "contacted", "follow_up", "interested"]),
        )
        .scalar()
        or 0
    )

    return LeadStatsResponse(
        total=total,
        new=status_counts.get("new", 0),
        contacted=status_counts.get("contacted", 0),
        follow_up=status_counts.get("follow_up", 0),
        interested=status_counts.get("interested", 0),
        admitted=status_counts.get("admitted", 0),
        not_interested=status_counts.get("not_interested", 0),
        closed=status_counts.get("closed", 0),
        today_followups=today_followups,
    )


# 3. HR Follow-up Pipeline: Today's Follow-ups
@router.get("/followups/today", response_model=List[LeadResponse])
def get_today_followups(
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    today = date.today()
    return (
        db.query(Lead)
        .filter(
            Lead.next_follow_up <= today,
            Lead.status.in_(["new", "contacted", "follow_up", "interested"]),
        )
        .order_by(Lead.next_follow_up.asc(), Lead.created_at.desc())
        .all()
    )


# 4. HR Enquiry List with Search & Status Filter
@router.get("/", response_model=List[LeadResponse])
def get_leads(
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    query = db.query(Lead)
    if status and status.lower() != "all":
        query = query.filter(Lead.status == status.lower())

    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(Lead.name).like(s),
                func.lower(Lead.phone).like(s),
                func.lower(Lead.email).like(s),
                func.lower(Lead.course_interest).like(s),
            )
        )

    return query.order_by(Lead.created_at.desc()).all()


# 5. Get Enquiry Details by ID
@router.get("/{lead_id}", response_model=LeadResponse)
def get_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Enquiry / Lead not found")
    return lead


# 6. Update Enquiry Details (General Update)
@router.put("/{lead_id}", response_model=LeadResponse)
def update_lead(
    lead_id: int,
    updates: LeadUpdate,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Enquiry / Lead not found")

    update_data = updates.model_dump(exclude_unset=True)

    if "status" in update_data and update_data["status"]:
        clean_status = update_data["status"].lower()
        if clean_status not in VALID_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status '{clean_status}'. Must be one of: {list(VALID_STATUSES)}",
            )
        update_data["status"] = clean_status

    for key, value in update_data.items():
        setattr(lead, key, value)

    lead.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(lead)

    try:
        log_activity(db, admin, "updated_lead", "lead", lead.id, str(update_data))
    except Exception:
        pass

    return lead


# 7. Update Status Specifically (with Status validation)
@router.put("/{lead_id}/status", response_model=LeadResponse)
def update_lead_status(
    lead_id: int,
    status_update: LeadStatusUpdate,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Enquiry / Lead not found")

    clean_status = status_update.status.lower().strip()
    if clean_status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{clean_status}'. Must be one of: {list(VALID_STATUSES)}",
        )

    old_status = lead.status
    lead.status = clean_status

    if status_update.next_follow_up:
        lead.next_follow_up = status_update.next_follow_up

    # Append note if provided
    if status_update.notes:
        counselor_name = admin.get("email", "HR")
        timestamp_str = datetime.now().strftime("%d %b %Y, %I:%M %p")
        note_entry = f"\n[{timestamp_str} by {counselor_name}] Status changed {old_status.upper()} -> {clean_status.upper()}: {status_update.notes.strip()}"
        lead.notes = (lead.notes or "") + note_entry

    lead.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(lead)

    try:
        log_activity(
            db,
            admin,
            "status_changed",
            "lead",
            lead.id,
            f"From {old_status} to {clean_status}",
        )
    except Exception:
        pass

    return lead


# 8. Add Timestamped HR Note
@router.post("/{lead_id}/notes", response_model=LeadResponse)
def add_lead_note(
    lead_id: int,
    note_data: LeadNoteCreate,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Enquiry / Lead not found")

    if not note_data.note.strip():
        raise HTTPException(status_code=400, detail="Note text cannot be empty")

    counselor_name = admin.get("email", "HR")
    timestamp_str = datetime.now().strftime("%d %b %Y, %I:%M %p")
    note_entry = f"\n[{timestamp_str} by {counselor_name}]: {note_data.note.strip()}"

    lead.notes = (lead.notes or "") + note_entry
    lead.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(lead)

    try:
        log_activity(db, admin, "added_note", "lead", lead.id, note_data.note.strip())
    except Exception:
        pass

    return lead


# 9. Super Admin Only: Delete Lead
@router.delete("/{lead_id}")
def delete_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(require_admin),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Enquiry / Lead not found")

    try:
        log_activity(db, admin, "deleted_lead", "lead", lead.id, lead.name)
    except Exception:
        pass

    db.delete(lead)
    db.commit()
    return {"message": "Lead deleted successfully"}

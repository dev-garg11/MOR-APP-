from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class LeadCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    course_interest: Optional[str] = None
    source: Optional[str] = "manual"
    notes: Optional[str] = None

class LeadUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    next_follow_up: Optional[date] = None

class LeadStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None
    next_follow_up: Optional[date] = None

class LeadNoteCreate(BaseModel):
    note: str

class LeadStatsResponse(BaseModel):
    total: int
    new: int
    contacted: int
    follow_up: int
    interested: int
    admitted: int
    not_interested: int
    closed: int
    today_followups: int

class LeadResponse(BaseModel):
    id: int
    name: str
    phone: str
    email: Optional[str] = None
    course_interest: Optional[str] = None
    source: str
    status: str
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    next_follow_up: Optional[date] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
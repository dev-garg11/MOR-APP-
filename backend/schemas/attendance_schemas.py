from pydantic import BaseModel
from typing import Optional
from datetime import date as date_type, datetime as datetime_type

class AttendanceCreate(BaseModel):
    student_id: int
    date: Optional[date_type] = None
    status: str  # present, absent, leave
    marked_by: Optional[str] = None


class AttendanceUpdate(BaseModel):
    date: Optional[date_type] = None
    status: Optional[str] = None
    marked_by: Optional[str] = None

class AttendanceResponse(BaseModel):
    id: int
    student_id: int
    date: date_type
    status: str
    marked_by: Optional[str] = None
    created_at: datetime_type

    class Config:
        from_attributes = True

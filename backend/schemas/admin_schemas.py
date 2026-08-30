from pydantic import BaseModel, EmailStr
from typing import Optional, Any
from datetime import datetime

class AdminSignup(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "counselor"

class AdminLogin(BaseModel):
    email: EmailStr
    password: str

class UnifiedLoginRequest(BaseModel):
    identifier: str  # Can be email or student login_id (e.g. MA-2026-001)
    password: str

class UnifiedUserResponse(BaseModel):
    id: int
    name: str
    identifier: str
    role: str  # SUPER_ADMIN, HR, TEACHER, STUDENT
    status: str

class UnifiedTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    destination: str  # super_admin, hr, teacher, student
    user: UnifiedUserResponse

class AdminResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    status: str
    created_at: datetime
    last_active_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class StaffActivitySummary(BaseModel):
    staff_id: int
    name: str
    email: str
    role: str
    status: str
    tasks_completed: int
    tasks_last_30_days: int
    last_active_at: Optional[datetime] = None
    currently_working_on: Optional[str] = None

class AuditLogEntry(BaseModel):
    id: int
    actor_name: str
    actor_role: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin: AdminResponse

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

class MessageResponse(BaseModel):
    message: str

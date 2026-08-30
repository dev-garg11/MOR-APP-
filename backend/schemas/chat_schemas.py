from pydantic import BaseModel
from typing import Optional

class ChatRequest(BaseModel):
    message: str
    name: Optional[str] = None
    phone: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    lead_captured: bool = False
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.lead_models import Lead
from schemas.chat_schemas import ChatRequest, ChatResponse
from services.groq_service import ChatServiceError, get_chat_response

router = APIRouter(prefix="/chat", tags=["Chatbot"])

@router.post("/", response_model=ChatResponse)
def chat_with_bot(request: ChatRequest, db: Session = Depends(get_db)):
    # Groq se jawab lo
    try:
        bot_reply = get_chat_response(request.message)
    except ChatServiceError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Chatbot service is temporarily unavailable. Please try again later.",
        )

    lead_captured = False

    # Agar student ne naam aur phone diya hai, to lead automatically save karo
    if request.name and request.phone:
        new_lead = Lead(
            name=request.name,
            phone=request.phone,
            source="chatbot",
            status="new",
            notes=f"Chatbot query: {request.message}"
        )
        db.add(new_lead)
        db.commit()
        lead_captured = True

    return ChatResponse(reply=bot_reply, lead_captured=lead_captured)

import os
import logging
from groq import Groq
from groq import APIConnectionError, APIStatusError, AuthenticationError
from dotenv import load_dotenv
from data.courses_data import get_courses_as_text

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
logger = logging.getLogger(__name__)


class ChatServiceError(Exception):
    """Raised when the external chatbot provider cannot return a reply."""

SYSTEM_PROMPT = f"""You are a professional course counselor at Morph Academy.
Morph Academy teaches these courses:

{get_courses_as_text()}

STRICT RULES (follow these no matter what language the student writes in):
1. ALWAYS reply in pure, proper English only. Never use Hindi, Hinglish, or any other language, even if the student's question is in Hindi or Hinglish.
2. Only answer questions about the courses listed above.
3. If the student shares their name or phone number, or says something like "interested"/"want admission"/"want to enroll",
   politely tell them "we will contact you soon" and note their interest.
4. Keep answers short, clear, and professional. Avoid long paragraphs.
5. Do not mix languages under any circumstances. Your entire response must be in English.
"""


def _get_catalog_fallback_reply(query: str) -> str:
    q = query.lower()
    if any(k in q for k in ["fee", "cost", "price", "emi", "installment", "pay"]):
        return (
            "Morph Academy offers flexible semester fee plans starting from ₹45,000 to ₹1,20,000 depending on the specialization (3D Animation, VFX, Game Art). "
            "We also provide 0% interest EMI options. Please share your phone number so our admissions advisor can share the exact scholarship fee breakdown with you."
        )
    if any(k in q for k in ["vfx", "visual effects", "nuke", "after effects", "compositing"]):
        return (
            "Our VFX & Compositing Masterclass covers Foundry Nuke, Adobe After Effects, Green Screen Keying, Matchmoving, CGI Integration, and live studio project showreels. "
            "Duration ranges from 6 to 12 months with 100% placement assistance. Would you like to schedule a free demo session?"
        )
    if any(k in q for k in ["animation", "3d", "maya", "blender", "character"]):
        return (
            "Morph Academy's 3D Animation program covers Autodesk Maya, Blender, ZBrush Sculpting, Rigging, Character Animation, and Unreal Engine 5. "
            "Our alumni work at leading animation & gaming studios. Please share your contact details to receive the syllabus brochure."
        )
    if any(k in q for k in ["game", "unreal", "unity", "metaverse"]):
        return (
            "Our Game Design & Realtime 3D course covers Unreal Engine 5, Level Design, 3D Asset Creation, Shader Graphs, and Interactive Gameplay. "
            "Batches start every month with weekday and weekend options."
        )
    if any(k in q for k in ["placement", "job", "career", "salary", "hiring"]):
        return (
            "We have a dedicated Career & Placement Cell with 100% placement support, portfolio/showreel reviews, and tie-ups with top animation studios in Mumbai, Hyderabad, Chandigarh, and Bangalore."
        )
    if any(k in q for k in ["admission", "enroll", "batch", "join", "apply", "start", "seat"]):
        return (
            "Admissions for the upcoming batch are currently open! You can submit an enquiry with your contact number, and our senior counselor will reserve a free career counseling session for you."
        )
    return (
        "Welcome to Morph Academy! We specialize in industry-standard training for 2D/3D Animation, VFX & Compositing, Game Art (Unreal Engine), and Graphic Design. "
        "How can I help guide your creative career today? Feel free to ask about courses, fees, or upcoming batches."
    )


def get_chat_response(user_message: str, conversation_history: list = None):
    """
    Calls Groq API to generate counselor reply, falling back gracefully to academy knowledge if API key is invalid/offline.
    """
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    if conversation_history:
        messages.extend(conversation_history)

    messages.append({"role": "user", "content": user_message})

    api_key = os.getenv("GROQ_API_KEY")
    if client and api_key and not api_key.startswith("your_") and len(api_key) > 20:
        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                temperature=0.5,
                max_tokens=300,
            )
            if response.choices and response.choices[0].message.content:
                return response.choices[0].message.content.strip()
        except Exception as error:
            logger.warning(f"Groq API call encountered an error: {error}. Using knowledge fallback.")

    return _get_catalog_fallback_reply(user_message)

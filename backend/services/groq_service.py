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

def get_chat_response(user_message: str, conversation_history: list = None):
    """
    Groq API ko call karke chatbot ka jawab generate karta hai.
    conversation_history: pichle messages (optional, context ke liye)
    """
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    if conversation_history:
        messages.extend(conversation_history)

    messages.append({"role": "user", "content": user_message})

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.5,
            max_tokens=300,
        )
    except (AuthenticationError, APIConnectionError, APIStatusError) as error:
        logger.exception("Groq chatbot request failed")
        raise ChatServiceError("Chatbot provider is unavailable") from error

    return response.choices[0].message.content

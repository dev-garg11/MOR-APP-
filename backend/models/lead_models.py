from sqlalchemy import Column, Integer, String, Text, Date, TIMESTAMP
from sqlalchemy.sql import func
from database import Base

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(15), nullable=False)
    email = Column(String(100))
    course_interest = Column(String(100))
    source = Column(String(50), default="manual")
    status = Column(String(30), default="new")
    assigned_to = Column(String(100))
    notes = Column(Text)
    next_follow_up = Column(Date)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now())
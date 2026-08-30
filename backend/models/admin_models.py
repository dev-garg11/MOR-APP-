from sqlalchemy import Column, Integer, String, TIMESTAMP
from sqlalchemy.sql import func
from database import Base

class Admin(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), default="counselor")  # admin, counselor, trainer
    # pending -> awaiting Super Admin approval, active -> can log in,
    # inactive -> deactivated/left, so login is blocked without deleting history
    status = Column(String(20), nullable=False, default="active")
    phone = Column(String(50), nullable=True)
    department = Column(String(100), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    last_active_at = Column(TIMESTAMP, nullable=True)
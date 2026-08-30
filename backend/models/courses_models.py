from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Numeric,
    TIMESTAMP,
    ForeignKey,
    JSON,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(120), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False, index=True)
    category = Column(String(100), index=True, nullable=False, default="General")
    level = Column(String(50), default="Beginner to Advanced")
    duration = Column(String(100), default="6 Months")
    fees = Column(Numeric(10, 2), default=0)
    emi = Column(String(100), nullable=True)
    thumbnail = Column(String(500), nullable=True)
    tag = Column(String(100), nullable=True)
    short_desc = Column(Text, nullable=True)
    full_desc = Column(Text, nullable=True)
    
    # Rich metadata stored as JSON or string lists
    tools = Column(JSON, nullable=True)  # e.g. ["Maya", "Blender", "ZBrush"]
    outcomes = Column(JSON, nullable=True)  # e.g. ["Build character rigs", "Animate 3D walk cycles"]
    requirements = Column(JSON, nullable=True)  # e.g. ["No prior coding needed"]
    career_roles = Column(JSON, nullable=True)  # e.g. [{"role": "3D Animator", "avgSalary": "₹6 LPA"}]
    
    # Course status: draft | published | unpublished | archived
    status = Column(String(30), default="draft", index=True, nullable=False)

    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationship to modules (ordered by order_index)
    modules = relationship(
        "CourseModule",
        back_populates="course",
        cascade="all, delete-orphan",
        order_by="CourseModule.order_index",
    )


class CourseModule(Base):
    __tablename__ = "course_modules"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(
        Integer,
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = Column(String(150), nullable=False)
    order_index = Column(Integer, default=1, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    course = relationship("Course", back_populates="modules")
    lessons = relationship(
        "CourseLesson",
        back_populates="module",
        cascade="all, delete-orphan",
        order_by="CourseLesson.order_index",
    )


class CourseLesson(Base):
    __tablename__ = "course_lessons"

    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(
        Integer,
        ForeignKey("course_modules.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = Column(String(150), nullable=False)
    order_index = Column(Integer, default=1, nullable=False)
    duration = Column(String(50), nullable=True)
    video_url = Column(String(500), nullable=True)
    content = Column(Text, nullable=True)
    resources = Column(JSON, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    module = relationship("CourseModule", back_populates="lessons")
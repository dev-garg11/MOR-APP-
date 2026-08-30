from sqlalchemy import Column, Integer, String, Date, TIMESTAMP, ForeignKey, Text, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
from models.courses_models import Course
from models.admin_models import Admin
from models.student_models import Student


class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    course_id = Column(
        Integer,
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status = Column(String(30), default="active", nullable=False)  # active, completed, upcoming, paused
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    timing = Column(String(100), nullable=True)  # e.g., "10:00 AM - 12:00 PM"
    days = Column(String(100), nullable=True)    # e.g., "Mon, Wed, Fri" or "Daily"
    created_at = Column(TIMESTAMP, server_default=func.now())

    course = relationship("Course", backref="batches")


class AdminCourseAssignment(Base):
    __tablename__ = "admin_course_assignments"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    course_id = Column(
        Integer,
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    teacher = relationship("Admin", backref="course_assignments")
    course = relationship("Course", backref="teacher_assignments")


class AdminBatchAssignment(Base):
    __tablename__ = "admin_batch_assignments"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    batch_id = Column(
        Integer,
        ForeignKey("batches.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    teacher = relationship("Admin", backref="batch_assignments")
    batch = relationship("Batch", backref="teacher_assignments")


class AdminStudentAssignment(Base):
    __tablename__ = "admin_student_assignments"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    student_id = Column(
        Integer,
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    teacher = relationship("Admin", backref="student_assignments")
    student = relationship("Student", backref="teacher_assignments")


class BatchLessonProgress(Base):
    __tablename__ = "batch_lesson_progress"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(
        Integer,
        ForeignKey("batches.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    lesson_id = Column(
        Integer,
        ForeignKey("course_lessons.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    is_completed = Column(Boolean, default=True, nullable=False)
    completed_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    completed_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    batch = relationship("Batch", backref="lesson_progress_records")
    lesson = relationship("CourseLesson", backref="batch_progress_records")

from sqlalchemy import Column, Integer, String, Text, Numeric, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(String(50), nullable=True)
    max_marks = Column(Integer, default=100)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    batch = relationship("Batch", lazy="joined")
    course = relationship("Course", lazy="joined")
    submissions = relationship("StudentAssignmentSubmission", back_populates="assignment", cascade="all, delete-orphan")


class StudentAssignmentSubmission(Base):
    __tablename__ = "student_assignment_submissions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    submission_date = Column(TIMESTAMP, server_default=func.now())
    content = Column(Text, nullable=True)
    file_url = Column(String(255), nullable=True)
    status = Column(String(20), default="submitted")  # submitted, evaluated
    marks = Column(Numeric(5, 2), nullable=True)
    feedback = Column(Text, nullable=True)
    evaluated_at = Column(TIMESTAMP, nullable=True)

    # Relationships
    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("Student", lazy="joined")

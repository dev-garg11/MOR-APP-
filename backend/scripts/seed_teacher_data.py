import sys
import os
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine, SessionLocal, Base
from sqlalchemy import text
from models.admin_models import Admin
from models.lead_models import Lead
from models.courses_models import Course
from models.student_models import Student
from models.attendance_models import Attendance
from models.batch_models import Batch, AdminCourseAssignment, AdminBatchAssignment, AdminStudentAssignment
from services.auth_service import hash_password


def ensure_db_schema():
    print("--- 1. Ensuring DB Schema & Tables for Batch & Teacher Assignments ---")
    Base.metadata.create_all(bind=engine)

    with engine.connect() as conn:
        # Safely add columns to batches table if missing
        cols_to_add = [
            ("start_date", "DATE"),
            ("end_date", "DATE"),
            ("timing", "VARCHAR(100)"),
            ("days", "VARCHAR(100)"),
            ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
        ]
        for col_name, col_type in cols_to_add:
            try:
                conn.execute(text(f"ALTER TABLE batches ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
                conn.commit()
            except Exception as e:
                print(f"  Column note ({col_name}): {e}")
    print("[OK] Schema migration completed.")


def seed_teacher_system():
    ensure_db_schema()
    db = SessionLocal()
    print("\n--- 2. Seeding Teachers, Courses, Batches, and Student Enrollments ---")

    today = date.today()

    # 1. Teachers
    teacher1 = db.query(Admin).filter(Admin.email == "teacher@morphyacademy.com").first()
    if not teacher1:
        teacher1 = Admin(
            name="Maya 3D Trainer",
            email="teacher@morphyacademy.com",
            password_hash=hash_password("Teacher@12345"),
            role="teacher",
            status="active",
        )
        db.add(teacher1)
    else:
        teacher1.name = "Maya 3D Trainer"
        teacher1.role = "teacher"
        teacher1.status = "active"
        teacher1.password_hash = hash_password("Teacher@12345")
    db.commit()
    db.refresh(teacher1)
    print(f"[OK] Teacher 1: {teacher1.name} (id={teacher1.id}, email={teacher1.email})")

    teacher2 = db.query(Admin).filter(Admin.email == "other_teacher@morphyacademy.com").first()
    if not teacher2:
        teacher2 = Admin(
            name="VFX & Compositing Faculty",
            email="other_teacher@morphyacademy.com",
            password_hash=hash_password("Teacher@12345"),
            role="teacher",
            status="active",
        )
        db.add(teacher2)
    else:
        teacher2.name = "VFX & Compositing Faculty"
        teacher2.role = "teacher"
        teacher2.status = "active"
        teacher2.password_hash = hash_password("Teacher@12345")
    db.commit()
    db.refresh(teacher2)
    print(f"[OK] Teacher 2 (Isolated for Security Tests): {teacher2.name} (id={teacher2.id}, email={teacher2.email})")

    # 2. Courses
    c_anim = db.query(Course).filter(Course.name == "3D Animation Masterclass").first()
    if not c_anim:
        c_anim = Course(
            name="3D Animation Masterclass",
            slug="3d-animation-masterclass",
            category="3D Animation",
            level="Beginner to Advanced",
            duration="6 Months",
            fees=45000,
            status="published",
        )
        db.add(c_anim)
        db.commit()
        db.refresh(c_anim)

    c_vfx = db.query(Course).filter(Course.name == "VFX & Film Compositing").first()
    if not c_vfx:
        c_vfx = Course(
            name="VFX & Film Compositing",
            slug="vfx-film-compositing",
            category="VFX",
            level="Intermediate",
            duration="6 Months",
            fees=48000,
            status="published",
        )
        db.add(c_vfx)
        db.commit()
        db.refresh(c_vfx)

    c_dm = db.query(Course).filter(Course.name == "Digital Marketing & AI Growth Hacking").first()
    if not c_dm:
        c_dm = Course(
            name="Digital Marketing & AI Growth Hacking",
            slug="digital-marketing-ai-growth-hacking",
            category="Digital Marketing",
            level="All Levels",
            duration="4 Months",
            fees=32000,
            status="published",
        )
        db.add(c_dm)
        db.commit()
        db.refresh(c_dm)

    # 3. Batches
    batches_data = [
        {
            "name": "Maya 3D — Batch A",
            "course_id": c_anim.id,
            "status": "active",
            "start_date": today - timedelta(days=30),
            "end_date": today + timedelta(days=150),
            "timing": "10:00 AM - 12:00 PM",
            "days": "Mon, Wed, Fri",
        },
        {
            "name": "Maya 3D — Batch B",
            "course_id": c_anim.id,
            "status": "active",
            "start_date": today - timedelta(days=15),
            "end_date": today + timedelta(days=165),
            "timing": "02:00 PM - 04:00 PM",
            "days": "Tue, Thu, Sat",
        },
        {
            "name": "Digital Marketing — Morning Batch",
            "course_id": c_dm.id,
            "status": "active",
            "start_date": today - timedelta(days=10),
            "end_date": today + timedelta(days=110),
            "timing": "09:00 AM - 11:00 AM",
            "days": "Mon, Tue, Wed, Thu",
        },
        {
            "name": "VFX Compositing — Batch A",
            "course_id": c_vfx.id,
            "status": "active",
            "start_date": today - timedelta(days=20),
            "end_date": today + timedelta(days=160),
            "timing": "11:00 AM - 01:00 PM",
            "days": "Mon, Wed, Fri",
        },
    ]

    seeded_batches = {}
    for b_data in batches_data:
        batch_row = db.query(Batch).filter(Batch.name == b_data["name"]).first()
        if not batch_row:
            batch_row = Batch(**b_data)
            db.add(batch_row)
            db.commit()
            db.refresh(batch_row)
        else:
            batch_row.course_id = b_data["course_id"]
            batch_row.status = b_data["status"]
            batch_row.start_date = b_data["start_date"]
            batch_row.end_date = b_data["end_date"]
            batch_row.timing = b_data["timing"]
            batch_row.days = b_data["days"]
            db.commit()
            db.refresh(batch_row)
        seeded_batches[b_data["name"]] = batch_row
        print(f"[OK] Batch: {batch_row.name} (id={batch_row.id}, timing={batch_row.timing})")

    # 4. Assignments: Course -> Teacher, Batch -> Teacher
    # Teacher 1 gets: Maya 3D Batch A, Maya 3D Batch B, Digital Marketing Morning Batch
    t1_batch_names = ["Maya 3D — Batch A", "Maya 3D — Batch B", "Digital Marketing — Morning Batch"]
    t1_course_ids = [c_anim.id, c_dm.id]

    # Teacher 2 gets: VFX Compositing Batch A
    t2_batch_names = ["VFX Compositing — Batch A"]
    t2_course_ids = [c_vfx.id]

    # Clean existing assignments for idempotency
    db.query(AdminCourseAssignment).filter(AdminCourseAssignment.admin_id.in_([teacher1.id, teacher2.id])).delete(synchronize_session=False)
    db.query(AdminBatchAssignment).filter(AdminBatchAssignment.admin_id.in_([teacher1.id, teacher2.id])).delete(synchronize_session=False)
    db.commit()

    # Add Teacher 1 course assignments
    for cid in t1_course_ids:
        db.add(AdminCourseAssignment(admin_id=teacher1.id, course_id=cid))
    # Add Teacher 1 batch assignments
    for bname in t1_batch_names:
        db.add(AdminBatchAssignment(admin_id=teacher1.id, batch_id=seeded_batches[bname].id))

    # Add Teacher 2 course assignments
    for cid in t2_course_ids:
        db.add(AdminCourseAssignment(admin_id=teacher2.id, course_id=cid))
    # Add Teacher 2 batch assignments
    for bname in t2_batch_names:
        db.add(AdminBatchAssignment(admin_id=teacher2.id, batch_id=seeded_batches[bname].id))

    db.commit()
    print(f"[OK] Teacher 1 assigned to 2 courses and 3 batches.")
    print(f"[OK] Teacher 2 assigned to 1 course and 1 batch (VFX Compositing — Batch A).")

    # 5. Students
    students_data = [
        {
            "name": "Aarav Sharma",
            "login_id": "MA-2026-001",
            "phone": "9876543210",
            "email": "aarav.student@morphyacademy.com",
            "course": "3D Animation Masterclass",
            "batch": "Maya 3D — Batch A",
            "status": "active",
        },
        {
            "name": "Kavita Patel",
            "login_id": "MA-2026-002",
            "phone": "9822334455",
            "email": "kavita.patel@morphyacademy.com",
            "course": "3D Animation Masterclass",
            "batch": "Maya 3D — Batch A",
            "status": "active",
        },
        {
            "name": "Rahul Sharma",
            "login_id": "MA-2026-003",
            "phone": "9833445566",
            "email": "rahul.sharma@morphyacademy.com",
            "course": "3D Animation Masterclass",
            "batch": "Maya 3D — Batch B",
            "status": "active",
        },
        {
            "name": "Sneha Roy",
            "login_id": "MA-2026-004",
            "phone": "9844556677",
            "email": "sneha.roy@morphyacademy.com",
            "course": "Digital Marketing & AI Growth Hacking",
            "batch": "Digital Marketing — Morning Batch",
            "status": "active",
        },
        {
            "name": "Vikramaditya Rao",
            "login_id": "MA-2026-005",
            "phone": "9855667788",
            "email": "vikram.rao@morphyacademy.com",
            "course": "VFX & Film Compositing",
            "batch": "VFX Compositing — Batch A",
            "status": "active",
        },
    ]

    seeded_students = []
    for s_data in students_data:
        s_row = db.query(Student).filter(Student.login_id == s_data["login_id"]).first()
        if not s_row:
            s_row = Student(**s_data)
            db.add(s_row)
            db.commit()
            db.refresh(s_row)
        else:
            s_row.name = s_data["name"]
            s_row.phone = s_data["phone"]
            s_row.email = s_data["email"]
            s_row.course = s_data["course"]
            s_row.batch = s_data["batch"]
            s_row.status = s_data["status"]
            db.commit()
            db.refresh(s_row)
        seeded_students.append(s_row)
        print(f"[OK] Student: {s_row.name} ({s_row.login_id}) enrolled in '{s_row.batch}'")

    # 6. Attendance records for testing
    for s in seeded_students:
        # Mark 3 past dates
        for day_offset in [1, 2, 3]:
            att_date = today - timedelta(days=day_offset)
            existing_att = db.query(Attendance).filter(Attendance.student_id == s.id, Attendance.date == att_date).first()
            if not existing_att:
                db.add(Attendance(
                    student_id=s.id,
                    date=att_date,
                    status="present" if day_offset != 2 else "present",
                    marked_by="Maya 3D Trainer"
                ))
    db.commit()
    print("[OK] Attendance history seeded.")

    db.close()
    print("\n==================================================")
    print("  STEP 5 TEACHER MODULE DATA SEEDING COMPLETE!    ")
    print("==================================================")


if __name__ == "__main__":
    seed_teacher_system()

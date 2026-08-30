import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models.admin_models import Admin
from models.lead_models import Lead
from models.student_models import Student
from services.auth_service import hash_password

def seed_step3_accounts():
    db = SessionLocal()
    print("==================================================")
    print("  SEEDING ACCOUNTS FOR STEP 3 ROLE-BASED ACCESS   ")
    print("==================================================")

    # 1. SUPER_ADMIN
    super_admin = db.query(Admin).filter(Admin.email == "admin@morphyacademy.com").first()
    if not super_admin:
        super_admin = Admin(
            name="Morphy Super Admin",
            email="admin@morphyacademy.com",
            password_hash=hash_password("Admin@12345"),
            role="admin",
            status="active"
        )
        db.add(super_admin)
    else:
        super_admin.role = "admin"
        super_admin.status = "active"
        super_admin.password_hash = hash_password("Admin@12345")
    db.commit()
    print("[OK] SUPER_ADMIN: admin@morphyacademy.com / Admin@12345")

    # 2. HR / COUNSELOR
    hr_user = db.query(Admin).filter(Admin.email == "hr@morphyacademy.com").first()
    if not hr_user:
        hr_user = Admin(
            name="Senior HR Counselor",
            email="hr@morphyacademy.com",
            password_hash=hash_password("Hr@12345"),
            role="hr",
            status="active"
        )
        db.add(hr_user)
    else:
        hr_user.role = "hr"
        hr_user.status = "active"
        hr_user.password_hash = hash_password("Hr@12345")
    db.commit()
    print("[OK] HR: hr@morphyacademy.com / Hr@12345")

    # 3. TEACHER / TRAINER
    teacher_user = db.query(Admin).filter(Admin.email == "teacher@morphyacademy.com").first()
    if not teacher_user:
        teacher_user = Admin(
            name="Maya 3D Trainer",
            email="teacher@morphyacademy.com",
            password_hash=hash_password("Teacher@12345"),
            role="teacher",
            status="active"
        )
        db.add(teacher_user)
    else:
        teacher_user.role = "teacher"
        teacher_user.status = "active"
        teacher_user.password_hash = hash_password("Teacher@12345")
    db.commit()
    print("[OK] TEACHER: teacher@morphyacademy.com / Teacher@12345")

    # 4. INACTIVE / SUSPENDED ACCOUNT
    inactive_user = db.query(Admin).filter(Admin.email == "suspended@morphyacademy.com").first()
    if not inactive_user:
        inactive_user = Admin(
            name="Suspended Counselor",
            email="suspended@morphyacademy.com",
            password_hash=hash_password("Suspended@12345"),
            role="hr",
            status="inactive"
        )
        db.add(inactive_user)
    else:
        inactive_user.status = "inactive"
        inactive_user.password_hash = hash_password("Suspended@12345")
    db.commit()
    print("[OK] INACTIVE STAFF: suspended@morphyacademy.com / Suspended@12345 (status='inactive')")

    # 5. STUDENT ACCOUNT
    student = db.query(Student).filter(Student.login_id == "MA-2026-001").first()
    if not student:
        student = Student(
            login_id="MA-2026-001",
            name="Aarav Sharma",
            phone="9876543210",
            email="aarav.student@morphyacademy.com",
            course="3D Animation Masterclass",
            batch="Batch-2026-A",
            password_hash=hash_password("Student@12345"),
            status="active"
        )
        db.add(student)
    else:
        student.password_hash = hash_password("Student@12345")
        student.status = "active"
    db.commit()
    print("[OK] STUDENT: Login ID MA-2026-001 / Student@12345")

    db.close()
    print("==================================================")
    print("  ALL 5 STEP 3 ROLES & ACCOUNTS SEEDED (100% OK)  ")
    print("==================================================")

if __name__ == "__main__":
    seed_step3_accounts()


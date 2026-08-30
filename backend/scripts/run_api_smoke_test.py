"""Run a complete backend smoke test and remove all temporary test records."""

from datetime import date, timedelta
from uuid import uuid4

from fastapi.testclient import TestClient

import routes.chat_routes as chat_routes
from database import SessionLocal
from main import app
from models.admin_models import Admin
from models.attendance_models import Attendance
from models.fee_payment_models import FeePayment
from models.lead_models import Lead
from models.student_models import Student
from services.auth_service import create_access_token


client = TestClient(app)
run_id = uuid4().hex[:10]
admin_headers = {
    "Authorization": "Bearer "
    + create_access_token({"sub": "smoke-admin", "email": "smoke-admin@example.com", "role": "admin"})
}
lead_id = student_id = attendance_id = payment_id = None
staff_email = f"staff-{run_id}@gmail.com"
checks: list[str] = []


def check(method: str, path: str, expected: int, headers=None, **kwargs):
    response = client.request(method, path, headers=headers, **kwargs)
    assert response.status_code == expected, f"{method} {path}: {response.status_code} {response.text}"
    result = f"{method} {path} -> {response.status_code}"
    checks.append(result)
    print(f"PASS {result}", flush=True)
    return response


def cleanup() -> None:
    db = SessionLocal()
    try:
        if attendance_id:
            db.query(Attendance).filter(Attendance.id == attendance_id).delete()
        if payment_id:
            db.query(FeePayment).filter(FeePayment.id == payment_id).delete()
        if student_id:
            db.query(Student).filter(Student.id == student_id).delete()
        if lead_id:
            db.query(Lead).filter(Lead.id == lead_id).delete()
        db.query(Admin).filter(Admin.email == staff_email).delete()
        db.commit()
    finally:
        db.close()


try:
    check("GET", "/", 200)
    check("GET", "/openapi.json", 200)
    check("GET", "/test-db", 200)

    # Admin creates a staff account; login verifies the password/auth flow.
    check(
        "POST",
        "/auth/signup",
        200,
        admin_headers,
        json={"name": "Smoke Staff", "email": staff_email, "password": "StaffPass123!", "role": "counselor"},
    )
    check("POST", "/auth/login", 200, json={"email": staff_email, "password": "StaffPass123!"})
    check("POST", "/auth/login", 401, json={"email": staff_email, "password": "WrongPass123!"})

    lead = check(
        "POST", "/leads/", 200, admin_headers,
        json={"name": "Smoke Lead", "phone": "9123456789", "course_interest": "Data Analytics"},
    )
    lead_id = lead.json()["id"]
    check("GET", "/leads/?status=new", 200, admin_headers)
    check("GET", f"/leads/{lead_id}", 200, admin_headers)
    check("PUT", f"/leads/{lead_id}", 200, admin_headers, json={"status": "contacted"})

    student = check(
        "POST", "/students/", 200, admin_headers,
        json={
            "lead_id": lead_id,
            "name": "Smoke Student",
            "phone": "9234567890",
            "course": "Data Analytics",
            "fees_total": "1000.00",
            "discount_amount": "100.00",
            "fee_due_date": (date.today() - timedelta(days=1)).isoformat(),
        },
    )
    student_id = student.json()["id"]
    check("GET", "/students/?course=Data%20Analytics", 200, admin_headers)
    check("GET", f"/students/{student_id}", 200, admin_headers)
    check("PUT", f"/students/{student_id}", 200, admin_headers, json={"batch": "Morning"})

    login_id = f"smoke-{run_id}"
    check(
        "POST", f"/students/{student_id}/credentials", 200, admin_headers,
        json={"login_id": login_id, "password": "StudentPass123!"},
    )
    student_login = check(
        "POST", "/student-auth/login", 200,
        json={"login_id": login_id, "password": "StudentPass123!"},
    )
    student_headers = {"Authorization": "Bearer " + student_login.json()["access_token"]}

    attendance = check(
        "POST", "/attendance/", 200, admin_headers,
        json={"student_id": student_id, "status": "present", "marked_by": "Smoke Admin"},
    )
    attendance_id = attendance.json()["id"]
    check("POST", "/attendance/", 400, admin_headers, json={"student_id": student_id, "status": "present"})
    check("GET", f"/attendance/?student_id={student_id}", 200, admin_headers)
    check("GET", f"/attendance/student/{student_id}", 200, admin_headers)
    check("PUT", f"/attendance/{attendance_id}", 200, admin_headers, json={"status": "leave"})

    payment = check(
        "POST", "/fees/payments", 200, admin_headers,
        json={"student_id": student_id, "amount": "500.00", "payment_mode": "upi"},
    )
    payment_id = payment.json()["id"]
    summary = check("GET", f"/fees/student/{student_id}", 200, admin_headers).json()
    assert summary["pending_amount"] == "400.00" and summary["fee_status"] == "overdue"
    check("GET", "/fees/pending", 200, admin_headers)
    check("PUT", f"/fees/payments/{payment_id}", 200, admin_headers, json={"amount": "450.00"})

    check("GET", "/dashboard/overview", 200, admin_headers)
    check("GET", "/student-portal/me", 200, student_headers)
    check("GET", "/student-portal/me/fees", 200, student_headers)
    check("GET", "/student-portal/me/attendance", 200, student_headers)
    check("GET", "/fees/pending", 403, student_headers)
    check("GET", "/attendance/", 403, student_headers)
    check("GET", "/students/", 403, student_headers)

    # Route flow is tested without spending an external Groq API request.
    original_chat = chat_routes.get_chat_response
    chat_routes.get_chat_response = lambda message: "Smoke chatbot reply"
    try:
        response = check("POST", "/chat/", 200, json={"message": "Tell me about courses"})
        assert response.json()["reply"] == "Smoke chatbot reply"
    finally:
        chat_routes.get_chat_response = original_chat

    check("DELETE", f"/attendance/{attendance_id}", 200, admin_headers)
    attendance_id = None
    check("DELETE", f"/fees/payments/{payment_id}", 200, admin_headers)
    payment_id = None
    check("DELETE", f"/students/{student_id}", 200, admin_headers)
    student_id = None
    check("DELETE", f"/leads/{lead_id}", 200, admin_headers)
    lead_id = None
finally:
    cleanup()

print(f"API_SMOKE_TEST_OK: {len(checks)}/{len(checks)} checks passed")
for item in checks:
    print(f"PASS {item}")

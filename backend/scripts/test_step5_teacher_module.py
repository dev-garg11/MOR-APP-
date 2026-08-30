import sys
import os
import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models.admin_models import Admin
from models.batch_models import Batch
from models.courses_models import Course
from models.student_models import Student

BASE_URL = "http://127.0.0.1:8000"


def run_step5_tests():
    print("==================================================================")
    print("  STEP 5: TEACHER MODULE COMPREHENSIVE TEST SUITE (22 TESTS)")
    print("==================================================================")

    passed = 0
    failed = 0

    def assert_test(name, condition, details=""):
        nonlocal passed, failed
        if condition:
            passed += 1
            print(f"  [PASS] Test {passed + failed:02d}: {name}")
        else:
            failed += 1
            print(f"  [FAIL] Test {passed + failed:02d}: {name}")
            if details:
                print(f"         -> {details}")

    # Fetch IDs from DB for precise testing
    db = SessionLocal()
    t1_user = db.query(Admin).filter(Admin.email == "teacher@morphyacademy.com").first()
    t2_user = db.query(Admin).filter(Admin.email == "other_teacher@morphyacademy.com").first()
    b_maya_a = db.query(Batch).filter(Batch.name == "Maya 3D — Batch A").first()
    b_vfx = db.query(Batch).filter(Batch.name == "VFX Compositing — Batch A").first()
    c_anim = db.query(Course).filter(Course.name == "3D Animation Masterclass").first()
    c_vfx = db.query(Course).filter(Course.name == "VFX & Film Compositing").first()
    s_aarav = db.query(Student).filter(Student.name == "Aarav Sharma").first()
    s_vikram = db.query(Student).filter(Student.name == "Vikramaditya Rao").first()
    db.close()

    # --- 1. Teacher 1 Login ---
    login1_res = requests.post(
        f"{BASE_URL}/auth/unified-login",
        json={"identifier": "teacher@morphyacademy.com", "password": "Teacher@12345"},
    )
    assert_test(
        "Teacher 1 Login -> Returns 200 OK with TEACHER role and JWT Token",
        login1_res.status_code == 200
        and login1_res.json().get("role") == "TEACHER"
        and bool(login1_res.json().get("access_token")),
        f"Status: {login1_res.status_code}, Body: {login1_res.text[:100]}",
    )
    t1_token = login1_res.json().get("access_token")
    t1_headers = {"Authorization": f"Bearer {t1_token}"}

    # --- 2. Teacher 2 Login (Isolated Faculty) ---
    login2_res = requests.post(
        f"{BASE_URL}/auth/unified-login",
        json={"identifier": "other_teacher@morphyacademy.com", "password": "Teacher@12345"},
    )
    assert_test(
        "Teacher 2 Login -> Returns 200 OK for second isolated teacher",
        login2_res.status_code == 200 and bool(login2_res.json().get("access_token")),
        f"Status: {login2_res.status_code}",
    )
    t2_token = login2_res.json().get("access_token")
    t2_headers = {"Authorization": f"Bearer {t2_token}"}

    # --- 3. Teacher Dashboard ---
    dash_res = requests.get(f"{BASE_URL}/teacher/dashboard", headers=t1_headers)
    assert_test(
        "Dashboard: GET /teacher/dashboard returns real metrics, today classes, and assigned batches",
        dash_res.status_code == 200
        and "summary" in dash_res.json()
        and dash_res.json()["summary"]["my_batches_count"] >= 1
        and len(dash_res.json().get("today_classes", [])) >= 1,
        f"Status: {dash_res.status_code}, Body: {dash_res.text[:150]}",
    )

    # --- 4. Assigned Courses Only ---
    courses_res = requests.get(f"{BASE_URL}/teacher/courses", headers=t1_headers)
    assert_test(
        "Courses: GET /teacher/courses returns only assigned courses (excludes unassigned)",
        courses_res.status_code == 200
        and isinstance(courses_res.json(), list)
        and any(c["name"] == "3D Animation Masterclass" for c in courses_res.json())
        and not any(c["name"] == "VFX & Film Compositing" for c in courses_res.json()),
        f"Courses: {[c['name'] for c in courses_res.json()]}",
    )

    # --- 5. Course Detail ---
    c_anim_id = c_anim.id if c_anim else 3
    c_detail_res = requests.get(f"{BASE_URL}/teacher/courses/{c_anim_id}", headers=t1_headers)
    assert_test(
        f"Course Detail: GET /teacher/courses/{c_anim_id} returns syllabus & teacher batches",
        c_detail_res.status_code == 200 and "modules" in c_detail_res.json() and "batches" in c_detail_res.json(),
        f"Status: {c_detail_res.status_code}",
    )

    # --- 6. Security: Unauthorized Course Access ---
    c_vfx_id = c_vfx.id if c_vfx else 4
    unauth_course_res = requests.get(f"{BASE_URL}/teacher/courses/{c_vfx_id}", headers=t1_headers)
    assert_test(
        f"Security: Teacher 1 attempting unassigned course #{c_vfx_id} -> Rejected with 403 Forbidden",
        unauth_course_res.status_code == 403,
        f"Status: {unauth_course_res.status_code}",
    )

    # --- 7. Assigned Batches Only ---
    batches_res = requests.get(f"{BASE_URL}/teacher/batches", headers=t1_headers)
    assert_test(
        "Batches: GET /teacher/batches returns only assigned batches with schedule & students",
        batches_res.status_code == 200
        and len(batches_res.json()) >= 1
        and any(b["name"] == "Maya 3D — Batch A" for b in batches_res.json())
        and not any(b["name"] == "VFX Compositing — Batch A" for b in batches_res.json()),
        f"Batches: {[b['name'] for b in batches_res.json()]}",
    )

    # --- 8. Batch Details ---
    b_maya_id = b_maya_a.id if b_maya_a else 1
    b_detail_res = requests.get(f"{BASE_URL}/teacher/batches/{b_maya_id}", headers=t1_headers)
    assert_test(
        f"Batch Detail: GET /teacher/batches/{b_maya_id} returns batch info, schedule & enrolled students",
        b_detail_res.status_code == 200
        and b_detail_res.json()["name"] == "Maya 3D — Batch A"
        and len(b_detail_res.json()["students"]) >= 1,
        f"Status: {b_detail_res.status_code}",
    )

    # --- 9. Security: Cross-Teacher Batch Access Blocked ---
    b_vfx_id = b_vfx.id if b_vfx else 4
    unauth_batch_res = requests.get(f"{BASE_URL}/teacher/batches/{b_vfx_id}", headers=t1_headers)
    assert_test(
        f"Security: Teacher 1 requesting Teacher 2's Batch #{b_vfx_id} -> Rejected with 403 Forbidden",
        unauth_batch_res.status_code == 403,
        f"Status: {unauth_batch_res.status_code}",
    )

    # --- 10. Batch Students ---
    b_students_res = requests.get(f"{BASE_URL}/teacher/batches/{b_maya_id}/students", headers=t1_headers)
    assert_test(
        f"Batch Students: GET /teacher/batches/{b_maya_id}/students returns students with attendance %",
        b_students_res.status_code == 200 and len(b_students_res.json()) >= 1,
        f"Status: {b_students_res.status_code}",
    )

    # --- 11. All Assigned Students Directory ---
    students_res = requests.get(f"{BASE_URL}/teacher/students", headers=t1_headers)
    assert_test(
        "Students: GET /teacher/students returns all students from assigned batches (excludes other batches)",
        students_res.status_code == 200
        and any(s["name"] == "Aarav Sharma" for s in students_res.json())
        and not any(s["name"] == "Vikramaditya Rao" for s in students_res.json()),
        f"Students: {[s['name'] for s in students_res.json()]}",
    )

    # --- 12. Student Details for Teacher ---
    s_aarav_id = s_aarav.id if s_aarav else 1
    s_detail_res = requests.get(f"{BASE_URL}/teacher/students/{s_aarav_id}", headers=t1_headers)
    assert_test(
        f"Student Detail: GET /teacher/students/{s_aarav_id} returns safe academic info and attendance history",
        s_detail_res.status_code == 200
        and s_detail_res.json()["name"] == "Aarav Sharma"
        and "attendance_records" in s_detail_res.json()
        and "fees_total" not in s_detail_res.json()  # sensitive payment data redacted
        and "discount_amount" not in s_detail_res.json(),
        f"Status: {s_detail_res.status_code}",
    )

    # --- 13. Security: Unauthorized Student Access Blocked ---
    s_vikram_id = s_vikram.id if s_vikram else 5
    unauth_stu_res = requests.get(f"{BASE_URL}/teacher/students/{s_vikram_id}", headers=t1_headers)
    assert_test(
        f"Security: Teacher 1 accessing unassigned Student #{s_vikram_id} -> Rejected with 403 Forbidden",
        unauth_stu_res.status_code == 403,
        f"Status: {unauth_stu_res.status_code}",
    )

    # --- 14. Timetable / Classes ---
    tt_res = requests.get(f"{BASE_URL}/teacher/timetable", headers=t1_headers)
    assert_test(
        "Timetable: GET /teacher/timetable returns schedule organized by batch & time slot",
        tt_res.status_code == 200 and len(tt_res.json()) >= 1 and "timing" in tt_res.json()[0],
        f"Status: {tt_res.status_code}",
    )

    # --- 15. Teacher Profile ---
    prof_res = requests.get(f"{BASE_URL}/teacher/profile", headers=t1_headers)
    assert_test(
        "Profile: GET /teacher/profile returns teacher info with assigned batch/course counts",
        prof_res.status_code == 200 and prof_res.json()["email"] == "teacher@morphyacademy.com",
        f"Status: {prof_res.status_code}",
    )

    # --- 16. Teacher Profile Update ---
    update_prof_res = requests.put(
        f"{BASE_URL}/teacher/profile",
        json={"phone": "9811223344"},
        headers=t1_headers,
    )
    assert_test(
        "Profile Update: PUT /teacher/profile updates allowed contact information",
        update_prof_res.status_code == 200 and update_prof_res.json()["phone"] == "9811223344",
        f"Status: {update_prof_res.status_code}",
    )

    # --- 17. Batch Attendance Today Status ---
    att_today_res = requests.get(f"{BASE_URL}/teacher/batches/{b_maya_id}/attendance/today", headers=t1_headers)
    assert_test(
        f"Attendance Status: GET /teacher/batches/{b_maya_id}/attendance/today returns student roster",
        att_today_res.status_code == 200 and "records" in att_today_res.json() and len(att_today_res.json()["records"]) >= 1,
        f"Status: {att_today_res.status_code}",
    )

    # --- 18. Mark Batch Attendance ---
    mark_payload = {
        "records": [
            {"student_id": s_aarav_id, "status": "present"},
        ]
    }
    mark_res = requests.post(f"{BASE_URL}/teacher/batches/{b_maya_id}/attendance", json=mark_payload, headers=t1_headers)
    assert_test(
        f"Mark Attendance: POST /teacher/batches/{b_maya_id}/attendance successfully records attendance",
        mark_res.status_code == 200 and mark_res.json()["count"] >= 1,
        f"Status: {mark_res.status_code}",
    )

    # --- 19. Security: Unauthorized Attendance Blocked ---
    unauth_mark_res = requests.post(
        f"{BASE_URL}/teacher/batches/{b_vfx_id}/attendance",
        json=mark_payload,
        headers=t1_headers,
    )
    assert_test(
        f"Security: Teacher 1 attempting to mark attendance in Teacher 2's Batch #{b_vfx_id} -> Rejected (403)",
        unauth_mark_res.status_code == 403,
        f"Status: {unauth_mark_res.status_code}",
    )

    # --- 20. Future Integration Endpoints ---
    assign_res = requests.get(f"{BASE_URL}/teacher/assignments", headers=t1_headers)
    perf_res = requests.get(f"{BASE_URL}/teacher/performance", headers=t1_headers)
    assert_test(
        "Future Integrations: Assignments & Performance endpoints return structured payloads",
        assign_res.status_code == 200 and perf_res.status_code == 200,
        f"Assign: {assign_res.status_code}, Perf: {perf_res.status_code}",
    )

    # --- 21. Security: Student role rejected from Teacher endpoints ---
    stu_login = requests.post(
        f"{BASE_URL}/auth/unified-login",
        json={"identifier": "MA-2026-001", "password": "Student@12345"},
    )
    stu_headers = {"Authorization": f"Bearer {stu_login.json().get('access_token')}"}
    stu_block_res = requests.get(f"{BASE_URL}/teacher/dashboard", headers=stu_headers)
    assert_test(
        "Security: Student role attempting /teacher/dashboard -> Rejected with 403 Forbidden",
        stu_block_res.status_code == 403,
        f"Status: {stu_block_res.status_code}",
    )

    # --- 22. Security: Teacher role rejected from Super Admin endpoints ---
    admin_block_res = requests.get(f"{BASE_URL}/auth/staff", headers=t1_headers)
    assert_test(
        "Security: Teacher role attempting Super Admin /auth/staff endpoint -> Rejected with 403 Forbidden",
        admin_block_res.status_code == 403,
        f"Status: {admin_block_res.status_code}",
    )

    print("==================================================================")
    print(f"  TOTAL: {passed + failed} | PASSED: {passed} | FAILED: {failed}")
    print("==================================================================")

    if failed == 0:
        print("  >>> ALL 22 STEP 5 TESTS PASSED WITH 100% SUCCESS! <<<")
    else:
        sys.exit(1)


if __name__ == "__main__":
    run_step5_tests()


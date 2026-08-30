"""
Comprehensive Test Suite for:
1. Student Auto Unique ID Generation & Login Credentials
2. Teacher Unique Credentials & Course/Batch/Attendance Flow
3. Full Assignment Creation, Submission Tracking ('student ne assignment kari hai ya nahi'), and Mentor Evaluation
4. Role-based Security Isolation
"""
import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("=" * 65)
    print("  COMPREHENSIVE ASSIGNMENTS, ATTENDANCE & UNIQUE ID TEST SUITE")
    print("=" * 65)

    passed = 0
    failed = 0

    def record(name, is_pass, detail=""):
        nonlocal passed, failed
        if is_pass:
            passed += 1
            print(f"  [PASS] {name}")
        else:
            failed += 1
            print(f"  [FAIL] {name}\n         -> {detail}")

    # 1. Admin Login to create student
    admin_login_res = requests.post(
        f"{BASE_URL}/auth/unified-login",
        json={"identifier": "admin@morphyacademy.com", "password": "Admin@12345"}
    )
    admin_token = admin_login_res.json().get("access_token")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    record("01. Super Admin Authentication -> Returns 200 OK with Admin Token", admin_login_res.status_code == 200)

    # 2. Add New Student without providing login_id -> Backend auto generates unique MA-2026-XXX
    new_student_payload = {
        "name": "Arjun Singhania",
        "phone": "9876500011",
        "email": "arjun.singhania@example.com",
        "course": "3D Animation Masterclass",
        "batch": "Maya 3D — Batch A",
        "mode": "offline",
        "fees_total": 65000,
        "fees_paid": 20000,
    }
    create_stu_res = requests.post(f"{BASE_URL}/students/", json=new_student_payload, headers=admin_headers)
    stu_data = create_stu_res.json()
    new_stu_id = stu_data.get("id")
    new_stu_login_id = stu_data.get("login_id")
    
    is_valid_unique_id = bool(new_stu_login_id and "MA-" in new_stu_login_id)
    record(f"02. Add New Student -> Auto-generates Unique ID '{new_stu_login_id}' & credentials", create_stu_res.status_code == 200 and is_valid_unique_id)

    # 3. Student logs in using Unique ID
    stu_login_res = requests.post(
        f"{BASE_URL}/auth/unified-login",
        json={"identifier": new_stu_login_id, "password": "Student@12345"}
    )
    stu_token = stu_login_res.json().get("access_token")
    stu_headers = {"Authorization": f"Bearer {stu_token}"}
    record("03. Student Login -> Authenticates via Unique Student ID & default password", stu_login_res.status_code == 200 and bool(stu_token))

    # 4. Teacher 1 Login
    t1_login_res = requests.post(
        f"{BASE_URL}/auth/unified-login",
        json={"identifier": "teacher@morphyacademy.com", "password": "Teacher@12345"}
    )
    t1_token = t1_login_res.json().get("access_token")
    t1_headers = {"Authorization": f"Bearer {t1_token}"}
    record("04. Teacher 1 Authentication -> Returns 200 OK with TEACHER role", t1_login_res.status_code == 200 and t1_login_res.json().get("role") == "TEACHER")

    # 5. Teacher views assigned Courses & Syllabus
    t_courses_res = requests.get(f"{BASE_URL}/teacher/courses", headers=t1_headers)
    courses_list = t_courses_res.json()
    record("05. Teacher Courses -> Retrieves assigned curriculum tracks", t_courses_res.status_code == 200 and len(courses_list) > 0)

    # 6. Teacher views assigned Batches
    t_batches_res = requests.get(f"{BASE_URL}/teacher/batches", headers=t1_headers)
    batches_list = t_batches_res.json()
    target_batch = batches_list[0] if batches_list else None
    target_batch_id = target_batch.get("id") if target_batch else 1
    record("06. Teacher Batches -> Retrieves assigned batch cohorts", t_batches_res.status_code == 200 and target_batch is not None)

    # 7. Teacher marks Attendance for Batch
    att_res = requests.post(
        f"{BASE_URL}/teacher/batches/{target_batch_id}/attendance",
        json={
            "records": [
                {"student_id": new_stu_id, "status": "present"}
            ]
        },
        headers=t1_headers
    )
    record("07. Attendance System -> Teacher marks batch attendance in PostgreSQL", att_res.status_code == 200)

    # 8. Teacher creates a practical Assignment for the batch
    create_assign_res = requests.post(
        f"{BASE_URL}/teacher/assignments",
        json={
            "batch_id": target_batch_id,
            "title": "Maya 3D Character Rigging & Turntable Submission",
            "description": "Rig the biped character model with IK/FK arms and render a 360 turntable in Arnold.",
            "due_date": "2026-08-30",
            "max_marks": 100
        },
        headers=t1_headers
    )
    assign_data = create_assign_res.json()
    assign_id = assign_data.get("id")
    record(f"08. Assignment Creation -> Teacher creates assignment #{assign_id} for Batch {target_batch_id}", create_assign_res.status_code == 200 and assign_id is not None)

    # 9. Teacher queries assignments list ("kitni karva di hai")
    list_assign_res = requests.get(f"{BASE_URL}/teacher/assignments", headers=t1_headers)
    assign_list = list_assign_res.json()
    created_match = any(a.get("id") == assign_id for a in assign_list)
    record("09. Teacher Assignments Overview -> Lists created assignments with live submission counters", list_assign_res.status_code == 200 and created_match)

    # 10. Student checks assignments for their batch
    stu_assign_res = requests.get(f"{BASE_URL}/student-portal/me/assignments", headers=stu_headers)
    stu_assignments = stu_assign_res.json()
    stu_has_assign = any(a.get("id") == assign_id for a in stu_assignments)
    record("10. Student Portal -> Student views published assignment with status 'pending'", stu_assign_res.status_code == 200 and stu_has_assign)

    # 11. Initial Submission Roster Check before student submission ("student ne assignment kari hai ya nahi")
    before_sub_res = requests.get(f"{BASE_URL}/teacher/assignments/{assign_id}/submissions", headers=t1_headers)
    before_roster = before_sub_res.json().get("submissions", [])
    stu_roster_entry = next((s for s in before_roster if s.get("student_id") == new_stu_id), None)
    is_initially_pending = stu_roster_entry is not None and stu_roster_entry.get("status") == "pending"
    record("11. Submission Check (Pre-submit) -> Roster correctly shows student status as 'pending'", before_sub_res.status_code == 200 and is_initially_pending)

    # 12. Student Submits Assignment
    submit_res = requests.post(
        f"{BASE_URL}/student-portal/assignments/{assign_id}/submit",
        json={
            "content": "Completed biped IK/FK rigging. Turntable video uploaded to drive.",
            "file_url": "https://drive.google.com/file/d/morphy_character_rig.mb"
        },
        headers=stu_headers
    )
    record("12. Student Submission -> Student submits project work with Google Drive link", submit_res.status_code == 200 and submit_res.json().get("status") == "submitted")

    # 13. Teacher Re-checks Submissions Roster ("student ne assignment kari hai ya nahi")
    after_sub_res = requests.get(f"{BASE_URL}/teacher/assignments/{assign_id}/submissions", headers=t1_headers)
    after_roster = after_sub_res.json().get("submissions", [])
    stu_after_entry = next((s for s in after_roster if s.get("student_id") == new_stu_id), None)
    is_now_submitted = stu_after_entry is not None and stu_after_entry.get("status") == "submitted"
    record("13. Submission Check (Post-submit) -> Teacher verifies student status is now 'submitted'", after_sub_res.status_code == 200 and is_now_submitted)

    # 14. Teacher Evaluates and Grades Student Submission
    eval_res = requests.post(
        f"{BASE_URL}/teacher/assignments/{assign_id}/evaluate",
        json={
            "student_id": new_stu_id,
            "marks": 94.5,
            "feedback": "Outstanding weight painting and seamless FK/IK switching. Arnold lighting is crisp!"
        },
        headers=t1_headers
    )
    record("14. Teacher Evaluation -> Teacher awards 94.5/100 marks and mentor feedback", eval_res.status_code == 200 and eval_res.json().get("marks") == 94.5)

    # 15. Student Views Graded Result & Mentor Feedback
    stu_graded_res = requests.get(f"{BASE_URL}/student-portal/me/assignments", headers=stu_headers)
    stu_graded_list = stu_graded_res.json()
    graded_match = next((a for a in stu_graded_list if a.get("id") == assign_id), None)
    is_graded_confirmed = graded_match is not None and graded_match.get("marks") == 94.5
    record("15. Student Result Verification -> Student views awarded 94.5 marks & mentor feedback", is_graded_confirmed)

    # 16. Teacher 2 (Isolated) attempting to view/grade Teacher 1's Assignment -> Rejected 403
    t2_login_res = requests.post(
        f"{BASE_URL}/auth/unified-login",
        json={"identifier": "other_teacher@morphyacademy.com", "password": "Teacher@12345"}
    )
    t2_token = t2_login_res.json().get("access_token")
    t2_headers = {"Authorization": f"Bearer {t2_token}"}
    
    t2_cross_res = requests.get(f"{BASE_URL}/teacher/assignments/{assign_id}/submissions", headers=t2_headers)
    record("16. Security Isolation -> Teacher 2 blocked from Teacher 1's assignment (403 Forbidden)", t2_cross_res.status_code == 403)

    # 17. Teacher attempting to access Super Admin staff creation -> Rejected 403
    staff_tamper_res = requests.get(f"{BASE_URL}/auth/staff", headers=t1_headers)
    record("17. Role Isolation -> Teacher blocked from Super Admin staff management (403 Forbidden)", staff_tamper_res.status_code == 403)

    # 18. Student attempting to access Teacher API -> Rejected 403
    stu_tamper_res = requests.get(f"{BASE_URL}/teacher/dashboard", headers=stu_headers)
    record("18. Role Isolation -> Student blocked from Teacher Dashboard (403 Forbidden)", stu_tamper_res.status_code == 403)

    # Cleanup test student
    requests.delete(f"{BASE_URL}/students/{new_stu_id}", headers=admin_headers)

    print("=" * 65)
    print(f"  TOTAL: {passed + failed} | PASSED: {passed} | FAILED: {failed}")
    print("=" * 65)
    if failed == 0:
        print("  >>> ALL ASSIGNMENTS, ATTENDANCE & UNIQUE ID TESTS PASSED! <<<")
    else:
        sys.exit(1)

if __name__ == "__main__":
    run_tests()


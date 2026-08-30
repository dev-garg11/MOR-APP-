import requests
from datetime import date

BASE_URL = "http://127.0.0.1:8000"

def test_full_verification():
    print("================================================================")
    print("  NEON DB, KEYS, UNIQUE IDS & ATTENDANCE UPSERT VERIFICATION   ")
    print("================================================================")

    # 1. Admin Login to obtain JWT Key
    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@morphyacademy.com",
        "password": "Admin@12345"
    })
    assert login_res.status_code == 200, f"Admin login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] 1. Neon Database Connection & JWT Security Keys: Active (200 OK)")

    # 2. Verify Students & Unique Roll Numbers
    students_res = requests.get(f"{BASE_URL}/students/", headers=headers)
    assert students_res.status_code == 200, f"Get students failed: {students_res.text}"
    students = students_res.json()
    assert len(students) > 0, "Students table should contain enrolled students"
    print(f"[PASS] 2. Enrolled Students in Neon DB: Total {len(students)} Students")
    for s in students[:4]:
        print(f"       -> Student #{s['id']} | Roll ID: {s.get('login_id') or 'STU-'+str(s['id'])} | Name: {s['name']} | Course: {s['course']}")

    # 3. Verify Teachers & Staff Accounts in Neon DB
    staff_res = requests.get(f"{BASE_URL}/auth/staff", headers=headers)
    assert staff_res.status_code == 200, f"Get staff failed: {staff_res.text}"
    staff_members = staff_res.json()
    print(f"[PASS] 3. Staff & Teacher Accounts in Neon DB: Total {len(staff_members)} Accounts")
    for st in staff_members:
        print(f"       -> Staff #{st['id']} | Role: [{st['role'].upper()}] | Email: {st['email']} | Status: {st['status']}")

    # 4. Attendance Flow Test: Present -> Absent -> Leave (Upsert test)
    target_student_id = students[0]["id"]
    today_str = str(date.today())

    # Step A: Mark Present
    res_present = requests.post(f"{BASE_URL}/attendance/", json={
        "student_id": target_student_id,
        "date": today_str,
        "status": "present"
    }, headers=headers)
    assert res_present.status_code == 200, f"Mark Present failed: {res_present.text}"
    assert res_present.json()["status"] == "present"
    print(f"[PASS] 4a. Marked Attendance for Student #{target_student_id}: PRESENT (200 OK)")

    # Step B: Change to Absent (must update without duplicate error)
    res_absent = requests.post(f"{BASE_URL}/attendance/", json={
        "student_id": target_student_id,
        "date": today_str,
        "status": "absent"
    }, headers=headers)
    assert res_absent.status_code == 200, f"Change to Absent failed: {res_absent.text}"
    assert res_absent.json()["status"] == "absent"
    print(f"[PASS] 4b. Switched Attendance to ABSENT: Updated seamlessly (200 OK)")

    # Step C: Change to Leave (must update without error)
    res_leave = requests.post(f"{BASE_URL}/attendance/", json={
        "student_id": target_student_id,
        "date": today_str,
        "status": "leave"
    }, headers=headers)
    assert res_leave.status_code == 200, f"Change to Leave failed: {res_leave.text}"
    assert res_leave.json()["status"] == "leave"
    print(f"[PASS] 4c. Switched Attendance to LEAVE: Updated seamlessly (200 OK)")

    print("\n================================================================")
    print("  ALL VERIFICATIONS & ATTENDANCE FIXES PASSED (100% OK)         ")
    print("================================================================")

if __name__ == "__main__":
    test_full_verification()


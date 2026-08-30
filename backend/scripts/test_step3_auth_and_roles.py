import sys
import requests

BASE_URL = "http://127.0.0.1:8000"

def run_all_12_step3_tests():
    print("================================================================")
    print("  STEP 3: AUTHENTICATION & ROLE-BASED ACCESS CONTROL TEST SUITE ")
    print("================================================================")

    # -------------------------------------------------------------
    # TEST 1: Valid Student Login -> Student Access
    # -------------------------------------------------------------
    res1 = requests.post(f"{BASE_URL}/auth/unified-login", json={
        "identifier": "MA-2026-001",
        "password": "Student@12345"
    })
    assert res1.status_code == 200, f"Test 1 Unified Student Login failed: {res1.text}"
    data1 = res1.json()
    assert data1["role"] == "STUDENT", "Role must be STUDENT"
    student_token = data1["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}
    
    # Check student portal access
    portal_res = requests.get(f"{BASE_URL}/student-portal/me", headers=student_headers)
    assert portal_res.status_code == 200, f"Test 1 Student Portal Access failed: {portal_res.text}"
    print("[PASS] Test 1: Valid Student Login -> Student Portal Access Granted")

    # -------------------------------------------------------------
    # TEST 2: Valid Teacher Login -> Teacher Access
    # -------------------------------------------------------------
    res2 = requests.post(f"{BASE_URL}/auth/unified-login", json={
        "identifier": "teacher@morphyacademy.com",
        "password": "Teacher@12345"
    })
    assert res2.status_code == 200, f"Test 2 Teacher Login failed: {res2.text}"
    data2 = res2.json()
    assert data2["role"] == "TEACHER", "Role must be TEACHER"
    teacher_token = data2["access_token"]
    teacher_headers = {"Authorization": f"Bearer {teacher_token}"}
    print("[PASS] Test 2: Valid Teacher Login -> Teacher Role Verified")

    # -------------------------------------------------------------
    # TEST 3: Valid HR Login -> HR Access
    # -------------------------------------------------------------
    res3 = requests.post(f"{BASE_URL}/auth/unified-login", json={
        "identifier": "hr@morphyacademy.com",
        "password": "Hr@12345"
    })
    assert res3.status_code == 200, f"Test 3 HR Login failed: {res3.text}"
    data3 = res3.json()
    assert data3["role"] == "HR", "Role must be HR"
    hr_token = data3["access_token"]
    hr_headers = {"Authorization": f"Bearer {hr_token}"}
    
    # Check HR stats access
    hr_stats = requests.get(f"{BASE_URL}/leads/stats/overview", headers=hr_headers)
    assert hr_stats.status_code == 200, f"Test 3 HR Stats Access failed: {hr_stats.text}"
    print("[PASS] Test 3: Valid HR Login -> HR Leads CRM Access Granted")

    # -------------------------------------------------------------
    # TEST 4: Valid Super Admin Login -> Admin Access
    # -------------------------------------------------------------
    res4 = requests.post(f"{BASE_URL}/auth/unified-login", json={
        "identifier": "admin@morphyacademy.com",
        "password": "Admin@12345"
    })
    assert res4.status_code == 200, f"Test 4 Admin Login failed: {res4.text}"
    data4 = res4.json()
    assert data4["role"] == "SUPER_ADMIN", "Role must be SUPER_ADMIN"
    admin_token = data4["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Check Super Admin staff management access
    staff_res = requests.get(f"{BASE_URL}/auth/staff", headers=admin_headers)
    assert staff_res.status_code == 200, f"Test 4 Admin Staff Access failed: {staff_res.text}"
    print("[PASS] Test 4: Valid Super Admin Login -> Full Admin Control Granted")

    # -------------------------------------------------------------
    # TEST 5: Wrong Password -> Login Rejected (401)
    # -------------------------------------------------------------
    res5 = requests.post(f"{BASE_URL}/auth/unified-login", json={
        "identifier": "admin@morphyacademy.com",
        "password": "WrongPassword999!"
    })
    assert res5.status_code == 401, f"Test 5 Expected 401, got {res5.status_code}"
    print("[PASS] Test 5: Wrong Password -> Login Rejected (401 Unauthorized)")

    # -------------------------------------------------------------
    # TEST 6: Inactive / Suspended Account -> Access Rejected (403)
    # -------------------------------------------------------------
    res6 = requests.post(f"{BASE_URL}/auth/unified-login", json={
        "identifier": "suspended@morphyacademy.com",
        "password": "Suspended@12345"
    })
    assert res6.status_code == 403, f"Test 6 Expected 403, got {res6.status_code}"
    print("[PASS] Test 6: Inactive/Suspended Account -> Login Rejected (403 Forbidden)")

    # -------------------------------------------------------------
    # TEST 7: Student Attempts HR API -> Backend Rejects (403)
    # -------------------------------------------------------------
    res7 = requests.get(f"{BASE_URL}/leads/stats/overview", headers=student_headers)
    assert res7.status_code == 403, f"Test 7 Expected 403, got {res7.status_code}"
    print("[PASS] Test 7: Student Attempt to HR API -> Backend Rejected (403 Forbidden)")

    # -------------------------------------------------------------
    # TEST 8: Student Attempts Admin API -> Backend Rejects (403)
    # -------------------------------------------------------------
    res8 = requests.get(f"{BASE_URL}/auth/staff", headers=student_headers)
    assert res8.status_code == 403, f"Test 8 Expected 403, got {res8.status_code}"
    print("[PASS] Test 8: Student Attempt to Admin API -> Backend Rejected (403 Forbidden)")

    # -------------------------------------------------------------
    # TEST 9: Teacher Attempts Super Admin API -> Backend Rejects (403)
    # -------------------------------------------------------------
    res9 = requests.get(f"{BASE_URL}/auth/staff", headers=teacher_headers)
    assert res9.status_code == 403, f"Test 9 Expected 403, got {res9.status_code}"
    print("[PASS] Test 9: Teacher Attempt to Super Admin API -> Backend Rejected (403 Forbidden)")

    # -------------------------------------------------------------
    # TEST 10: Logout / Missing Token -> Protected Access Removed (401)
    # -------------------------------------------------------------
    res10 = requests.get(f"{BASE_URL}/student-portal/me", headers={})
    assert res10.status_code in {401, 403}, f"Test 10 Expected 401/403, got {res10.status_code}"
    print("[PASS] Test 10: Unauthenticated Request -> Protected Access Removed (401/403)")

    # -------------------------------------------------------------
    # TEST 11: Expired / Invalid Malformed Token -> Rejected (401)
    # -------------------------------------------------------------
    fake_headers = {"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake.invalid"}
    res11 = requests.get(f"{BASE_URL}/leads/stats/overview", headers=fake_headers)
    assert res11.status_code == 401, f"Test 11 Expected 401, got {res11.status_code}"
    print("[PASS] Test 11: Malformed/Invalid Token -> Backend Rejected (401 Unauthorized)")

    # -------------------------------------------------------------
    # TEST 12: User Attempts to Manipulate Role -> Backend Rejects
    # -------------------------------------------------------------
    # Student sends a forged token pretending to be admin
    forged_token = student_token + "tampered"
    res12 = requests.get(f"{BASE_URL}/auth/staff", headers={"Authorization": f"Bearer {forged_token}"})
    assert res12.status_code == 401, f"Test 12 Expected 401, got {res12.status_code}"
    print("[PASS] Test 12: Role Manipulation Attempt -> Cryptographic Signature Rejected (401)")

    print("\n================================================================")
    print("  ALL 12 STEP 3 AUTH & ROLE-BASED ACCESS TESTS PASSED (100% OK) ")
    print("================================================================")

if __name__ == "__main__":
    run_all_12_step3_tests()


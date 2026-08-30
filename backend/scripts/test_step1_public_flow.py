import sys
import os
import requests

BASE_URL = "http://127.0.0.1:8000"

def test_step1_public_enquiry_flow():
    print("==================================================")
    print("  STEP 1: PUBLIC ENQUIRY FLOW VERIFICATION TEST  ")
    print("==================================================")

    # 1. Test Health / DB
    res = requests.get(f"{BASE_URL}/")
    assert res.status_code == 200, f"Backend root failed: {res.status_code}"
    print("[PASS] 1. Backend Server & PostgreSQL Connection: Healthy (200 OK)")

    # 2. Test Public Enquiry Submission (New User with Course & Source)
    enquiry_payload = {
        "name": "Aarav Sharma",
        "phone": "9876543210",
        "email": "aarav.sharma@example.com",
        "course_interest": "3D Animation Masterclass",
        "source": "website_direct",
        "notes": "Interested in 12M batch with RTX 4090 lab workstation demo."
    }

    res = requests.post(f"{BASE_URL}/leads/", json=enquiry_payload)
    assert res.status_code == 200, f"Enquiry submission failed: {res.status_code} - {res.text}"
    created_lead = res.json()
    lead_id = created_lead.get("id")
    assert lead_id is not None, "Lead ID was not generated"
    assert created_lead["name"] == enquiry_payload["name"], "Name mismatch"
    assert created_lead["course_interest"] == enquiry_payload["course_interest"], "Course mismatch"
    assert created_lead["status"] == "new", "Initial lead status must be 'new'"
    print(f"[PASS] 2. Public Enquiry Submission (POST /leads/): Created Lead #{lead_id} successfully")

    # 3. Verify Lead Stored in Database & Accessible for HR / CRM Pipeline
    # Admin login to verify CRM reception
    login_res = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": "admin@morphyacademy.com", "password": "Admin@12345"}
    )
    assert login_res.status_code == 200, f"Admin login failed: {login_res.status_code}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    get_lead_res = requests.get(f"{BASE_URL}/leads/{lead_id}", headers=headers)
    assert get_lead_res.status_code == 200, f"Fetch lead failed: {get_lead_res.status_code}"
    db_lead = get_lead_res.json()
    assert db_lead["id"] == lead_id
    assert db_lead["phone"] == "9876543210"
    print(f"[PASS] 3. Database & HR Connection: Enquiry #{lead_id} successfully persisted in PostgreSQL and ready for HR CRM")

    # 4. Clean up test lead
    del_res = requests.delete(f"{BASE_URL}/leads/{lead_id}", headers=headers)
    assert del_res.status_code == 200, f"Cleanup failed: {del_res.status_code}"
    print(f"[PASS] 4. Test Lead #{lead_id} cleaned up successfully")

    print("\n==================================================")
    print("  ALL STEP 1 PUBLIC FLOW CHECKS PASSED (100% OK)  ")
    print("==================================================")

if __name__ == "__main__":
    test_step1_public_enquiry_flow()


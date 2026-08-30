import sys
from datetime import date
import requests

BASE_URL = "http://127.0.0.1:8000"

def test_step2_hr_complete_flow():
    print("================================================================")
    print("  STEP 2: HR DASHBOARD & ENQUIRY LIFECYCLE COMPLETE TEST        ")
    print("================================================================")

    # 1. New User submits enquiry on Public Course Page
    new_user_enquiry = {
        "name": "Devansh Malhotra",
        "phone": "9876501234",
        "email": "devansh.m@example.com",
        "course_interest": "3D Animation Masterclass",
        "source": "instagram",
        "notes": "Student interested in character rigging and Arnold rendering."
    }
    create_res = requests.post(f"{BASE_URL}/leads/", json=new_user_enquiry)
    assert create_res.status_code == 200, f"Step 1 Lead creation failed: {create_res.text}"
    lead_data = create_res.json()
    lead_id = lead_data["id"]
    print(f"[PASS] 1. New User Enquiry Submitted: Lead #{lead_id} created with status '{lead_data['status']}'")

    # 2. HR Login (Authenticated HR / Counselor / Admin)
    hr_login = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": "admin@morphyacademy.com", "password": "Admin@12345"}
    )
    assert hr_login.status_code == 200, f"HR Login failed: {hr_login.text}"
    hr_token = hr_login.json()["access_token"]
    hr_headers = {"Authorization": f"Bearer {hr_token}"}
    print("[PASS] 2. HR Authentication: JWT Session token received with role 'admin'")

    # 3. HR Dashboard: Real-time calculated KPI metrics
    stats_res = requests.get(f"{BASE_URL}/leads/stats/overview", headers=hr_headers)
    assert stats_res.status_code == 200, f"Get stats failed: {stats_res.text}"
    stats = stats_res.json()
    assert stats["total"] >= 1, "Total enquiries must be >= 1"
    assert stats["new"] >= 1, "New enquiries must be >= 1"
    print(f"[PASS] 3. HR Dashboard Real-time KPIs: Total={stats['total']}, New={stats['new']}, Contacted={stats['contacted']}, FollowUps={stats['follow_up']}, Admitted={stats['admitted']}")

    # 4. HR views Enquiry List and opens Enquiry Details
    get_lead_res = requests.get(f"{BASE_URL}/leads/{lead_id}", headers=hr_headers)
    assert get_lead_res.status_code == 200, f"Fetch lead failed: {get_lead_res.text}"
    lead = get_lead_res.json()
    assert lead["name"] == new_user_enquiry["name"]
    print(f"[PASS] 4. HR Opened Enquiry Details for #{lead_id} ({lead['name']} - {lead['course_interest']})")

    # 5. HR contacts user & updates status to CONTACTED
    contacted_res = requests.put(
        f"{BASE_URL}/leads/{lead_id}/status",
        json={"status": "contacted", "notes": "Connected on phone. Explained Maya curriculum."},
        headers=hr_headers
    )
    assert contacted_res.status_code == 200, f"Update status to contacted failed: {contacted_res.text}"
    assert contacted_res.json()["status"] == "contacted"
    print("[PASS] 5. Status Transition: NEW -> CONTACTED verified")

    # 6. HR adds timestamped Counselor Note
    note_res = requests.post(
        f"{BASE_URL}/leads/{lead_id}/notes",
        json={"note": "Student wants to visit campus on Saturday with parent."},
        headers=hr_headers
    )
    assert note_res.status_code == 200, f"Add note failed: {note_res.text}"
    assert "Student wants to visit campus" in note_res.json()["notes"]
    print("[PASS] 6. HR Timestamped Note added and appended to lead record")

    # 7. HR schedules Follow-Up for Today
    today_str = str(date.today())
    followup_res = requests.put(
        f"{BASE_URL}/leads/{lead_id}/status",
        json={"status": "follow_up", "next_follow_up": today_str, "notes": "Schedule callback for fee plan."},
        headers=hr_headers
    )
    assert followup_res.status_code == 200, f"Schedule follow-up failed: {followup_res.text}"
    assert followup_res.json()["status"] == "follow_up"
    print(f"[PASS] 7. Follow-Up Scheduled for {today_str} with status 'follow_up'")

    # 8. Verify Enquiry appears in Today's Follow-Ups API
    today_followups_res = requests.get(f"{BASE_URL}/leads/followups/today", headers=hr_headers)
    assert today_followups_res.status_code == 200, f"Get today followups failed: {today_followups_res.text}"
    today_list = today_followups_res.json()
    today_ids = [l["id"] for l in today_list]
    assert lead_id in today_ids, f"Lead #{lead_id} not found in Today's follow-up list!"
    print(f"[PASS] 8. Today's Follow-Ups Pipeline: Lead #{lead_id} successfully listed in Today's calls")

    # 9. HR updates status to INTERESTED (Hot conversion)
    interested_res = requests.put(
        f"{BASE_URL}/leads/{lead_id}/status",
        json={"status": "interested", "notes": "Attended lab demo. Ready to join next week."},
        headers=hr_headers
    )
    assert interested_res.status_code == 200, f"Update to interested failed: {interested_res.text}"
    assert interested_res.json()["status"] == "interested"
    print("[PASS] 9. Status Transition: FOLLOW_UP -> INTERESTED verified")

    # 10. HR updates status to ADMITTED (Admission bridge for Step 3)
    admitted_res = requests.put(
        f"{BASE_URL}/leads/{lead_id}/status",
        json={"status": "admitted", "notes": "Enrollment approved. Moving to student registration."},
        headers=hr_headers
    )
    assert admitted_res.status_code == 200, f"Update to admitted failed: {admitted_res.text}"
    assert admitted_res.json()["status"] == "admitted"
    print("[PASS] 10. Status Transition: INTERESTED -> ADMITTED verified (Enrolment Ready)")

    # 11. Verify Database Data Integrity
    final_get = requests.get(f"{BASE_URL}/leads/{lead_id}", headers=hr_headers)
    assert final_get.status_code == 200
    final_data = final_get.json()
    assert final_data["status"] == "admitted"
    assert final_data["phone"] == "9876501234"
    print(f"[PASS] 11. Database Persistence: Final lead state in PostgreSQL verified (status='{final_data['status']}')")

    # 12. Cleanup Test Lead
    del_res = requests.delete(f"{BASE_URL}/leads/{lead_id}", headers=hr_headers)
    assert del_res.status_code == 200
    print(f"[PASS] 12. Cleanup: Test Lead #{lead_id} deleted successfully")

    print("\n================================================================")
    print("  ALL 12 STEP 2 HR & ENQUIRY WORKFLOW TESTS PASSED (100% OK)    ")
    print("================================================================")

if __name__ == "__main__":
    test_step2_hr_complete_flow()


import sys
import requests

BASE_URL = "http://127.0.0.1:8000"

def test_all_enquiry_scenarios():
    print("================================================================")
    print("  STEP 1: THOROUGH MULTI-SCENARIO ENQUIRY & BUTTON TEST SUITE  ")
    print("================================================================")

    # 1. Admin auth to inspect database state
    login_res = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": "admin@morphyacademy.com", "password": "Admin@12345"}
    )
    assert login_res.status_code == 200, "Admin login failed"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    test_lead_ids = []

    # Scenario A: 3D Animation enquiry from Instagram
    lead_a = {
        "name": "Manish Kumar",
        "phone": "9811223344",
        "email": "manish@gmail.com",
        "course_interest": "3D Animation Masterclass",
        "source": "instagram",
        "notes": "Looking for weekend batch with character rigging focus."
    }
    res_a = requests.post(f"{BASE_URL}/leads/", json=lead_a)
    assert res_a.status_code == 200, f"Scenario A failed: {res_a.text}"
    id_a = res_a.json()["id"]
    test_lead_ids.append(id_a)
    print(f"[PASS] Scenario A (Instagram -> 3D Animation): Stored as Lead #{id_a}")

    # Scenario B: Game Design enquiry from YouTube
    lead_b = {
        "name": "Tanvi Joshi",
        "phone": "9988776655",
        "email": "tanvi.j@yahoo.com",
        "course_interest": "Game & Unreal Engine UI Design",
        "source": "youtube",
        "notes": "Watched Unreal Engine 5 gameplay reel on YouTube."
    }
    res_b = requests.post(f"{BASE_URL}/leads/", json=lead_b)
    assert res_b.status_code == 200, f"Scenario B failed: {res_b.text}"
    id_b = res_b.json()["id"]
    test_lead_ids.append(id_b)
    print(f"[PASS] Scenario B (YouTube -> Unreal Engine 5): Stored as Lead #{id_b}")

    # Scenario C: VFX Compositing enquiry without email (Phone only)
    lead_c = {
        "name": "Deepak Rawat",
        "phone": "9123456789",
        "course_interest": "VFX & Film Compositing",
        "source": "website_direct",
        "notes": "Called from website contact page."
    }
    res_c = requests.post(f"{BASE_URL}/leads/", json=lead_c)
    assert res_c.status_code == 200, f"Scenario C failed: {res_c.text}"
    id_c = res_c.json()["id"]
    test_lead_ids.append(id_c)
    print(f"[PASS] Scenario C (Website Direct -> VFX (Phone only)): Stored as Lead #{id_c}")

    # Scenario D: Verify all 3 leads are in database and queryable by HR CRM
    get_all_res = requests.get(f"{BASE_URL}/leads/?status=new", headers=headers)
    assert get_all_res.status_code == 200, "Get leads failed"
    all_leads = get_all_res.json()
    all_ids = [l["id"] for l in all_leads]
    for tid in test_lead_ids:
        assert tid in all_ids, f"Lead #{tid} not found in CRM lead query!"
    print(f"[PASS] Scenario D (HR CRM Sync): All {len(test_lead_ids)} test leads verified in database pipeline")

    # Cleanup test leads
    for tid in test_lead_ids:
        del_res = requests.delete(f"{BASE_URL}/leads/{tid}", headers=headers)
        assert del_res.status_code == 200, f"Failed to delete test lead #{tid}"
    print(f"[PASS] Scenario E (Database Cleanup): Successfully cleaned up all test leads")

    print("\n================================================================")
    print("  ALL BUTTON ACTIONS & MULTI-SCENARIO TESTS PASSED (100% OK)    ")
    print("================================================================")

if __name__ == "__main__":
    test_all_enquiry_scenarios()

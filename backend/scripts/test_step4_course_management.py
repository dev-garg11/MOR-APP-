import sys
import os
import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models.courses_models import Course

BASE_URL = "http://127.0.0.1:8000"

def cleanup_previous_test_data():
    db = SessionLocal()
    test_courses = db.query(Course).filter(
        Course.name.in_(["Concept Art & Digital Painting", "Student Created Course", "Hacked Course"])
    ).all()
    for c in test_courses:
        db.delete(c)
    db.commit()
    db.close()

def run_step4_tests():
    print("==================================================================")
    print("  STEP 4: COURSE MANAGEMENT & PUBLIC CATALOG TEST SUITE (20 TESTS)")
    print("==================================================================")
    
    # 0. Clean previous test runs for idempotency
    cleanup_previous_test_data()

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

    # --- 1. Public: Load published courses ---
    res = requests.get(f"{BASE_URL}/courses/public")
    assert_test(
        "Public: GET /courses/public returns 200 OK with published courses",
        res.status_code == 200 and isinstance(res.json(), list) and len(res.json()) > 0,
        f"Status: {res.status_code}, Body: {res.text[:100]}"
    )
    published_courses = res.json()

    # --- 2. Public: Search by keyword ---
    res = requests.get(f"{BASE_URL}/courses/public?search=Animation")
    assert_test(
        "Public: Search /courses/public?search=Animation filters correctly",
        res.status_code == 200 and len(res.json()) >= 1 and any("animation" in c["title"].lower() for c in res.json()),
        f"Count: {len(res.json())}"
    )

    # --- 3. Public: Filter by category ---
    res = requests.get(f"{BASE_URL}/courses/public?category=VFX")
    assert_test(
        "Public: Category filter /courses/public?category=VFX returns only VFX courses",
        res.status_code == 200 and len(res.json()) >= 1 and all(c["category"].lower() == "vfx" for c in res.json()),
        f"Count: {len(res.json())}"
    )

    # --- 4. Public: Load full syllabus details ---
    first_slug = published_courses[0]["slug"]
    res = requests.get(f"{BASE_URL}/courses/public/{first_slug}")
    assert_test(
        f"Public: GET /courses/public/{first_slug} returns modules and lessons",
        res.status_code == 200 and "modules" in res.json() and len(res.json()["modules"]) > 0,
        f"Status: {res.status_code}"
    )

    # --- 5. Admin Authentication ---
    login_res = requests.post(
        f"{BASE_URL}/auth/unified-login",
        json={"identifier": "admin@morphyacademy.com", "password": "Admin@12345"}
    )
    admin_token = login_res.json().get("access_token")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    assert_test(
        "Admin: Login as Super Admin returns JWT token",
        login_res.status_code == 200 and bool(admin_token),
        f"Status: {login_res.status_code}, Body: {login_res.text}"
    )

    # --- 6. Admin: Create a new Course (defaults to Draft) ---
    course_payload = {
        "name": "Concept Art & Digital Painting",
        "category": "Concept Art",
        "level": "All Levels",
        "duration": "6 Months",
        "fees": 45000,
        "emi": "₹3,750/mo",
        "thumbnail": "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800",
        "tag": "Creative Art Track",
        "short_desc": "Digital painting, environment concepts, and character silhouettes in Photoshop.",
        "full_desc": "Comprehensive training in digital painting fundamentals, composition, light & shadow, color theory, costume design, and production concept art.",
        "tools": ["Photoshop", "Procreate", "Blender"],
        "outcomes": ["Design production-ready character concept sheets", "Paint photorealistic fantasy environments"],
        "requirements": ["Drawing tablet or iPad recommended"],
        "career_roles": [{"role": "Concept Artist", "avgSalary": "₹4.0L - ₹8.0L / yr"}],
        "status": "draft"
    }
    create_res = requests.post(f"{BASE_URL}/courses/", json=course_payload, headers=admin_headers)
    assert_test(
        "Admin: POST /courses/ creates a new draft course",
        create_res.status_code == 201 and create_res.json()["status"] == "draft",
        f"Status: {create_res.status_code}, Body: {create_res.text[:100]}"
    )
    new_course = create_res.json()
    new_course_id = new_course["id"]
    new_course_slug = new_course["slug"]

    # --- 7. Public: Verify Draft course is NOT in public listing ---
    pub_res = requests.get(f"{BASE_URL}/courses/public")
    assert_test(
        "Public: Newly created draft course is hidden from public catalog",
        pub_res.status_code == 200 and not any(c["id"] == new_course_id for c in pub_res.json()),
        "Draft course should not be in public list"
    )

    # --- 8. Admin: Add Module 1 to the Course ---
    mod1_res = requests.post(
        f"{BASE_URL}/courses/{new_course_id}/modules",
        json={"title": "Digital Painting Fundamentals", "order_index": 1, "description": "Brush dynamics, layer modes and values."},
        headers=admin_headers
    )
    assert_test(
        "Admin: POST /courses/{id}/modules creates Module 1",
        mod1_res.status_code == 201 and mod1_res.json()["title"] == "Digital Painting Fundamentals",
        f"Status: {mod1_res.status_code}"
    )
    mod1_id = mod1_res.json()["id"]

    # --- 9. Admin: Add Lessons to Module 1 ---
    les1_res = requests.post(
        f"{BASE_URL}/courses/modules/{mod1_id}/lessons",
        json={"title": "Photoshop Custom Brushes & Smudge Tools", "order_index": 1, "duration": "45 Mins"},
        headers=admin_headers
    )
    les2_res = requests.post(
        f"{BASE_URL}/courses/modules/{mod1_id}/lessons",
        json={"title": "Tonal Values & 3-Value Studies", "order_index": 2, "duration": "50 Mins"},
        headers=admin_headers
    )
    assert_test(
        "Admin: POST /courses/modules/{mod_id}/lessons creates lessons under module",
        les1_res.status_code == 201 and les2_res.status_code == 201,
        f"Status: {les1_res.status_code}, {les2_res.status_code}"
    )
    les1_id = les1_res.json()["id"]

    # --- 10. Admin: Add Module 2 and Lesson ---
    mod2_res = requests.post(
        f"{BASE_URL}/courses/{new_course_id}/modules",
        json={"title": "Environment Concept Art", "order_index": 2, "description": "Atmospheric perspective and focal points."},
        headers=admin_headers
    )
    les3_res = requests.post(
        f"{BASE_URL}/courses/modules/{mod2_res.json()['id']}/lessons",
        json={"title": "Painting Dramatic Cinematic Sky & Clouds", "order_index": 1, "duration": "55 Mins"},
        headers=admin_headers
    )
    assert_test(
        "Admin: Multi-module hierarchy created with nested lessons",
        mod2_res.status_code == 201 and les3_res.status_code == 201,
        f"Mod2: {mod2_res.status_code}"
    )

    # --- 11. Admin: Update Course Metadata ---
    update_res = requests.put(
        f"{BASE_URL}/courses/{new_course_id}",
        json={"fees": 48000, "duration": "7 Months"},
        headers=admin_headers
    )
    assert_test(
        "Admin: PUT /courses/{id} updates course fees and duration",
        update_res.status_code == 200 and float(update_res.json()["fees"]) == 48000.0 and update_res.json()["duration"] == "7 Months",
        f"Fees: {update_res.json().get('fees')}"
    )

    # --- 12. Admin: Publish Course ---
    status_res = requests.put(
        f"{BASE_URL}/courses/{new_course_id}/status",
        json={"status": "published"},
        headers=admin_headers
    )
    assert_test(
        "Admin: PUT /courses/{id}/status changes status to 'published'",
        status_res.status_code == 200 and status_res.json()["status"] == "published",
        f"Status: {status_res.status_code}"
    )

    # --- 13. Public: Verify Course is NOW visible publicly ---
    pub_res = requests.get(f"{BASE_URL}/courses/public")
    pub_match = next((c for c in pub_res.json() if c["id"] == new_course_id), None)
    assert_test(
        "Public: Published course now appears live in public catalog with formatted price",
        pub_match is not None and pub_match["title"] == "Concept Art & Digital Painting" and pub_match["price"] == "₹48,000",
        f"Found: {bool(pub_match)}"
    )

    # --- 14. Public: Verify syllabus includes newly added modules & lessons ---
    detail_res = requests.get(f"{BASE_URL}/courses/public/{new_course_slug}")
    assert_test(
        "Public: Published course syllabus returns both modules and 3 lessons",
        detail_res.status_code == 200 and len(detail_res.json()["modules"]) == 2 and sum(len(m["lessons"]) for m in detail_res.json()["modules"]) == 3,
        f"Modules: {len(detail_res.json().get('modules', []))}"
    )

    # --- 15. Admin: Unpublish Course ---
    unpub_res = requests.put(
        f"{BASE_URL}/courses/{new_course_id}/status",
        json={"status": "unpublished"},
        headers=admin_headers
    )
    pub_res_after = requests.get(f"{BASE_URL}/courses/public")
    assert_test(
        "Admin: Unpublishing course immediately removes it from public catalog",
        unpub_res.status_code == 200 and not any(c["id"] == new_course_id for c in pub_res_after.json()),
        f"Unpub: {unpub_res.status_code}"
    )

    # --- 16. Admin: Edit Module Title ---
    edit_mod_res = requests.put(
        f"{BASE_URL}/courses/modules/{mod1_id}",
        json={"title": "Mastering Digital Painting Fundamentals"},
        headers=admin_headers
    )
    assert_test(
        "Admin: PUT /courses/modules/{id} edits module title",
        edit_mod_res.status_code == 200 and edit_mod_res.json()["title"] == "Mastering Digital Painting Fundamentals",
        f"Title: {edit_mod_res.json().get('title')}"
    )

    # --- 17. Admin: Delete Lesson ---
    del_les_res = requests.delete(f"{BASE_URL}/courses/lessons/{les1_id}", headers=admin_headers)
    assert_test(
        "Admin: DELETE /courses/lessons/{id} deletes lesson cleanly",
        del_les_res.status_code == 200,
        f"Status: {del_les_res.status_code}"
    )

    # --- 18. Security: Unauthenticated request rejected ---
    unauth_res = requests.post(f"{BASE_URL}/courses/", json={"name": "Hacked Course", "category": "Art"})
    assert_test(
        "Security: Unauthenticated POST /courses/ returns 401 Unauthorized",
        unauth_res.status_code == 401,
        f"Status: {unauth_res.status_code}"
    )

    # --- 19. Security: Student role cannot modify courses ---
    student_login = requests.post(
        f"{BASE_URL}/auth/unified-login",
        json={"identifier": "MA-2026-001", "password": "Student@12345"}
    )
    student_token = student_login.json().get("access_token")
    student_headers = {"Authorization": f"Bearer {student_token}"}
    forbidden_res = requests.post(
        f"{BASE_URL}/courses/",
        json={"name": "Student Created Course", "category": "General"},
        headers=student_headers
    )
    assert_test(
        "Security: Student role attempting to create course returns 403 Forbidden",
        forbidden_res.status_code == 403,
        f"Status: {forbidden_res.status_code}"
    )

    # --- 20. Course -> Enquiry Integration ---
    # Re-publish course for enquiry test
    requests.put(f"{BASE_URL}/courses/{new_course_id}/status", json={"status": "published"}, headers=admin_headers)
    enquiry_res = requests.post(
        f"{BASE_URL}/leads/",
        json={
            "name": "Arjun Singhania",
            "phone": "9811002233",
            "email": "arjun.singhania@example.com",
            "course_interest": "Concept Art & Digital Painting",
            "source": "website"
        }
    )
    assert_test(
        "Enquiry Integration: Public user submitting enquiry for course links to Lead CRM",
        enquiry_res.status_code == 200 and enquiry_res.json()["course_interest"] == "Concept Art & Digital Painting",
        f"Lead ID: {enquiry_res.json().get('id')}"
    )

    print("==================================================================")
    print(f"  TOTAL: {passed + failed} | PASSED: {passed} | FAILED: {failed}")
    print("==================================================================")
    
    if failed == 0:
        print("  >>> ALL 20 STEP 4 TESTS PASSED WITH 100% SUCCESS! <<<")
    else:
        sys.exit(1)

if __name__ == "__main__":
    run_step4_tests()


# API Testing Guide

## Automatic full test

This test creates temporary staff, lead, student, attendance, and fee-payment records, then deletes them automatically.

```powershell
cd "E:\morpha App\backend"
.\venv\Scripts\Activate.ps1
python scripts\run_api_smoke_test.py
```

Successful result:

```text
API_SMOKE_TEST_OK: ... checks passed
```

The script covers health/database, admin-created staff login, leads, students, attendance create/update/delete and duplicate prevention, fees/discount/pending status/payment update/delete, dashboard, student login/portal, student-access denial, and chatbot route behavior.

## Manual admin test in Swagger

1. Start the server:

   ```powershell
   python -m uvicorn main:app --reload
   ```

2. Open `http://127.0.0.1:8000/docs`.
3. Log in with `POST /auth/login`, copy `access_token`, and use **Authorize**.
4. Test admin actions: `/leads/`, `/students/`, `/attendance/`, `/fees/`, and `/dashboard/overview`.
5. Create student credentials from `POST /students/{student_id}/credentials`.
6. Log in with `POST /student-auth/login`; replace the Swagger authorization token with the student token.
7. Student token must work only for `/student-portal/me`, `/student-portal/me/fees`, and `/student-portal/me/attendance`. It must return `403` for `/fees/pending`, `/attendance/`, and `/students/`.

## Chatbot note

The automatic test verifies the API route without consuming Groq quota. For live chatbot testing, call `POST /chat/` from Swagger after setting a valid `GROQ_API_KEY` in `.env`. A missing/invalid key returns a safe HTTP `503` response.

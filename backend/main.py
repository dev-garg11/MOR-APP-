from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from routes.lead_routes import router as leads_router
from routes.student_routes import router as students_router
from routes.attendance_routes import router as attendance_router
from routes.chat_routes import router as chat_router
from routes.admin_routes import router as admin_router
from routes.fee_routes import router as fees_router
from routes.dashboard_routes import router as dashboard_router
from routes.student_portal_routes import auth_router as student_auth_router, portal_router as student_portal_router
from routes.payment_routes import router as payment_routers
from routes.course_routes import router as courses_router
from routes.teacher_routes import router as teacher_router
import os

app = FastAPI(title="Morph Academy Management System")

# Enable high-speed GZip compression for all responses > 500 bytes
app.add_middleware(GZipMiddleware, minimum_size=500)

# Comma-separated list of allowed origins for production, e.g. in .env:
# CORS_ALLOWED_ORIGINS=https://your-deployed-frontend.com,https://admin.morphacademy.com
_extra_origins = [o.strip() for o in os.getenv("CORS_ALLOWED_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:8081",   # Expo dev server (web)
        "http://localhost:19006",  # Expo web (older default port)
        *_extra_origins,
    ],
    # Also allow any LAN IP on these dev ports, so testing Expo web from
    # another device on the same Wi-Fi (e.g. http://192.168.1.14:8081) works
    # without editing this file every time.
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|192\.168\.\d+\.\d+):(8081|19006|5173)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(leads_router)
app.include_router(students_router)
app.include_router(attendance_router)
app.include_router(chat_router)
app.include_router(admin_router)
app.include_router(fees_router)
app.include_router(dashboard_router)
app.include_router(student_auth_router)
app.include_router(student_portal_router)
app.include_router(payment_routers)
app.include_router(courses_router)
app.include_router(teacher_router)
@app.get("/")
def home():
    return {"message": "Morph Academy backend is running!"}

@app.get("/test-db")
def test_database(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT COUNT(*) FROM leads"))
    count = result.scalar()
    return {
        "status": "Database connected successfully!",
        "total_leads": count
    }
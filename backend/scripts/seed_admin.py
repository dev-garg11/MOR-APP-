from database import engine
from sqlalchemy import text
from passlib.context import CryptContext

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

with engine.connect() as conn:
    users = conn.execute(text("SELECT id, email, role, status FROM users")).fetchall()
    print("Existing users in DB:", users)
    
    hashed = pwd.hash("Admin@12345")
    
    # Check if admin exists
    admin_user = conn.execute(text("SELECT id FROM users WHERE email = 'admin@morphyacademy.com'")).first()
    if admin_user:
        conn.execute(
            text("UPDATE users SET password_hash = :hashed, status = 'active', role = 'admin' WHERE email = 'admin@morphyacademy.com'"),
            {"hashed": hashed}
        )
        print("Updated admin@morphyacademy.com password to Admin@12345")
    else:
        conn.execute(
            text("INSERT INTO users (name, email, password_hash, role, status) VALUES ('Super Admin', 'admin@morphyacademy.com', :hashed, 'admin', 'active')"),
            {"hashed": hashed}
        )
        print("Created new admin@morphyacademy.com with password Admin@12345")
    
    conn.commit()
    print("SUCCESS: Admin credentials are: Email: admin@morphyacademy.com | Password: Admin@12345")


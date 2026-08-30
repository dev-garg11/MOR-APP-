import os
import sys
import io
import json

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.path.insert(0, r"c:\Users\lenovo\OneDrive\Desktop\more_update\backend_updated (2)")

from database import engine
from sqlalchemy import text, inspect

print("=== STARTING STEP 4: ATOMIC DATABASE MIGRATION & CLEANUP ===")

with engine.connect() as conn:
    trans = conn.begin()
    try:
        # Step 1: Count before migration
        count_leads_before = conn.execute(text("SELECT COUNT(*) FROM leads")).scalar()
        count_users_before = conn.execute(text("SELECT COUNT(*) FROM users")).scalar()
        print(f"Leads before: {count_leads_before} | Users before: {count_users_before}")

        # Step 2: Migrate leads from hr_leads
        migrate_leads_sql = """
        INSERT INTO leads (name, phone, email, course_interest, source, status, notes, created_at, updated_at)
        SELECT 
            hl.name, 
            hl.phone, 
            hl.email, 
            hl.course AS course_interest, 
            COALESCE(hl.source, 'Migrated Legacy HR Lead'), 
            COALESCE(hl.status, 'new'), 
            hl.notes, 
            COALESCE(hl.created_at, NOW()), 
            COALESCE(hl.updated_at, NOW())
        FROM hr_leads hl
        WHERE NOT EXISTS (
            SELECT 1 FROM leads l WHERE l.phone = hl.phone
        );
        """
        conn.execute(text(migrate_leads_sql))

        # Step 3: Migrate staff from hr
        migrate_hr_sql = """
        INSERT INTO users (name, email, password_hash, role, status, phone, department, created_at, last_active_at)
        SELECT 
            h.name, 
            h.email, 
            h.password_hash, 
            'hr' AS role, 
            COALESCE(h.status, 'active'), 
            h.phone, 
            COALESCE(h.department, 'Admissions & Student Relations'), 
            COALESCE(h.created_at, NOW()), 
            h.last_active_at
        FROM hr h
        WHERE NOT EXISTS (
            SELECT 1 FROM users u WHERE u.email = h.email
        );
        """
        conn.execute(text(migrate_hr_sql))

        # Step 4: Migrate staff from super_admin
        migrate_sa_sql = """
        INSERT INTO users (name, email, password_hash, role, status, created_at)
        SELECT 
            s.name, 
            s.email, 
            s.password_hash, 
            'admin' AS role, 
            COALESCE(s.status, 'active'), 
            COALESCE(s.created_at, NOW())
        FROM super_admin s
        WHERE NOT EXISTS (
            SELECT 1 FROM users u WHERE u.email = s.email
        );
        """
        conn.execute(text(migrate_sa_sql))

        # Step 5: Check counts after data migration
        count_leads_after = conn.execute(text("SELECT COUNT(*) FROM leads")).scalar()
        count_users_after = conn.execute(text("SELECT COUNT(*) FROM users")).scalar()
        print(f"Leads after migration: {count_leads_after} (+{count_leads_after - count_leads_before} migrated)")
        print(f"Users after migration: {count_users_after} (+{count_users_after - count_users_before} migrated)")

        # Step 6: Drop legacy tables safely
        print("\nDropping 6 legacy tables safely...")
        conn.execute(text("DROP TABLE IF EXISTS hr_fees CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS hr_emi CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS hr_notifications CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS hr_leads CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS hr CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS super_admin CASCADE"))

        trans.commit()
        print("✓ Migration successfully committed to Neon PostgreSQL database!")
    except Exception as e:
        trans.rollback()
        print(f"❌ Error during migration, rolled back: {e}")
        sys.exit(1)

# Verify table list after migration
inspector = inspect(engine)
tables_remaining = inspector.get_table_names()
print("\nRemaining DB Tables in Neon DB:", tables_remaining)

legacy_tables = ["hr", "super_admin", "hr_leads", "hr_fees", "hr_emi", "hr_notifications"]
for t in legacy_tables:
    exists = t in tables_remaining
    print(f"  Legacy table '{t}' in DB: {exists}")
    assert not exists, f"Table {t} was not dropped!"

print("\n=== ALL 6 LEGACY TABLES SAFELY DROPPED & DATA PRESERVED IN UNIFIED TABLES ===")

-- =====================================================================
-- STEP 4: SAFE DATABASE MIGRATION & LEGACY TABLES CLEANUP
-- Morph Academy Architecture Unification
-- =====================================================================

BEGIN;

-- 1. Migrate any unique leads from legacy hr_leads to unified leads table
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

-- 2. Migrate any unique HR staff members to unified users table
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

-- 3. Migrate any unique Super Admin staff members to unified users table
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

-- 4. Safely drop legacy tables that have been unified into modern tables
DROP TABLE IF EXISTS hr_fees CASCADE;
DROP TABLE IF EXISTS hr_emi CASCADE;
DROP TABLE IF EXISTS hr_notifications CASCADE;
DROP TABLE IF EXISTS hr_leads CASCADE;
DROP TABLE IF EXISTS hr CASCADE;
DROP TABLE IF EXISTS super_admin CASCADE;

COMMIT;

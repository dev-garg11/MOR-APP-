-- ============================================
-- Morph Academy Management System
-- Database Schema (PostgreSQL / Neon)
-- ============================================

-- 1. LEADS TABLE
-- Har enquiry yahan aati hai (chatbot se ya manual entry)
CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(100),
    course_interest VARCHAR(100),          -- kaunse course mein interested hai
    source VARCHAR(50) DEFAULT 'manual',   -- 'chatbot', 'manual', 'walk-in', 'call'
    status VARCHAR(30) DEFAULT 'new',      -- 'new', 'contacted', 'interested', 'enrolled', 'not_interested'
    assigned_to VARCHAR(100),              -- kaunsa counselor handle kar raha hai
    notes TEXT,                            -- follow-up notes
    next_follow_up DATE,                   -- kab follow-up karna hai
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. STUDENTS TABLE
-- Jab lead enroll ho jaaye, tab student record banta hai
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    login_id VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255),
    lead_id INTEGER REFERENCES leads(id),  -- kis lead se convert hua (optional link)
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(100),
    course VARCHAR(100) NOT NULL,
    batch VARCHAR(50),                     -- batch name/timing
    mode VARCHAR(20) DEFAULT 'offline',    -- 'online', 'offline'
    enrollment_date DATE DEFAULT CURRENT_DATE,
    fees_total NUMERIC(10,2),
    fees_paid NUMERIC(10,2) DEFAULT 0,
    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    fee_due_date DATE,
    status VARCHAR(30) DEFAULT 'active',   -- 'active', 'completed', 'dropped'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. ATTENDANCE TABLE
-- Daily attendance, student se linked
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(10) NOT NULL,           -- 'present', 'absent', 'leave'
    marked_by VARCHAR(100),                -- kis admin/trainer ne mark kiya
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, date)               -- ek din mein ek student ki ek hi entry
);

-- 4. USERS TABLE (Admin/Staff login ke liye)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) DEFAULT 'counselor',  -- 'admin', 'counselor', 'trainer'
    status VARCHAR(20) NOT NULL DEFAULT 'active',  -- 'pending', 'active', 'inactive'
    last_active_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    actor_admin_id INTEGER REFERENCES users(id),
    actor_name VARCHAR(100) NOT NULL,
    actor_role VARCHAR(30),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(30) NOT NULL,
    entity_id INTEGER,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Indexes (fast search ke liye)
-- ============================================
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_admin_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_students_course ON students(course);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_student ON attendance(student_id);

-- 5. FEE PAYMENTS TABLE
-- Har payment ka amount aur date alag record hota hai.
CREATE TABLE fee_payments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_mode VARCHAR(30) NOT NULL DEFAULT 'cash',
    notes TEXT,
    received_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fee_payments_student ON fee_payments(student_id);
CREATE INDEX idx_fee_payments_date ON fee_payments(payment_date);

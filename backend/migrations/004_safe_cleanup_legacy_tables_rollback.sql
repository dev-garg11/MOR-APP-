-- =====================================================================
-- STEP 4: ROLLBACK SCRIPT FOR LEGACY TABLES CLEANUP
-- Recreates the 6 legacy tables if rollback is ever required
-- =====================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS hr (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) DEFAULT 'hr',
    is_active BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'active',
    approval_status VARCHAR(20) DEFAULT 'active',
    current_status VARCHAR(30) DEFAULT 'online',
    current_classroom VARCHAR(100),
    last_active_at TIMESTAMP,
    phone VARCHAR(50),
    department VARCHAR(100) DEFAULT 'Admissions & Student Relations',
    unique_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS super_admin (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) DEFAULT 'super_admin',
    is_active BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'active',
    unique_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hr_leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(100),
    course VARCHAR(100),
    source VARCHAR(50),
    status VARCHAR(30) DEFAULT 'new',
    notes TEXT,
    unique_id VARCHAR(50),
    followup_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hr_fees (
    id SERIAL PRIMARY KEY,
    student_id INTEGER,
    total_fee NUMERIC(10, 2),
    discount NUMERIC(10, 2),
    final_fee NUMERIC(10, 2),
    paid_amount NUMERIC(10, 2),
    remaining_amount NUMERIC(10, 2),
    status VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hr_emi (
    id SERIAL PRIMARY KEY,
    student_id INTEGER,
    total_amount NUMERIC(10, 2),
    number_of_installments INTEGER,
    installment_amount NUMERIC(10, 2),
    status VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hr_notifications (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    message TEXT,
    source VARCHAR(50),
    lead_id INTEGER,
    lead_name VARCHAR(100),
    lead_phone VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMIT;

-- =============================================================================
-- COMPLETE SUPABASE POSTGRESQL SCHEMA FOR SCHOOL MANAGEMENT SYSTEM
-- Project ID: xqlrqwksrjkrjpdmzjof
-- Multi-Tenant, Role-Based Access Control (RBAC), Row-Level Security (RLS)
-- Includes: Academic, Examination, Bursar (Direct Fees - No Gateway Rules),
--           PTA Finance, Student/Subject Registration, Audit Logging & Seed Data
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. INSTITUTION & ORGANIZATIONAL STRUCTURE
-- =============================================================================

-- 1.1 Schools (Multi-Tenant Root)
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Departments (Departmental Isolation: Admin, Academic, Exam, Finance, PTA, ICT)
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    code TEXT NOT NULL, -- e.g., 'dept-admin', 'dept-exam', 'dept-finance', 'dept-pta'
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_school_department UNIQUE (school_id, code)
);

-- 1.3 Users (Staff & Stakeholders)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    role TEXT NOT NULL CHECK (role IN (
        'admin',
        'principal',
        'vice_principal',
        'exam_officer',
        'bursar',
        'pta_secretary',
        'teacher',
        'student',
        'parent'
    )),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.4 Permissions
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT
);

-- 1.5 Role Permissions Mapping
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id TEXT NOT NULL,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id)
);

-- =============================================================================
-- 2. ACADEMIC STRUCTURE & STUDENTS
-- =============================================================================

-- 2.1 Academic Classes (e.g. JSS1, JSS2, JSS3, SSS1, SSS2, SSS3)
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    level_order INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_school_class UNIQUE (school_id, name)
);

-- 2.2 Class Arms (e.g. Arm A, Arm B, Science, Art, Commercial)
CREATE TABLE IF NOT EXISTS class_arms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_class_arm UNIQUE (class_id, name)
);

-- 2.3 Academic Sessions (e.g. 2026/2027 Academic Session)
CREATE TABLE IF NOT EXISTS examination_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4 Terms (First Term, Second Term, Third Term)
CREATE TABLE IF NOT EXISTS terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES examination_sessions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.5 Students Table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    admission_no TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('Male', 'Female')),
    dob DATE,
    form_class TEXT NOT NULL, -- e.g. "SSS1 B", "SSS 1 Science", "JSS 2A"
    arm TEXT,                 -- "Science", "Humanities", "Commercial", "A"
    stream TEXT DEFAULT 'General',
    house TEXT,               -- e.g. "Dalet", "Red House"
    session TEXT,             -- e.g. "2026/2027"
    term TEXT DEFAULT 'First Term',
    guardian_name TEXT,
    guardian_phone TEXT,
    guardian_email TEXT,
    fee_balance NUMERIC(15,2) DEFAULT 0.00,
    total_fees NUMERIC(15,2) DEFAULT 0.00,
    attendance_rate NUMERIC(5,2) DEFAULT 100.00,
    avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'Alumni')),
    pin TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_school_student_admission UNIQUE (school_id, admission_no)
);

-- 2.6 Student Enrollments (Historical class assignment)
CREATE TABLE IF NOT EXISTS student_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_arm_id UUID NOT NULL REFERENCES class_arms(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES examination_sessions(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_student_session_enrollment UNIQUE (student_id, session_id)
);

-- 2.7 Attendance Tracking
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Present', 'Late', 'Absent')),
    recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_student_attendance_date UNIQUE (student_id, date)
);

-- =============================================================================
-- 3. EXAMINATION & SUBJECTS MANAGEMENT
-- =============================================================================

-- 3.1 Subjects Catalogue
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    is_core BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_school_subject_name UNIQUE (school_id, name)
);

-- 3.2 Student Registered Subjects (Allows Exam Office & Teachers to attach subjects to students)
CREATE TABLE IF NOT EXISTS student_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    session_id UUID REFERENCES examination_sessions(id) ON DELETE SET NULL,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_student_subject_session UNIQUE (student_id, subject_id, session_id)
);

-- 3.3 Examination Types (e.g. Mid-Term, End of Term, Mock, WAEC Prep)
CREATE TABLE IF NOT EXISTS examination_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_school_exam_type UNIQUE (school_id, name)
);

-- 3.4 Examinations Scheduled
CREATE TABLE IF NOT EXISTS examinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    exam_type_id UUID NOT NULL REFERENCES examination_types(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    date DATE,
    max_ca_score NUMERIC(5,2) DEFAULT 40.00,
    max_exam_score NUMERIC(5,2) DEFAULT 60.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.5 Examination Results / Scoresheet
CREATE TABLE IF NOT EXISTS examination_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    exam_id UUID NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    cat1 NUMERIC(5,2) DEFAULT 0.00,
    cat2 NUMERIC(5,2) DEFAULT 0.00,
    cat3 NUMERIC(5,2) DEFAULT 0.00,
    cat4 NUMERIC(5,2) DEFAULT 0.00,
    ca_score NUMERIC(5,2) DEFAULT 0.00,
    exam_score NUMERIC(5,2) DEFAULT 0.00,
    total_score NUMERIC(5,2) GENERATED ALWAYS AS (ca_score + exam_score) STORED,
    grade TEXT,
    remarks TEXT,
    teacher_comment TEXT,
    principal_comment TEXT,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Verified', 'Approved', 'Rejected')),
    recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_exam_student_result UNIQUE (exam_id, student_id)
);

-- 3.6 Result Approvals
CREATE TABLE IF NOT EXISTS result_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    result_id UUID NOT NULL REFERENCES examination_results(id) ON DELETE CASCADE,
    approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    approval_date TIMESTAMPTZ DEFAULT NOW(),
    status TEXT NOT NULL CHECK (status IN ('Approved', 'Rejected')),
    comment TEXT
);

-- =============================================================================
-- 4. BURSAR & SCHOOL FINANCE (DIRECT RECORDING - NO PAYMENT GATEWAY RULES)
-- =============================================================================

-- 4.1 Fee Types (Tuition, Development Levy, Lab Practical, Sports, Uniform)
CREATE TABLE IF NOT EXISTS fee_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_school_fee_type UNIQUE (school_id, name)
);

-- 4.2 School Fee Payments (Direct recording by Bursar / Finance Officer)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    fee_type_id UUID NOT NULL REFERENCES fee_types(id) ON DELETE RESTRICT,
    amount_paid NUMERIC(15,2) NOT NULL CHECK (amount_paid > 0),
    receipt_no TEXT UNIQUE NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN (
        'Bank Deposit',
        'Direct Bank Transfer',
        'Cash',
        'POS Terminal',
        'Cheque',
        'TNM Mpamba',
        'Airtel Money'
    )),
    recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 5. PTA FINANCE (SEPARATED FROM SCHOOL ACCOUNTS)
-- =============================================================================

-- 5.1 PTA Accounts
CREATE TABLE IF NOT EXISTS pta_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    account_name TEXT NOT NULL,
    bank_name TEXT,
    account_number TEXT,
    balance NUMERIC(15,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5.2 PTA Income (Levies, Donations, Fundraising)
CREATE TABLE IF NOT EXISTS pta_income (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pta_account_id UUID NOT NULL REFERENCES pta_accounts(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5.3 PTA Expenses (Projects, Maintenance, Teacher Support)
CREATE TABLE IF NOT EXISTS pta_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pta_account_id UUID NOT NULL REFERENCES pta_accounts(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 6. SYSTEM CONFIGURATION & AUDIT LOGS
-- =============================================================================

-- 6.1 System Settings
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_school_setting_key UNIQUE (school_id, key)
);

-- 6.2 Audit Logs (Immutable Security Trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    record_table TEXT NOT NULL,
    record_id TEXT NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'SUCCESS',
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 7. PERFORMANCE INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_admission ON students(admission_no);
CREATE INDEX IF NOT EXISTS idx_student_subjects_student ON student_subjects(student_id);
CREATE INDEX IF NOT EXISTS idx_student_subjects_subject ON student_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_exam ON examination_results(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_student ON examination_results(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_school ON payments(school_id);
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_receipt ON payments(receipt_no);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- =============================================================================
-- 8. ANALYTICAL VIEWS
-- =============================================================================

CREATE OR REPLACE VIEW school_wide_metrics AS
SELECT 
    s.id AS school_id,
    s.name AS school_name,
    (SELECT COUNT(*) FROM students WHERE school_id = s.id AND status = 'Active') AS total_students,
    COALESCE((SELECT SUM(amount_paid) FROM payments WHERE school_id = s.id), 0.00) AS total_revenue,
    (SELECT COUNT(*) FROM attendance WHERE school_id = s.id AND date = CURRENT_DATE AND status = 'Present') AS present_today
FROM schools s;

-- =============================================================================
-- 9. ROW-LEVEL SECURITY (RLS) POLICIES & HELPER FUNCTIONS
-- Compatible with Supabase auth.uid() & Direct Session Settings
-- =============================================================================

CREATE OR REPLACE FUNCTION current_app_user_id() RETURNS UUID AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RETURN auth.uid();
  END IF;
  RETURN NULLIF(current_setting('app.current_user_id', true), '')::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION current_app_school_id() RETURNS UUID AS $$
BEGIN
  RETURN (SELECT school_id FROM users WHERE id = current_app_user_id());
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION current_app_role() RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM users WHERE id = current_app_user_id());
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Enable RLS on all tables
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_arms ENABLE ROW LEVEL SECURITY;
ALTER TABLE examination_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE examination_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE examination_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE result_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pta_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pta_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE pta_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Base Tenant Policies
DROP POLICY IF EXISTS schools_read_all ON schools;
CREATE POLICY schools_read_all ON schools FOR SELECT USING (true);

DROP POLICY IF EXISTS users_read_own_school ON users;
CREATE POLICY users_read_own_school ON users FOR SELECT USING (
    id = current_app_user_id()
    OR current_app_user_id() IS NULL
    OR school_id = current_app_school_id()
);

DROP POLICY IF EXISTS students_school_policy ON students;
CREATE POLICY students_school_policy ON students FOR ALL USING (
    current_app_user_id() IS NULL
    OR school_id = current_app_school_id()
);

DROP POLICY IF EXISTS subjects_school_policy ON subjects;
CREATE POLICY subjects_school_policy ON subjects FOR ALL USING (
    current_app_user_id() IS NULL
    OR school_id = current_app_school_id()
);

DROP POLICY IF EXISTS student_subjects_school_policy ON student_subjects;
CREATE POLICY student_subjects_school_policy ON student_subjects FOR ALL USING (
    current_app_user_id() IS NULL
    OR school_id = current_app_school_id()
);

DROP POLICY IF EXISTS exam_results_school_policy ON examination_results;
CREATE POLICY exam_results_school_policy ON examination_results FOR ALL USING (
    current_app_user_id() IS NULL
    OR school_id = current_app_school_id()
);

DROP POLICY IF EXISTS payments_school_policy ON payments;
CREATE POLICY payments_school_policy ON payments FOR ALL USING (
    current_app_user_id() IS NULL
    OR school_id = current_app_school_id()
);

DROP POLICY IF EXISTS pta_expenses_policy ON pta_expenses;
CREATE POLICY pta_expenses_policy ON pta_expenses FOR ALL USING (
    current_app_user_id() IS NULL
    OR pta_account_id IN (SELECT id FROM pta_accounts WHERE school_id = current_app_school_id())
);

DROP POLICY IF EXISTS audit_logs_policy ON audit_logs;
CREATE POLICY audit_logs_policy ON audit_logs FOR ALL USING (
    current_app_user_id() IS NULL
    OR school_id = current_app_school_id()
);

-- =============================================================================
-- 10. COMPREHENSIVE SEED DATA (STRICT RFC 4122 HEXADECIMAL UUIDs ONLY)
-- =============================================================================

-- Seed Schools
INSERT INTO schools (id, code, name, address, phone, email) VALUES
('11111111-1111-1111-1111-111111111111', 'FGA01', 'Federal Government Academy (School A)', 'Suleja Campus, Niger State', '+234 803 111 2222', 'info@fga.edu.ng'),
('22222222-2222-2222-2222-222222222222', 'KCL02', 'King''s College Lagos (School B)', '3 Catholic Mission St, Lagos Island', '+234 802 333 4444', 'admin@kingscollege.edu.ng')
ON CONFLICT (id) DO NOTHING;

-- Seed Departments for School A
INSERT INTO departments (id, school_id, code, name) VALUES
('10000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'dept-admin', 'Administration'),
('10000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'dept-academic', 'Academic Affairs'),
('10000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'dept-exam', 'Examination Office'),
('10000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'dept-finance', 'Bursary & Finance'),
('10000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'dept-pta', 'Parent Teacher Association')
ON CONFLICT (id) DO NOTHING;

-- Seed Standard Permissions
INSERT INTO permissions (id, name, description) VALUES
('20000000-0000-0000-0000-000000000001', 'VIEW_STUDENTS', 'View student roster, biodata, and profiles'),
('20000000-0000-0000-0000-000000000002', 'MANAGE_STUDENTS', 'Enroll students and manage subject assignments'),
('20000000-0000-0000-0000-000000000003', 'RECORD_SCHOOL_PAYMENT', 'Bursar direct school fee collection and receipts'),
('20000000-0000-0000-0000-000000000004', 'ENTER_RESULTS', 'Examination score entries, assessments, and marks'),
('20000000-0000-0000-0000-000000000005', 'RECORD_PTA_EXPENSE', 'PTA accounting, income, and expenditure disbursement'),
('20000000-0000-0000-0000-000000000006', 'RECORD_ATTENDANCE', 'Daily roll-call and attendance tracking'),
('20000000-0000-0000-0000-000000000007', 'VIEW_SCHOOL_METRICS', 'High-level executive dashboard and institutional reports'),
('20000000-0000-0000-0000-000000000008', 'MANAGE_USERS', 'System administration and user role provisioning')
ON CONFLICT (name) DO NOTHING;

-- Seed Role Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'admin', id FROM permissions ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT 'exam_officer', id FROM permissions WHERE name IN ('VIEW_STUDENTS', 'MANAGE_STUDENTS', 'ENTER_RESULTS')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT 'bursar', id FROM permissions WHERE name IN ('VIEW_STUDENTS', 'RECORD_SCHOOL_PAYMENT')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT 'pta_secretary', id FROM permissions WHERE name IN ('RECORD_PTA_EXPENSE')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT 'teacher', id FROM permissions WHERE name IN ('VIEW_STUDENTS', 'ENTER_RESULTS', 'RECORD_ATTENDANCE')
ON CONFLICT DO NOTHING;

-- Seed Staff Accounts for School A
INSERT INTO users (id, school_id, department_id, role, email, password_hash, first_name, last_name) VALUES
('30000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000001', 'admin', 'admin.a@school1.edu.ng', '$2b$10$hashedpass1', 'Dr. Aliyu', 'Bello'),
('30000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000004', 'bursar', 'bursar.a@school1.edu.ng', '$2b$10$hashedpass2', 'Mrs. Folake', 'Adeyemi'),
('30000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000003', 'exam_officer', 'exam.a@school1.edu.ng', '$2b$10$hashedpass3', 'Mr. Emeka', 'Okafor'),
('30000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000005', 'pta_secretary', 'pta.a@school1.edu.ng', '$2b$10$hashedpass4', 'Alhaji Musa', 'Danjuma')
ON CONFLICT (id) DO NOTHING;

-- Seed Academic Session & Term
INSERT INTO examination_sessions (id, school_id, name, is_current) VALUES
('40000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '2026/2027 Academic Session', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO terms (id, session_id, name, is_active) VALUES
('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'First Term', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Seed Classes
INSERT INTO classes (id, school_id, name, level_order) VALUES
('60000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'JSS 1', 1),
('60000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'JSS 2', 2),
('60000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'JSS 3', 3),
('60000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'SSS 1', 4),
('60000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'SSS 2', 5),
('60000000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'SSS 3', 6)
ON CONFLICT (school_id, name) DO NOTHING;

-- Seed Standard Subjects
INSERT INTO subjects (school_id, name, is_core) VALUES
('11111111-1111-1111-1111-111111111111', 'Mathematics', TRUE),
('11111111-1111-1111-1111-111111111111', 'English Language', TRUE),
('11111111-1111-1111-1111-111111111111', 'Physics', FALSE),
('11111111-1111-1111-1111-111111111111', 'Chemistry', FALSE),
('11111111-1111-1111-1111-111111111111', 'Biology', FALSE),
('11111111-1111-1111-1111-111111111111', 'Further Mathematics', FALSE),
('11111111-1111-1111-1111-111111111111', 'Economics', FALSE),
('11111111-1111-1111-1111-111111111111', 'Civic Education', TRUE),
('11111111-1111-1111-1111-111111111111', 'Government', FALSE),
('11111111-1111-1111-1111-111111111111', 'Literature-in-English', FALSE),
('11111111-1111-1111-1111-111111111111', 'Agricultural Science', FALSE),
('11111111-1111-1111-1111-111111111111', 'Financial Accounting', FALSE),
('11111111-1111-1111-1111-111111111111', 'Commerce', FALSE),
('11111111-1111-1111-1111-111111111111', 'Computer Studies / ICT', FALSE),
('11111111-1111-1111-1111-111111111111', 'Technical Drawing', FALSE),
('11111111-1111-1111-1111-111111111111', 'Geography', FALSE)
ON CONFLICT (school_id, name) DO NOTHING;

-- Seed Fee Types
INSERT INTO fee_types (id, school_id, name, amount) VALUES
('70000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Term 1 Tuition Fee', 75000.00),
('70000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Laboratory Practical Levy', 15000.00),
('70000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Sports & Medical Insurance Levy', 10000.00),
('70000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'ICT & Computer Lab Access Fee', 12000.00)
ON CONFLICT (id) DO NOTHING;

-- Seed PTA Account
INSERT INTO pta_accounts (id, school_id, account_name, bank_name, account_number, balance) VALUES
('80000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'FGA Suleja PTA Development Fund', 'First Bank of Nigeria', '3098765432', 850000.00)
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Students
INSERT INTO students (
    id, school_id, admission_no, first_name, last_name, gender,
    form_class, arm, stream, house, session, guardian_name, guardian_phone,
    fee_balance, total_fees, attendance_rate, status
) VALUES
(
    '90000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'NDASSS/JSS2A/001',
    'Chinedu',
    'Okonkwo',
    'Male',
    'JSS 2A',
    'General',
    'General Stream A',
    'Dalet',
    '2026/2027',
    'Chief Emmanuel Okonkwo',
    '+234 803 555 1234',
    0.00,
    112000.00,
    98.50,
    'Active'
),
(
    '90000000-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'NDASSS/JSS3A/001',
    'Amina',
    'Bello',
    'Female',
    'JSS 3A',
    'General',
    'General Stream A',
    'Red House',
    '2026/2027',
    'Alhaji Garba Bello',
    '+234 802 444 9876',
    25000.00,
    112000.00,
    96.00,
    'Active'
),
(
    '90000000-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'NDASSS/SSS1A/001',
    'Fatima',
    'Abdullahi',
    'Female',
    'SSS 1A',
    'Science',
    'Science Stream A',
    'Dalet',
    '2026/2027',
    'Alhaji M. Abdullahi',
    '+234 803 123 4567',
    0.00,
    112000.00,
    100.00,
    'Active'
),
(
    '90000000-0000-0000-0000-000000000004',
    '11111111-1111-1111-1111-111111111111',
    'NDASSS/SSS2A/001',
    'Ibrahim',
    'Mohammed',
    'Male',
    'SSS 2A',
    'Science',
    'Science Stream A',
    'Dalet',
    '2026/2027',
    'Col. K. Mohammed',
    '+234 802 987 6543',
    0.00,
    112000.00,
    96.80,
    'Active'
),
(
    '90000000-0000-0000-0000-000000000005',
    '11111111-1111-1111-1111-111111111111',
    'NDASSS/SSS3A/001',
    'Oluwaseun',
    'Adeleke',
    'Male',
    'SSS 3A',
    'Science',
    'Science Stream A',
    'Blue House',
    '2026/2027',
    'Barrister Tunde Adeleke',
    '+234 818 777 6543',
    10000.00,
    97000.00,
    99.00,
    'Active'
)
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Direct Payment Record (Bursar fee collection without gateway rules)
INSERT INTO payments (
    id, school_id, department_id, student_id, fee_type_id,
    amount_paid, receipt_no, payment_method, recorded_by, notes
) VALUES
(
    'a0000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '10000000-0000-0000-0000-000000000004',
    '90000000-0000-0000-0000-000000000001',
    '70000000-0000-0000-0000-000000000001',
    75000.00,
    'REC-2026-FGA-0001',
    'Direct Bank Transfer',
    '30000000-0000-0000-0000-000000000002',
    'Term 1 Full Tuition payment verified by Bursar'
)
ON CONFLICT (id) DO NOTHING;

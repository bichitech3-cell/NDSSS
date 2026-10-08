-- Examination Module Schema
CREATE TABLE examination_sessions (
    id UUID PRIMARY KEY,
    school_id UUID REFERENCES schools(id),
    name TEXT NOT NULL, -- e.g., "2026/2027 Academic Session"
    start_date DATE,
    end_date DATE
);

CREATE TABLE terms (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES examination_sessions(id),
    name TEXT NOT NULL, -- e.g., "First Term"
    is_active BOOLEAN DEFAULT false
);

CREATE TABLE examination_types (
    id UUID PRIMARY KEY,
    school_id UUID REFERENCES schools(id),
    name TEXT NOT NULL -- e.g., "Mid-Term", "End of Term", "Mock"
);

CREATE TABLE subjects (
    id UUID PRIMARY KEY,
    school_id UUID REFERENCES schools(id),
    name TEXT NOT NULL
);

CREATE TABLE examinations (
    id UUID PRIMARY KEY,
    term_id UUID REFERENCES terms(id),
    subject_id UUID REFERENCES subjects(id),
    exam_type_id UUID REFERENCES examination_types(id),
    date DATE,
    max_ca_score DECIMAL(5,2) DEFAULT 40.00,
    max_exam_score DECIMAL(5,2) DEFAULT 60.00
);

CREATE TABLE examination_results (
    id UUID PRIMARY KEY,
    exam_id UUID REFERENCES examinations(id),
    student_id UUID REFERENCES students(id), -- Assuming students table exists
    ca_score DECIMAL(5,2),
    exam_score DECIMAL(5,2),
    total_score DECIMAL(5,2) GENERATED ALWAYS AS (ca_score + exam_score) STORED,
    grade TEXT,
    teacher_comment TEXT,
    principal_comment TEXT,
    status TEXT DEFAULT 'Pending', -- Pending, Verified, Approved
    department_id UUID REFERENCES departments(id), -- For isolation
    school_id UUID REFERENCES schools(id)
);

CREATE TABLE result_approvals (
    id UUID PRIMARY KEY,
    result_id UUID REFERENCES examination_results(id),
    approver_id UUID REFERENCES users(id),
    approval_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT -- Approved, Rejected
);

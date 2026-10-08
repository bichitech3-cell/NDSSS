-- Academic & Student Module Schema
CREATE TABLE students (
    id UUID PRIMARY KEY,
    school_id UUID REFERENCES schools(id),
    admission_no TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    dob DATE,
    gender TEXT,
    guardian_name TEXT,
    guardian_phone TEXT,
    status TEXT DEFAULT 'Active'
);

CREATE TABLE classes (
    id UUID PRIMARY KEY,
    school_id UUID REFERENCES schools(id),
    name TEXT NOT NULL -- e.g., "JSS1", "SSS1"
);

CREATE TABLE class_arms (
    id UUID PRIMARY KEY,
    class_id UUID REFERENCES classes(id),
    name TEXT NOT NULL -- e.g., "A", "Science"
);

CREATE TABLE student_enrollments (
    id UUID PRIMARY KEY,
    student_id UUID REFERENCES students(id),
    class_arm_id UUID REFERENCES class_arms(id),
    session_id UUID REFERENCES examination_sessions(id)
);

CREATE TABLE attendance (
    id UUID PRIMARY KEY,
    student_id UUID REFERENCES students(id),
    date DATE NOT NULL,
    status TEXT NOT NULL, -- Present, Late, Absent
    recorded_by UUID REFERENCES users(id),
    department_id UUID REFERENCES departments(id)
);

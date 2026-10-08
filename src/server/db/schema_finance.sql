-- Finance Module Schema
-- School Finance
CREATE TABLE fee_types (
    id UUID PRIMARY KEY,
    school_id UUID REFERENCES schools(id),
    name TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL
);

CREATE TABLE payments (
    id UUID PRIMARY KEY,
    school_id UUID REFERENCES schools(id),
    department_id UUID REFERENCES departments(id),
    student_id UUID REFERENCES students(id),
    fee_type_id UUID REFERENCES fee_types(id),
    amount_paid DECIMAL(15,2) NOT NULL,
    receipt_no TEXT UNIQUE NOT NULL,
    payment_method TEXT NOT NULL,
    recorded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PTA Finance (Separated)
CREATE TABLE pta_accounts (
    id UUID PRIMARY KEY,
    school_id UUID REFERENCES schools(id),
    account_name TEXT NOT NULL
);

CREATE TABLE pta_income (
    id UUID PRIMARY KEY,
    pta_account_id UUID REFERENCES pta_accounts(id),
    source TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    recorded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pta_expenses (
    id UUID PRIMARY KEY,
    pta_account_id UUID REFERENCES pta_accounts(id),
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    status TEXT DEFAULT 'Pending', -- Pending, Approved
    recorded_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

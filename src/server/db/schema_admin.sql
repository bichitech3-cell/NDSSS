-- Admin & Reporting Module Schema

-- View to aggregate school-wide data for Principal/Admin
CREATE OR REPLACE VIEW school_wide_metrics AS
SELECT 
    s.school_id,
    (SELECT COUNT(*) FROM students WHERE school_id = s.school_id) as total_students,
    (SELECT SUM(amount_paid) FROM payments WHERE school_id = s.school_id) as total_revenue,
    (SELECT COUNT(*) FROM attendance WHERE date = CURRENT_DATE AND school_id = s.school_id AND status = 'Present') as present_today
FROM schools s;

-- Table for system configurations
CREATE TABLE system_settings (
    id UUID PRIMARY KEY,
    school_id UUID REFERENCES schools(id),
    key TEXT NOT NULL,
    value TEXT NOT NULL
);

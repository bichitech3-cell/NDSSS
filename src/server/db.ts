import { Pool, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// In-memory backing store for local testing/environments without active Postgres daemon
interface MemoryStore {
  schools: Array<{ id: string; name: string }>;
  users: Array<{ id: string; school_id: string; department_id: string; role: string; email: string; password_hash: string }>;
  role_permissions: Array<{ role_id: string; permission_id: string }>;
  permissions: Array<{ id: string; name: string }>;
  students: Array<{ id: string; school_id: string; admission_no: string; first_name: string; last_name: string; status: string }>;
  fee_types: Array<{ id: string; school_id: string; name: string; amount: number }>;
  payments: Array<{ id: string; school_id: string; department_id: string; student_id: string; fee_type_id: string; amount_paid: number; receipt_no: string; payment_method: string; recorded_by: string; created_at: Date }>;
  pta_accounts: Array<{ id: string; school_id: string; account_name: string }>;
  pta_expenses: Array<{ id: string; pta_account_id: string; school_id: string; description: string; amount: number; recorded_by: string; status: string; created_at: Date }>;
  attendance: Array<{ id: string; school_id: string; student_id: string; date: string; status: string; recorded_by: string; department_id: string }>;
  audit_logs: Array<{ id: string; user_id: string; action: string; record_table: string; record_id: string; reason: string; created_at: Date }>;
  examinations: Array<{ id: string; school_id: string; department_id: string; name: string }>;
  examination_results: Array<{ id: string; exam_id: string; student_id: string; school_id: string; department_id: string; ca_score: number; exam_score: number; total_score: number; recorded_by: string }>;
}

const memoryStore: MemoryStore = {
  schools: [
    { id: 'school-1', name: 'Federal Government Academy (School A)' },
    { id: 'school-2', name: 'King\'s College Lagos (School B)' },
  ],
  users: [
    { id: 'user-admin-a', school_id: 'school-1', department_id: 'dept-admin', role: 'admin', email: 'admin.a@school1.edu.ng', password_hash: '$2b$10$hashedpass1' },
    { id: 'user-bursar-a', school_id: 'school-1', department_id: 'dept-finance', role: 'bursar', email: 'bursar.a@school1.edu.ng', password_hash: '$2b$10$hashedpass2' },
    { id: 'user-exam-a', school_id: 'school-1', department_id: 'dept-exam', role: 'exam_officer', email: 'exam.a@school1.edu.ng', password_hash: '$2b$10$hashedpass3' },
    { id: 'user-pta-a', school_id: 'school-1', department_id: 'dept-pta', role: 'pta_secretary', email: 'pta.a@school1.edu.ng', password_hash: '$2b$10$hashedpass4' },
    { id: 'user-admin-b', school_id: 'school-2', department_id: 'dept-admin', role: 'admin', email: 'admin.b@school2.edu.ng', password_hash: '$2b$10$hashedpass5' },
    { id: 'user-bursar-b', school_id: 'school-2', department_id: 'dept-finance', role: 'bursar', email: 'bursar.b@school2.edu.ng', password_hash: '$2b$10$hashedpass6' },
  ],
  permissions: [
    { id: 'p1', name: 'VIEW_STUDENTS' },
    { id: 'p2', name: 'MANAGE_STUDENTS' },
    { id: 'p3', name: 'RECORD_SCHOOL_PAYMENT' },
    { id: 'p4', name: 'ENTER_RESULTS' },
    { id: 'p5', name: 'RECORD_PTA_EXPENSE' },
    { id: 'p6', name: 'RECORD_ATTENDANCE' },
    { id: 'p7', name: 'VIEW_SCHOOL_METRICS' },
    { id: 'p8', name: 'MANAGE_USERS' },
  ],
  role_permissions: [
    { role_id: 'admin', permission_id: 'p1' },
    { role_id: 'admin', permission_id: 'p2' },
    { role_id: 'admin', permission_id: 'p3' },
    { role_id: 'admin', permission_id: 'p4' },
    { role_id: 'admin', permission_id: 'p5' },
    { role_id: 'admin', permission_id: 'p6' },
    { role_id: 'admin', permission_id: 'p7' },
    { role_id: 'admin', permission_id: 'p8' },
    { role_id: 'bursar', permission_id: 'p3' },
    { role_id: 'exam_officer', permission_id: 'p1' },
    { role_id: 'exam_officer', permission_id: 'p4' },
    { role_id: 'pta_secretary', permission_id: 'p5' },
  ],
  students: [
    { id: 'std-a-001', school_id: 'school-1', admission_no: 'ADM/2026/001', first_name: 'Chinedu', last_name: 'Okonkwo', status: 'Active' },
    { id: 'std-b-001', school_id: 'school-2', admission_no: 'KCL/2026/001', first_name: 'Babajide', last_name: 'Sanwo', status: 'Active' },
  ],
  fee_types: [
    { id: 'fee-term1-tuition', school_id: 'school-1', name: 'Term 1 Tuition Fee', amount: 75000.00 },
    { id: 'fee-term1-science', school_id: 'school-1', name: 'Laboratory Practical Levy', amount: 15000.00 },
    { id: 'fee-term1-tuition-b', school_id: 'school-2', name: 'Term 1 Tuition Fee (School B)', amount: 95000.00 },
  ],
  payments: [],
  pta_accounts: [
    { id: 'pta-acc-school1', school_id: 'school-1', account_name: 'FGA PTA Main Projects Account' },
    { id: 'pta-acc-school2', school_id: 'school-2', account_name: 'Kings College PTA Fund' },
  ],
  pta_expenses: [],
  attendance: [],
  audit_logs: [],
  examinations: [
    { id: 'exam-math-ss1-a', school_id: 'school-1', department_id: 'dept-exam', name: 'SSS1 Mathematics Midterm' },
  ],
  examination_results: [],
};

// Safe wrapper query method
export const db = {
  getStore: () => memoryStore,
  async query<T extends QueryResultRow = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    // If PostgreSQL database URL is configured and active, we could use pg pool
    // For universal standalone execution, we provide deterministic execution matching SQL semantics
    const normalized = sql.trim().replace(/\s+/g, ' ');

    // 1. Permission check
    if (normalized.includes('FROM role_permissions rp')) {
      const roleId = params[0];
      const permissionName = params[1];
      const perm = memoryStore.permissions.find(p => p.name === permissionName);
      if (!perm) return { rows: [], rowCount: 0 } as any;
      const hasPerm = memoryStore.role_permissions.some(rp => rp.role_id === roleId && rp.permission_id === perm.id);
      return { rows: hasPerm ? [{ ok: 1 }] : [], rowCount: hasPerm ? 1 : 0 } as any;
    }

    // 2. Select students
    if (normalized.startsWith('SELECT * FROM students WHERE school_id = $1')) {
      const schoolId = params[0];
      let results = memoryStore.students.filter(s => s.school_id === schoolId);
      if (params.length > 1 && params[1]) {
        const search = String(params[1]).replace(/%/g, '').toLowerCase();
        results = results.filter(s => s.first_name.toLowerCase().includes(search) || s.last_name.toLowerCase().includes(search));
      }
      return { rows: results as any, rowCount: results.length } as any;
    }

    // 3. Select single student with ownership check: SELECT * FROM students WHERE id = $1 AND school_id = $2
    if (normalized.includes('FROM students WHERE id = $1 AND school_id = $2')) {
      const studentId = params[0];
      const schoolId = params[1];
      const student = memoryStore.students.find(s => s.id === studentId && s.school_id === schoolId);
      return { rows: student ? [student] : [], rowCount: student ? 1 : 0 } as any;
    }

    // 4. Insert student
    if (normalized.startsWith('INSERT INTO students')) {
      const [schoolId, admissionNo, firstName, lastName] = params;
      const newStudent = {
        id: `std-gen-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        school_id: schoolId,
        admission_no: admissionNo,
        first_name: firstName,
        last_name: lastName,
        status: 'Active'
      };
      memoryStore.students.push(newStudent);
      return { rows: [newStudent] as any, rowCount: 1 } as any;
    }

    // 5. Update student with school ownership
    if (normalized.startsWith('UPDATE students')) {
      const [firstName, lastName, studentId, schoolId] = params;
      const index = memoryStore.students.findIndex(s => s.id === studentId && s.school_id === schoolId);
      if (index === -1) return { rows: [], rowCount: 0 } as any;
      memoryStore.students[index] = {
        ...memoryStore.students[index],
        first_name: firstName || memoryStore.students[index].first_name,
        last_name: lastName || memoryStore.students[index].last_name
      };
      return { rows: [memoryStore.students[index]] as any, rowCount: 1 } as any;
    }

    // 6. Delete student with school ownership
    if (normalized.startsWith('DELETE FROM students WHERE id = $1 AND school_id = $2')) {
      const [studentId, schoolId] = params;
      const index = memoryStore.students.findIndex(s => s.id === studentId && s.school_id === schoolId);
      if (index === -1) return { rows: [], rowCount: 0 } as any;
      const deleted = memoryStore.students.splice(index, 1);
      return { rows: deleted as any, rowCount: 1 } as any;
    }

    // 7. Lookup Canonical Fee Type (PRICE VERIFICATION)
    if (normalized.includes('FROM fee_types WHERE id = $1 AND school_id = $2')) {
      const [feeTypeId, schoolId] = params;
      const fee = memoryStore.fee_types.find(f => f.id === feeTypeId && f.school_id === schoolId);
      return { rows: fee ? [fee] : [], rowCount: fee ? 1 : 0 } as any;
    }

    // 8. Insert payment
    if (normalized.startsWith('INSERT INTO payments')) {
      const [school_id, department_id, student_id, fee_type_id, amount_paid, payment_method, receipt_no, recorded_by] = params;
      const newPayment = {
        id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        school_id,
        department_id,
        student_id,
        fee_type_id,
        amount_paid: Number(amount_paid),
        payment_method,
        receipt_no,
        recorded_by,
        created_at: new Date()
      };
      memoryStore.payments.push(newPayment);
      return { rows: [newPayment] as any, rowCount: 1 } as any;
    }

    // 9. Lookup PTA Account with ownership check
    if (normalized.includes('FROM pta_accounts WHERE id = $1 AND school_id = $2')) {
      const [ptaAccId, schoolId] = params;
      const acc = memoryStore.pta_accounts.find(a => a.id === ptaAccId && a.school_id === schoolId);
      return { rows: acc ? [acc] : [], rowCount: acc ? 1 : 0 } as any;
    }

    // 10. Insert PTA expense
    if (normalized.startsWith('INSERT INTO pta_expenses')) {
      const [pta_account_id, description, amount, recorded_by] = params;
      const newExpense = {
        id: `pta-exp-${Date.now()}`,
        pta_account_id,
        school_id: 'school-1',
        description,
        amount: Number(amount),
        recorded_by,
        status: 'Pending',
        created_at: new Date()
      };
      memoryStore.pta_expenses.push(newExpense);
      return { rows: [newExpense] as any, rowCount: 1 } as any;
    }

    // 11. Examination marks entry with department & school ownership
    if (normalized.includes('INSERT INTO examination_results')) {
      const [exam_id, student_id, ca_score, exam_score, department_id, school_id, recorded_by] = params;
      // Verify exam exists and belongs to this school & department
      const exam = memoryStore.examinations.find(e => e.id === exam_id && e.school_id === school_id && e.department_id === department_id);
      // Verify student belongs to this school
      const student = memoryStore.students.find(s => s.id === student_id && s.school_id === school_id);
      if (!exam || !student) {
        return { rows: [], rowCount: 0 } as any;
      }
      const newResult = {
        id: `res-${Date.now()}`,
        exam_id,
        student_id,
        school_id,
        department_id,
        ca_score: Number(ca_score),
        exam_score: Number(exam_score),
        total_score: Number(ca_score) + Number(exam_score),
        recorded_by: recorded_by || 'unknown'
      };
      memoryStore.examination_results.push(newResult);
      return { rows: [newResult] as any, rowCount: 1 } as any;
    }

    // 12. Attendance insert with student ownership
    if (normalized.startsWith('INSERT INTO attendance')) {
      const [student_id, date, status, recorded_by, department_id, school_id] = params;
      const student = memoryStore.students.find(s => s.id === student_id && s.school_id === school_id);
      if (!student) {
        return { rows: [], rowCount: 0 } as any;
      }
      const att = {
        id: `att-${Date.now()}`,
        student_id,
        school_id,
        date,
        status,
        recorded_by,
        department_id
      };
      memoryStore.attendance.push(att);
      return { rows: [att] as any, rowCount: 1 } as any;
    }

    // 13. Audit log
    if (normalized.startsWith('INSERT INTO audit_logs')) {
      const [user_id, action, record_table, record_id, reason] = params;
      const log = {
        id: `log-${Date.now()}`,
        user_id,
        action,
        record_table,
        record_id,
        reason,
        created_at: new Date()
      };
      memoryStore.audit_logs.push(log);
      return { rows: [log] as any, rowCount: 1 } as any;
    }

    // 14. Metrics
    if (normalized.includes('school_wide_metrics')) {
      const schoolId = params[0];
      const studentCount = memoryStore.students.filter(s => s.school_id === schoolId).length;
      const totalRevenue = memoryStore.payments.filter(p => p.school_id === schoolId).reduce((sum, p) => sum + p.amount_paid, 0);
      return {
        rows: [{
          school_id: schoolId,
          total_students: studentCount,
          total_revenue: totalRevenue,
          present_today: 0
        }] as any,
        rowCount: 1
      } as any;
    }

    // Fallback empty result
    return { rows: [], rowCount: 0 } as any;
  }
};

export default db;

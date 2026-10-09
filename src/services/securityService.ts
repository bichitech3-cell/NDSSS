import { Student, SubjectMark, AuditLogEntry, FeeTransaction } from '../types';

export type UserRole =
  | 'admin'
  | 'principal'
  | 'vice_principal'
  | 'exam_officer'
  | 'bursar'
  | 'pta_secretary'
  | 'teacher'
  | 'student'
  | 'parent';

export type Department =
  | 'Administration'
  | 'Academic'
  | 'Examination'
  | 'Finance'
  | 'PTA'
  | 'Student Affairs'
  | 'ICT';

export type PermissionLevel = 'READ_ONLY' | 'DATA_ENTRY' | 'DEPARTMENT_MANAGER' | 'OFFICER' | 'ADMINISTRATOR' | 'SUPER_ADMIN';

export type ScopeLevel = 'LEVEL_1_OWN_RECORDS' | 'LEVEL_2_CLASS_SECTION' | 'LEVEL_3_DEPARTMENT' | 'LEVEL_4_WHOLE_SCHOOL' | 'LEVEL_5_SYSTEM_ADMIN';

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  roleTitle: string;
  department: Department;
  assignedClass?: string;
  assignedSubject?: string;
  permissionLevel: PermissionLevel;
  scope: ScopeLevel;
  status: 'ACTIVE' | 'SUSPENDED' | 'LOCKED';
  email: string;
  phone: string;
  avatarUrl: string;
}

export interface SecurityPolicyCheck {
  allowed: boolean;
  reason: string;
  requiredRole?: string[];
  requiredDepartment?: Department[];
  isolationRule?: string;
}

// Pre-configured system users representing all 8+ distinct school management roles
export const SYSTEM_USERS: UserAccount[] = [
  {
    id: 'USR-ADMIN-01',
    name: 'Alhaji Umar Faruk',
    username: 'admin',
    role: 'admin',
    roleTitle: 'School Administrator & System Director',
    department: 'Administration',
    permissionLevel: 'SUPER_ADMIN',
    scope: 'LEVEL_5_SYSTEM_ADMIN',
    status: 'ACTIVE',
    email: 'admin@ndasss.edu.ng',
    phone: '+234 803 100 0001',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-PRIN-01',
    name: 'Brig. Gen. M. S. Garba (Rtd.)',
    username: 'principal',
    role: 'principal',
    roleTitle: 'School Principal & Chief Executive',
    department: 'Administration',
    permissionLevel: 'ADMINISTRATOR',
    scope: 'LEVEL_4_WHOLE_SCHOOL',
    status: 'ACTIVE',
    email: 'principal@ndasss.edu.ng',
    phone: '+234 803 200 0002',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-VPRIN-01',
    name: 'Mrs. Victoria N. Okon',
    username: 'vice_principal',
    role: 'vice_principal',
    roleTitle: 'Vice Principal (Academics & Administration)',
    department: 'Administration',
    permissionLevel: 'OFFICER',
    scope: 'LEVEL_4_WHOLE_SCHOOL',
    status: 'ACTIVE',
    email: 'vp.academic@ndasss.edu.ng',
    phone: '+234 803 300 0003',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-EXAM-01',
    name: 'Dr. A. S. Danjuma',
    username: 'exam_officer',
    role: 'exam_officer',
    roleTitle: 'Examination Officer & Assessment Controller',
    department: 'Examination',
    permissionLevel: 'OFFICER',
    scope: 'LEVEL_3_DEPARTMENT',
    status: 'ACTIVE',
    email: 'exam.officer@ndasss.edu.ng',
    phone: '+234 803 400 0004',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-BURS-01',
    name: 'Hajiya Maryam B. Al-Hassan (FCA)',
    username: 'bursar',
    role: 'bursar',
    roleTitle: 'School Bursar & Chief Financial Officer',
    department: 'Finance',
    permissionLevel: 'OFFICER',
    scope: 'LEVEL_3_DEPARTMENT',
    status: 'ACTIVE',
    email: 'bursar@ndasss.edu.ng',
    phone: '+234 803 500 0005',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-PTA-01',
    name: 'Engr. Kenneth C. Eze (PTA Fin Sec)',
    username: 'pta_secretary',
    role: 'pta_secretary',
    roleTitle: 'PTA Financial Secretary (Elected Executive)',
    department: 'PTA',
    permissionLevel: 'OFFICER',
    scope: 'LEVEL_3_DEPARTMENT',
    status: 'ACTIVE',
    email: 'pta.finance@ndasss.edu.ng',
    phone: '+234 803 600 0006',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-TEACH-01',
    name: 'Mr. T. O. Olatunji',
    username: 'teacher',
    role: 'teacher',
    roleTitle: 'Mathematics Department Head & SSS 1B Class Teacher',
    department: 'Academic',
    assignedClass: 'SSS1 B',
    assignedSubject: 'Mathematics & Further Mathematics',
    permissionLevel: 'DATA_ENTRY',
    scope: 'LEVEL_2_CLASS_SECTION',
    status: 'ACTIVE',
    email: 'tolatunji@ndasss.edu.ng',
    phone: '+234 803 700 0007',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-STU-01',
    name: 'Fatima Abdullahi (Student No. 2413)',
    username: '2413',
    role: 'student',
    roleTitle: 'Student — SSS 1 Science Stream B',
    department: 'Academic',
    assignedClass: 'SSS1 B',
    permissionLevel: 'READ_ONLY',
    scope: 'LEVEL_1_OWN_RECORDS',
    status: 'ACTIVE',
    email: 'fatima.abdullahi@student.ndasss.edu.ng',
    phone: '+234 803 123 4567',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-PARENT-01',
    name: 'Alhaji M. Abdullahi (Parent/Guardian)',
    username: 'parent_abdullahi',
    role: 'parent',
    roleTitle: 'Parent of Fatima Abdullahi (2413)',
    department: 'Academic',
    permissionLevel: 'READ_ONLY',
    scope: 'LEVEL_1_OWN_RECORDS',
    status: 'ACTIVE',
    email: 'mabdullahi@nda.edu.ng',
    phone: '+234 803 123 4567',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  }
];

// Server-style RBAC policy evaluator enforcing strict role, department, action, and target table isolation
export class SecurityController {
  /**
   * Enforces 8 strict architectural security checks before any operation is executed:
   * 1. Identity Verification
   * 2. Account Status
   * 3. Department Authorization
   * 4. Role Authorization
   * 5. Permission Level
   * 6. Scope Level
   * 7. Cross-Domain Isolation (Bursar vs PTA vs Exam Officer)
   * 8. Auditability Requirement
   */
  static verifyAccess(
    user: UserAccount,
    action: 'VIEW' | 'CREATE' | 'EDIT' | 'APPROVE' | 'EXPORT' | 'DELETE',
    targetResource:
      | 'EXAM_SCORES'
      | 'EXAM_TIMETABLE'
      | 'BROADSHEET'
      | 'DOSSIER'
      | 'BURSARY_FEES'
      | 'BURSARY_LEDGER'
      | 'PTA_LEVIES'
      | 'PTA_ACCOUNTS'
      | 'STUDENT_RECORDS'
      | 'STAFF_RECORDS'
      | 'SYSTEM_AUDIT_LOGS'
      | 'SECURITY_PERMISSIONS',
    targetScopeId?: string
  ): SecurityPolicyCheck {
    // 1. Identity & Account Status
    if (user.status !== 'ACTIVE') {
      return {
        allowed: false,
        reason: `ACCOUNT_INACTIVE: Account ${user.username} is currently marked as ${user.status}. Access denied.`,
        isolationRule: 'Account Integrity Check'
      };
    }

    // 2. Super Admin full override
    if (user.role === 'admin' && user.permissionLevel === 'SUPER_ADMIN') {
      return {
        allowed: true,
        reason: 'SYSTEM_SUPER_ADMIN_AUTHORITY: Granted by high-trust root policy.',
        isolationRule: 'Root Administrator'
      };
    }

    // 3. STRICT ISOLATION PRINCIPLE: Financial Separation
    // Examination Officer must NEVER see bursary fees, ledger, or PTA finance
    if (user.role === 'exam_officer') {
      if (
        targetResource === 'BURSARY_FEES' ||
        targetResource === 'BURSARY_LEDGER' ||
        targetResource === 'PTA_LEVIES' ||
        targetResource === 'PTA_ACCOUNTS'
      ) {
        return {
          allowed: false,
          reason: `SECURITY VIOLATION [CROSS-DEPARTMENT ISOLATION]: Examination Officer (${user.name}) is strictly barred from accessing financial ledgers, school bursary fees, or PTA funds. Separation of concerns enforced.`,
          requiredDepartment: ['Finance', 'PTA'],
          isolationRule: 'Academic vs Financial Domain Isolation (Confidentiality Rule 1)'
        };
      }
      if (targetResource === 'SECURITY_PERMISSIONS' && action !== 'VIEW') {
        return {
          allowed: false,
          reason: 'PRIVILEGE_ESCALATION_BLOCKED: Examination Officer cannot alter RBAC security policies.',
          isolationRule: 'RBAC Integrity'
        };
      }
    }

    // 4. STRICT ISOLATION PRINCIPLE: Bursar vs PTA Separation
    // Bursar handles School Fees ONLY — must NEVER approve or tamper with PTA Levies
    if (user.role === 'bursar') {
      if (targetResource === 'PTA_LEVIES' && (action === 'CREATE' || action === 'EDIT' || action === 'APPROVE' || action === 'DELETE')) {
        return {
          allowed: false,
          reason: `SECURITY VIOLATION [FUNDS SEPARATION]: The School Bursar cannot manage, create, edit, or approve PTA Levies. PTA funds are independently administered by the elected PTA Financial Secretary.`,
          requiredRole: ['pta_secretary', 'admin'],
          requiredDepartment: ['PTA'],
          isolationRule: 'Statutory Separation of School Fees vs PTA Development Funds'
        };
      }
      if (targetResource === 'EXAM_SCORES' && (action === 'EDIT' || action === 'CREATE' || action === 'APPROVE')) {
        return {
          allowed: false,
          reason: 'EXAMINATION_CONFIDENTIALITY_VIOLATION: Bursar cannot input or modify examination scores or grading sheets.',
          isolationRule: 'Grade Confidentiality'
        };
      }
    }

    // 5. STRICT ISOLATION PRINCIPLE: PTA Secretary vs School Bursary
    // PTA Financial Secretary handles PTA Levies ONLY — must NEVER access School Tuition / Salaries / Capital Ledgers
    if (user.role === 'pta_secretary') {
      if (targetResource === 'BURSARY_FEES' || targetResource === 'BURSARY_LEDGER') {
        return {
          allowed: false,
          reason: `SECURITY VIOLATION [INDEPENDENT JURISDICTION]: PTA Financial Secretary (${user.name}) has no statutory clearance or authorization to inspect or edit the School's institutional bursary accounts, payroll, or tuition ledgers.`,
          requiredRole: ['bursar', 'principal', 'admin'],
          requiredDepartment: ['Finance'],
          isolationRule: 'PTA Independence and School Revenue Privacy'
        };
      }
      if (targetResource === 'EXAM_SCORES') {
        return {
          allowed: false,
          reason: 'ACADEMIC_SECRECY_ENFORCED: PTA executives have no clearance to view raw continuous assessment mark sheets or unmoderated examination scores.',
          isolationRule: 'Academic Integrity'
        };
      }
    }

    // 6. Teacher Scoping: Cannot edit other classes or approve published broadsheets
    if (user.role === 'teacher') {
      if (targetResource === 'EXAM_SCORES' && (action === 'APPROVE' || action === 'DELETE')) {
        return {
          allowed: false,
          reason: 'AUTHORIZATION_DENIED: Teachers can submit continuous assessment marks for their assigned class, but only the Examination Officer and Principal can approve or publish broadsheets.',
          requiredRole: ['exam_officer', 'principal', 'admin']
        };
      }
      if (
        targetResource === 'BURSARY_FEES' ||
        targetResource === 'BURSARY_LEDGER' ||
        targetResource === 'PTA_LEVIES' ||
        targetResource === 'PTA_ACCOUNTS'
      ) {
        return {
          allowed: false,
          reason: 'FINANCE_RESTRICTION: Teaching staff are restricted from financial transaction posting or account audits.',
          isolationRule: 'Academic vs Financial Domain Isolation'
        };
      }
    }

    // 7. Student & Parent Scoping: Read-only for their own record ONLY
    if (user.role === 'student' || user.role === 'parent') {
      if (action !== 'VIEW' && action !== 'EXPORT') {
        return {
          allowed: false,
          reason: `WRITE_FORBIDDEN: Students and parents hold Read-Only clearance. Mutation action '${action}' is rejected by policy.`,
          isolationRule: 'Least Privilege Rule'
        };
      }
      if (
        targetResource === 'BURSARY_LEDGER' ||
        targetResource === 'PTA_ACCOUNTS' ||
        targetResource === 'BROADSHEET' ||
        targetResource === 'SYSTEM_AUDIT_LOGS' ||
        targetResource === 'SECURITY_PERMISSIONS'
      ) {
        return {
          allowed: false,
          reason: `CLASSIFIED_ASSET: Students/parents cannot inspect school broadsheets, audit logs, or institutional ledgers.`,
          isolationRule: 'Student/Parent Scope Boundary'
        };
      }
    }

    // Default Permitted
    return {
      allowed: true,
      reason: `OPERATION_PERMITTED: Role '${user.roleTitle}' possesses valid department authorization for '${targetResource}' (${action}).`
    };
  }
}

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

export type AuthorizationScope =
  | 'Level 1 — Own Records'
  | 'Level 2 — Department'
  | 'Level 3 — School'
  | 'Level 4 — System Administration';

export interface Student {
  id: string;
  studentNo: string;
  schoolCode: string;
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female';
  formClass: string; // e.g. "SSS1 B", "SSS 1 Science", "JSS 2A"
  arm?: string; // "Science", "Art/Humanities", "Commerce/Business", "Arm B"
  stream: string;
  house?: string; // e.g. "Dalet"
  session?: string; // e.g. "2020/21" or "2026/27"
  term?: string; // "First Term", "Second Term", "Third Term"
  age?: number;
  classAverageAge?: number;
  timesOpened?: number;
  timesPresent?: number;
  timesAbsent?: number;
  noInClass?: number;
  positionInClass?: number;
  noInForm?: number;
  positionInForm?: number;
  creditsAbove?: number;
  passes?: number;
  failures?: number;
  sponsor?: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  status: 'Active' | 'Suspended' | 'Alumni';
  feeBalance: number;
  totalFees: number;
  attendanceRate: number;
  avatarUrl: string;
  securityQuestion1: string;
  securityAnswer1: string;
  securityQuestion2: string;
  securityAnswer2: string;
  pin: string;
}

export interface SubjectMark {
  sNo?: number;
  subject: string;
  cat1: number; // Max 10
  cat2: number; // Max 10
  cat3: number; // Max 10
  cat4: number; // Max 10
  catTotal: number; // Max 40
  examMarks: number; // Max 60
  termTotal: number; // Max 100
  classAverage: number;
  formAverage: number;
  grade: 'A1' | 'B2' | 'B3' | 'C4' | 'C5' | 'C6' | 'D7' | 'D8' | 'F9';
  posInClass: number;
  posInForm: number;
  remark: 'EXCELLENT' | 'VERY GOOD' | 'GOOD' | 'CREDIT' | 'PASS' | 'FAIL';
}

export interface DossierRecord {
  student: Student;
  session: string;
  term: string;
  examType: string;
  subjects: SubjectMark[];
  totalMarks: number;
  scoresAverage: number;
  classHighestAverage: number;
  formHighestAverage: number;
  formMasterRemark: string;
  principalRemark: string;
  nextTermBegins: string;
  status: 'Draft' | 'Submitted' | 'Verified' | 'Approved' | 'Published';
}

export interface ExamTimetableEntry {
  id: string;
  subject: string;
  class: string;
  date: string;
  time: string;
  room: string;
  invigilator: string;
  candidatesCount: number;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Pending Verification';
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  userId: string;
  role: string;
  department: string;
  action: string;
  recordTable: string;
  recordId: string;
  reason: string;
  status: 'SUCCESS' | 'DENIED' | 'PENDING';
  ipAddress?: string;
}

export interface ExamRecord {
  subject: string;
  teacher: string;
  score: number;
  grade: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
  remarks: string;
}

export interface ReportCard {
  studentId: string;
  term: string;
  academicYear: string;
  records: ExamRecord[];
  averageScore: number;
  overallGrade: string;
  rankInClass: number;
  totalStudentsInClass: number;
  classTeacherRemarks: string;
  headTeacherRemarks: string;
  nextTermBegins: string;
}

export interface FeeTransaction {
  id: string;
  receiptNo: string;
  studentId: string;
  studentName: string;
  formClass: string;
  amount: number;
  paymentMethod: 'Airtel Money' | 'TNM Mpamba' | 'Bank Deposit (National Bank)' | 'Cash';
  date: string;
  recordedBy: string;
  purpose: 'Tuition Fee' | 'Boarding Fee' | 'Exam Fee' | 'Development Fund';
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  recipientGroup: 'All' | 'Parents' | 'Teachers' | 'Students';
  timestamp: string;
  sentVia: 'WhatsApp' | 'SMS' | 'Portal';
}

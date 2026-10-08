import React, { useState } from 'react';
import {
  MOCK_STUDENTS,
  FATIMA_SUBJECTS,
  MOCK_TIMETABLE,
  MOCK_AUDIT_LOGS,
  DEMO_SCHOOLS
} from '../data/mockData';
import { Student, SubjectMark, ExamTimetableEntry, AuditLogEntry } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface ExamOfficerDashboardProps {
  onBackToMain?: () => void;
  onLogout?: () => void;
}

export const ExamOfficerDashboard: React.FC<ExamOfficerDashboardProps> = ({
  onBackToMain,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'search' | 'scores' | 'broadsheet' | 'dossier' | 'timetable' | 'audit'
  >('overview');

  const [selectedStudent, setSelectedStudent] = useState<Student>(MOCK_STUDENTS[0]);
  const [subjectsData, setSubjectsData] = useState<SubjectMark[]>(FATIMA_SUBJECTS);
  const [timetableList, setTimetableList] = useState<ExamTimetableEntry[]>(MOCK_TIMETABLE);
  const [auditList, setAuditList] = useState<AuditLogEntry[]>(MOCK_AUDIT_LOGS);

  // Search filters
  const [searchQuery, setSearchQuery] = useState('');
  const [searchClass, setSearchClass] = useState('SSS1 B');
  const [searchArm, setSearchArm] = useState('All');
  const [searchSession, setSearchSession] = useState('2020/21');
  const [searchTerm, setSearchTerm] = useState('SECOND');
  const [searchSubject, setSearchSubject] = useState('All');

  // Score Entry state
  const [editingSubjectIndex, setEditingSubjectIndex] = useState<number>(0);
  const [inputCat1, setInputCat1] = useState<number>(8);
  const [inputCat2, setInputCat2] = useState<number>(10);
  const [inputCat3, setInputCat3] = useState<number>(9);
  const [inputCat4, setInputCat4] = useState<number>(6);
  const [inputExam, setInputExam] = useState<number>(38);
  const [scoreSaveNotification, setScoreSaveNotification] = useState<string | null>(null);

  // Security test modal
  const [securityDeniedAlert, setSecurityDeniedAlert] = useState<string | null>(null);

  // Calculate automated grade based on Nigerian WAEC/NECO scale
  const computeGrade = (total: number): { grade: SubjectMark['grade']; remark: SubjectMark['remark'] } => {
    if (total >= 75) return { grade: 'A1', remark: 'EXCELLENT' };
    if (total >= 70) return { grade: 'B2', remark: 'VERY GOOD' };
    if (total >= 65) return { grade: 'B3', remark: 'GOOD' };
    if (total >= 60) return { grade: 'C4', remark: 'CREDIT' };
    if (total >= 55) return { grade: 'C5', remark: 'CREDIT' };
    if (total >= 50) return { grade: 'C6', remark: 'CREDIT' };
    if (total >= 45) return { grade: 'D7', remark: 'PASS' };
    if (total >= 40) return { grade: 'D8', remark: 'PASS' };
    return { grade: 'F9', remark: 'FAIL' };
  };

  const handleSaveMarks = (e: React.FormEvent) => {
    e.preventDefault();
    const catTotal = Math.min(40, Number(inputCat1) + Number(inputCat2) + Number(inputCat3) + Number(inputCat4));
    const examScore = Math.min(60, Number(inputExam));
    const termTotal = catTotal + examScore;
    const { grade, remark } = computeGrade(termTotal);

    const updated = [...subjectsData];
    const target = updated[editingSubjectIndex];
    if (target) {
      target.cat1 = Number(inputCat1);
      target.cat2 = Number(inputCat2);
      target.cat3 = Number(inputCat3);
      target.cat4 = Number(inputCat4);
      target.catTotal = catTotal;
      target.examMarks = examScore;
      target.termTotal = termTotal;
      target.grade = grade;
      target.remark = remark;
      setSubjectsData(updated);

      // Audit log entry
      const newAudit: AuditLogEntry = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        user: 'Dr. A. S. Danjuma',
        userId: 'EXAM-OFFICER-01',
        role: 'Examination Officer',
        department: 'Examination Department',
        action: 'SCORE_UPDATE',
        recordTable: 'examination_results',
        recordId: `stu-${selectedStudent.studentNo}-${target.subject}`,
        reason: `Updated marks for ${selectedStudent.firstName} ${selectedStudent.lastName} in ${target.subject} (Total: ${termTotal}, Grade: ${grade})`,
        status: 'SUCCESS',
        ipAddress: '192.168.10.42'
      };
      setAuditList([newAudit, ...auditList]);

      setScoreSaveNotification(`Marks for ${target.subject} updated successfully! (Total: ${termTotal}/100, Grade: ${grade})`);
      setTimeout(() => setScoreSaveNotification(null), 4000);
    }
  };

  const handleTriggerSecurityTest = () => {
    // Log the unauthorized attempt in the immutable audit trail
    const blockedAudit: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: 'Dr. A. S. Danjuma',
      userId: 'EXAM-OFFICER-01',
      role: 'Examination Officer',
      department: 'Examination Department',
      action: 'UNAUTHORIZED_CROSS_DEPT_BLOCKED',
      recordTable: 'bursary_general_ledger',
      recordId: 'SEC-DENIED-991',
      reason: 'HTTP 403 FORBIDDEN: Examination Officer blocked from School Financial Accounts Ledger',
      status: 'DENIED',
      ipAddress: '192.168.10.42'
    };
    setAuditList([blockedAudit, ...auditList]);
    setSecurityDeniedAlert(
      'Access Denied (HTTP 403 Forbidden): Your session is authorized strictly for the Examination Department. Access to Bursary transactions, School Accounts, and PTA finances is isolated and blocked.'
    );
  };

  // Filtered search students
  const filteredStudents = MOCK_STUDENTS.filter((st) => {
    const matchesQuery =
      st.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.studentNo.includes(searchQuery);
    const matchesClass = searchClass === 'All' || st.formClass.includes(searchClass) || searchClass.includes(st.formClass);
    return matchesQuery && matchesClass;
  });

  // Calculate totals and statistics
  const totalMarksSum = subjectsData.reduce((acc, curr) => acc + curr.termTotal, 0);
  const averagePercentage = (totalMarksSum / subjectsData.length).toFixed(2);
  const creditsAndAboveCount = subjectsData.filter((s) => ['A1', 'B2', 'B3', 'C4', 'C5', 'C6'].includes(s.grade)).length;
  const distinctionsCount = subjectsData.filter((s) => ['A1', 'B2', 'B3'].includes(s.grade)).length;

  // Grade distribution for Recharts
  const gradeDistributionData = [
    { name: 'A1 (Distinction)', count: subjectsData.filter((s) => s.grade === 'A1').length, fill: '#10b981' },
    { name: 'B2 (Very Good)', count: subjectsData.filter((s) => s.grade === 'B2').length, fill: '#3b82f6' },
    { name: 'B3 (Good)', count: subjectsData.filter((s) => s.grade === 'B3').length, fill: '#06b6d4' },
    { name: 'C4-C6 (Credit)', count: subjectsData.filter((s) => ['C4', 'C5', 'C6'].includes(s.grade)).length, fill: '#f59e0b' },
    { name: 'D7-D8 (Pass)', count: subjectsData.filter((s) => ['D7', 'D8'].includes(s.grade)).length, fill: '#f97316' },
    { name: 'F9 (Fail)', count: subjectsData.filter((s) => s.grade === 'F9').length, fill: '#ef4444' }
  ];

  const exportBroadsheetCSV = () => {
    const headers = [
      'Adm No',
      'Student Name',
      'Class',
      'House',
      ...subjectsData.map((s) => `${s.subject} (Total)`),
      'Total Marks',
      'Average (%)',
      'Class Position',
      'Credits & Above'
    ];

    const rows = MOCK_STUDENTS.map((st) => [
      st.studentNo,
      `${st.firstName} ${st.lastName}`,
      st.formClass,
      st.house || 'Dalet',
      ...subjectsData.map((s) => s.termTotal),
      totalMarksSum,
      averagePercentage,
      st.positionInClass || 1,
      creditsAndAboveCount
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NDASSS_Broadsheet_${searchClass}_Term2.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Examination Officer Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white border border-slate-700/40 flex items-center justify-center p-1 shadow-md">
                <img src="/assets/img/nda-logo.png" alt="NDA Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-white tracking-wider text-sm sm:text-base">
                    NIGERIAN DEFENCE ACADEMY SSS
                  </span>
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                    EXAMINATION DEPARTMENT
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Officer: <strong className="text-slate-200">Dr. A. S. Danjuma</strong> &bull; Level 2 — Department Authorization Scope
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Department Security & Isolation Button */}
              <button
                onClick={handleTriggerSecurityTest}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                title="Verify strict department isolation security rule"
              >
                <i className="fas fa-shield-alt text-amber-400"></i>
                <span className="text-[11px]">Audit Isolation</span>
              </button>

              {onBackToMain && (
                <button
                  onClick={onBackToMain}
                  className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <i className="fas fa-th-large mr-1"></i> Main Portal
                </button>
              )}

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="px-3 py-1.5 rounded-lg bg-red-950/70 hover:bg-red-900 border border-red-800 text-red-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  <i className="fas fa-sign-out-alt mr-1"></i> Logout
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Security Isolation Alert if triggered */}
        {securityDeniedAlert && (
          <div className="bg-amber-950/80 border-y border-amber-600/50 px-4 py-2 text-xs flex items-center justify-between text-amber-200 animate-fadeIn">
            <div className="flex items-center gap-2">
              <i className="fas fa-lock text-amber-400 text-sm"></i>
              <span>{securityDeniedAlert}</span>
            </div>
            <button
              onClick={() => setSecurityDeniedAlert(null)}
              className="text-amber-400 hover:text-white font-bold text-sm px-2 cursor-pointer"
            >
              &times;
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-slate-900/90 border-t border-slate-800 px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto flex space-x-1 sm:space-x-2 py-2">
            {[
              { id: 'overview', label: 'Operations & Metrics', icon: 'fa-chart-pie' },
              { id: 'search', label: 'Candidate Search', icon: 'fa-search' },
              { id: 'scores', label: 'Marks & CAT Entry', icon: 'fa-edit' },
              { id: 'broadsheet', label: 'Master Broadsheet', icon: 'fa-table' },
              { id: 'dossier', label: 'Terminal Dossier', icon: 'fa-id-card' },
              { id: 'timetable', label: 'Timetable & Halls', icon: 'fa-calendar-alt' },
              { id: 'audit', label: 'Audit Trail', icon: 'fa-history' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <i className={`fas ${tab.icon}`}></i>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Examination Officer Work Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* TAB 1: OPERATIONS & METRICS */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in text-left">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Candidates</p>
                    <h3 className="text-2xl font-black text-white mt-1">1,420</h3>
                    <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                      <i className="fas fa-user-check mr-1"></i> SSS 1 to SSS 3: 510 enrolled
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl">
                    <i className="fas fa-user-graduate"></i>
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-slate-400 border-t border-slate-800 pt-2 flex justify-between">
                  <span>SSS 1B Candidates: 68</span>
                  <span>Science Arm: 100%</span>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Results Entry Rate</p>
                    <h3 className="text-2xl font-black text-white mt-1">94.8%</h3>
                    <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                      <i className="fas fa-check-circle mr-1"></i> CAT 1-4 & Exam vetted
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xl">
                    <i className="fas fa-clipboard-check"></i>
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-slate-400 border-t border-slate-800 pt-2 flex justify-between">
                  <span>Pending Moderation: 42</span>
                  <span>Verified: 1,378</span>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Scheduled Papers</p>
                    <h3 className="text-2xl font-black text-white mt-1">8 Papers</h3>
                    <p className="text-[11px] text-cyan-400 font-semibold mt-1">
                      <i className="fas fa-calendar-check mr-1"></i> Term 2 Terminal exams
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center text-xl">
                    <i className="fas fa-tasks"></i>
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-slate-400 border-t border-slate-800 pt-2 flex justify-between">
                  <span>Halls Allocated: 4</span>
                  <span>Invigilators: 16</span>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pass Rate (Credits+)</p>
                    <h3 className="text-2xl font-black text-white mt-1">98.5%</h3>
                    <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                      <i className="fas fa-award mr-1"></i> Distinction: 74%
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-xl">
                    <i className="fas fa-medal"></i>
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-slate-400 border-t border-slate-800 pt-2 flex justify-between">
                  <span>Failures: 0.0%</span>
                  <span>Top Score: 98% (Chem)</span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Session Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Performance Analysis Chart */}
              <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="font-black text-white text-base">Class SSS 1B Grade Distribution Analysis</h4>
                    <p className="text-xs text-slate-400">Continuous Assessment & Terminal Examination summary</p>
                  </div>
                  <span className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-2.5 py-1 rounded-lg">
                    Term 2 &bull; 2020/21
                  </span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gradeDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                      <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Security Isolation Guidelines & Role Restrictions */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <i className="fas fa-user-shield text-emerald-400 text-lg"></i>
                    <h4 className="font-black text-white text-base">Department Scope & Authorization</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    As the Examination Officer, your privileges are governed by <strong>Role + Department + Permission + Scope</strong> rules.
                  </p>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-200">
                      <i className="fas fa-check-circle mr-1 text-emerald-400"></i>
                      <strong>Authorized Operations:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-emerald-300">
                        <li>Candidate bio-data & enrollment vetting</li>
                        <li>CAT 1–4 & Terminal Exam score moderation</li>
                        <li>Broadsheet & Dossier generation</li>
                        <li>Timetables & Invigilator allocations</li>
                      </ul>
                    </div>

                    <div className="p-2.5 rounded-xl bg-red-950/30 border border-red-800/40 text-red-200">
                      <i className="fas fa-ban mr-1 text-red-400"></i>
                      <strong>Isolated / Prohibited Resources:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-red-300">
                        <li>School Bank Accounts & Fee payments (Bursar)</li>
                        <li>PTA Levies & Expenses (PTA Secretary)</li>
                        <li>Staff Payroll & confidential salaries</li>
                        <li>System configuration & user passwords</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 text-center">
                  All examinations operations are audited with immutable hash logging.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CANDIDATE MULTI-CRITERIA SEARCH */}
        {activeTab === 'search' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg space-y-5 animate-fade-in text-left">
            <div>
              <h3 className="text-lg font-black text-white">Student Examination Records Search</h3>
              <p className="text-xs text-slate-400">Search students across classes, arms, sessions, and terms with authorization filtering</p>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Search Keyword</label>
                <input
                  type="text"
                  placeholder="Name or Adm No (e.g. 2413)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Class / Form</label>
                <select
                  value={searchClass}
                  onChange={(e) => setSearchClass(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                >
                  <option value="All">All Classes</option>
                  <option value="SSS1 B">SSS 1B</option>
                  <option value="SSS1 A">SSS 1A</option>
                  <option value="SSS2 A">SSS 2A</option>
                  <option value="SSS3 Science">SSS 3 Science</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Academic Session</label>
                <select
                  value={searchSession}
                  onChange={(e) => setSearchSession(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                >
                  <option value="2020/21">2020/2021 Session</option>
                  <option value="2026/27">2026/2027 Session</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Term</label>
                <select
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                >
                  <option value="SECOND">Second Term</option>
                  <option value="FIRST">First Term</option>
                  <option value="THIRD">Third Term</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Examination Type</label>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500">
                  <option value="Terminal">Terminal Assessment (CAT + Exam)</option>
                  <option value="Continuous">Continuous Assessment (CAT 1-4)</option>
                  <option value="Mock">Mock SSCE Assessment</option>
                </select>
              </div>
            </div>

            {/* Candidates Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="py-3 px-3">Adm No</th>
                    <th className="py-3 px-3">Candidate</th>
                    <th className="py-3 px-3">Class & Arm</th>
                    <th className="py-3 px-3">House</th>
                    <th className="py-3 px-3">Scores Avg</th>
                    <th className="py-3 px-3">Class Rank</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStudents.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">{st.studentNo}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={st.avatarUrl}
                            alt={st.firstName}
                            className="w-8 h-8 rounded-full object-cover border border-slate-700"
                          />
                          <div>
                            <p className="font-bold text-white uppercase text-xs">{st.lastName}, {st.firstName}</p>
                            <p className="text-[10px] text-slate-400">Age: {st.age || 16} &bull; Sponsor: {st.sponsor || 'Self'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-200">
                        <span className="font-bold">{st.formClass}</span>
                        <span className="text-[10px] text-slate-400 block">{st.arm || 'Science'}</span>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-300">{st.house || 'Dalet'}</td>
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-emerald-400">
                          {st.studentNo === '2413' ? '85.00%' : '78.50%'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Rank {st.positionInClass || 1} of {st.noInClass || 68}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedStudent(st);
                              setActiveTab('scores');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer"
                            title="Edit Continuous Assessment Marks"
                          >
                            <i className="fas fa-edit mr-1"></i> Marks
                          </button>
                          <button
                            onClick={() => {
                              setSelectedStudent(st);
                              setActiveTab('dossier');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] cursor-pointer"
                            title="View Official Terminal Dossier"
                          >
                            <i className="fas fa-file-alt mr-1"></i> Dossier
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: MARKS & CAT ENTRY */}
        {activeTab === 'scores' && (
          <div className="space-y-6 animate-fade-in text-left">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-black text-white">Results & Continuous Assessment Entry</h3>
                  <p className="text-xs text-slate-400">
                    Entering marks for: <strong className="text-white uppercase">{selectedStudent.lastName}, {selectedStudent.firstName}</strong> (Adm No: {selectedStudent.studentNo} &bull; Class: {selectedStudent.formClass})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Session: {selectedStudent.session || '2020/21'} &bull; Term: {selectedStudent.term || 'SECOND'}</span>
                  <button
                    onClick={() => setActiveTab('dossier')}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    <i className="fas fa-eye mr-1"></i> Preview Dossier
                  </button>
                </div>
              </div>

              {scoreSaveNotification && (
                <div className="alert-custom alert-success-custom mb-4 flex items-center gap-2 animate-fadeIn">
                  <i className="fas fa-check-circle text-green-700"></i>
                  <span>{scoreSaveNotification}</span>
                </div>
              )}

              {/* Form to update a specific subject */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-1 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <h4 className="text-sm font-bold text-white mb-2">Select Subject to Edit</h4>
                  <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                    {subjectsData.map((subj, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setEditingSubjectIndex(idx);
                          setInputCat1(subj.cat1);
                          setInputCat2(subj.cat2);
                          setInputCat3(subj.cat3);
                          setInputCat4(subj.cat4);
                          setInputExam(subj.examMarks);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex justify-between items-center ${
                          editingSubjectIndex === idx
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate">{subj.sNo}. {subj.subject}</span>
                        <span className="font-mono">{subj.termTotal}/100</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-2 bg-slate-950 p-5 rounded-xl border border-slate-800">
                  <h4 className="text-sm font-bold text-emerald-400 mb-1">
                    Editing Scores: {subjectsData[editingSubjectIndex]?.subject}
                  </h4>
                  <p className="text-[11px] text-slate-400 mb-4">
                    Formula: <strong className="text-white">Total = 1st CAT (10) + 2nd CAT (10) + 3rd CAT (10) + 4th CAT (10) + Exam (60)</strong>
                  </p>

                  <form onSubmit={handleSaveMarks} className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 block mb-1">1st CAT (Max 10)</label>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          value={inputCat1}
                          onChange={(e) => setInputCat1(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono font-bold"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 block mb-1">2nd CAT (Max 10)</label>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          value={inputCat2}
                          onChange={(e) => setInputCat2(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono font-bold"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 block mb-1">3rd CAT (Max 10)</label>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          value={inputCat3}
                          onChange={(e) => setInputCat3(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono font-bold"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 block mb-1">4th CAT (Max 10)</label>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          value={inputCat4}
                          onChange={(e) => setInputCat4(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 block mb-1">Exam Marks (Max 60)</label>
                        <input
                          type="number"
                          min={0}
                          max={60}
                          value={inputExam}
                          onChange={(e) => setInputExam(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono font-bold"
                          required
                        />
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-bold">Auto CAT Total (40)</span>
                        <span className="text-base font-black text-cyan-400 font-mono">
                          {Number(inputCat1) + Number(inputCat2) + Number(inputCat3) + Number(inputCat4)} / 40
                        </span>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-bold">Calculated Term Total (100)</span>
                        <span className="text-base font-black text-emerald-400 font-mono">
                          {Number(inputCat1) + Number(inputCat2) + Number(inputCat3) + Number(inputCat4) + Number(inputExam)} / 100
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-emerald-600/20"
                    >
                      <i className="fas fa-save"></i> Save Marks & Recalculate BroadSheet
                    </button>
                  </form>
                </div>
              </div>

              {/* All Subjects Overview Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-800">
                  <thead className="bg-slate-950 text-slate-300 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">S/No.</th>
                      <th className="py-2.5 px-3">Subject</th>
                      <th className="py-2.5 px-2 text-center">1st (10)</th>
                      <th className="py-2.5 px-2 text-center">2nd (10)</th>
                      <th className="py-2.5 px-2 text-center">3rd (10)</th>
                      <th className="py-2.5 px-2 text-center">4th (10)</th>
                      <th className="py-2.5 px-2 text-center font-bold text-cyan-300">CAT (40)</th>
                      <th className="py-2.5 px-2 text-center font-bold text-orange-300">Exam (60)</th>
                      <th className="py-2.5 px-2 text-center font-bold text-emerald-300">Total (100)</th>
                      <th className="py-2.5 px-2 text-center">Grade</th>
                      <th className="py-2.5 px-3">Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {subjectsData.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2 px-3 text-slate-500 font-mono">{s.sNo}</td>
                        <td className="py-2 px-3 font-bold text-white uppercase">{s.subject}</td>
                        <td className="py-2 px-2 text-center font-mono">{s.cat1}</td>
                        <td className="py-2 px-2 text-center font-mono">{s.cat2}</td>
                        <td className="py-2 px-2 text-center font-mono">{s.cat3}</td>
                        <td className="py-2 px-2 text-center font-mono">{s.cat4}</td>
                        <td className="py-2 px-2 text-center font-mono font-bold text-cyan-400">{s.catTotal}</td>
                        <td className="py-2 px-2 text-center font-mono font-bold text-orange-400">{s.examMarks}</td>
                        <td className="py-2 px-2 text-center font-mono font-bold text-emerald-400">{s.termTotal}</td>
                        <td className="py-2 px-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.grade === 'A1' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            s.grade === 'B2' || s.grade === 'B3' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                            'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {s.grade}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[11px] font-semibold text-slate-300">{s.remark}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MASTER BROADSHEET */}
        {activeTab === 'broadsheet' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg space-y-5 animate-fade-in text-left">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-black text-white">Class Master Broadsheet: SSS 1B</h3>
                <p className="text-xs text-slate-400">
                  Comprehensive performance broadsheet &bull; Session: 2020/21 &bull; Second Term &bull; Form Candidates: 68
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportBroadsheetCSV}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <i className="fas fa-file-csv"></i> Export Broadsheet (CSV)
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <i className="fas fa-print"></i> Print Broadsheet
                </button>
              </div>
            </div>

            {/* Broadsheet Matrix */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border border-slate-800">
                <thead className="bg-slate-950 text-slate-300 font-bold uppercase text-[9px] border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-2 border-r border-slate-800">Adm No</th>
                    <th className="py-2 px-2 border-r border-slate-800">Candidate Name</th>
                    {subjectsData.map((s, idx) => (
                      <th key={idx} className="py-2 px-1 text-center border-r border-slate-800" title={s.subject}>
                        {s.subject.substring(0, 4)}
                      </th>
                    ))}
                    <th className="py-2 px-2 text-center border-r border-slate-800">Total</th>
                    <th className="py-2 px-2 text-center border-r border-slate-800">Avg %</th>
                    <th className="py-2 px-2 text-center border-r border-slate-800">Rank</th>
                    <th className="py-2 px-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {MOCK_STUDENTS.map((st, i) => (
                    <tr key={st.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2 px-2 font-mono font-bold text-emerald-400 border-r border-slate-800">{st.studentNo}</td>
                      <td className="py-2 px-2 font-bold text-white uppercase border-r border-slate-800 whitespace-nowrap">
                        {st.lastName}, {st.firstName}
                      </td>
                      {subjectsData.map((s, idx) => {
                        const score = st.studentNo === '2413' ? s.termTotal : Math.max(50, s.termTotal - (i * 3));
                        return (
                          <td key={idx} className="py-2 px-1 text-center font-mono border-r border-slate-800">
                            {score}
                          </td>
                        );
                      })}
                      <td className="py-2 px-2 text-center font-mono font-bold text-emerald-400 border-r border-slate-800">
                        {st.studentNo === '2413' ? totalMarksSum : totalMarksSum - (i * 24)}
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-bold border-r border-slate-800">
                        {st.studentNo === '2413' ? averagePercentage : (Number(averagePercentage) - (i * 2.2)).toFixed(2)}%
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-slate-200 border-r border-slate-800">
                        {i + 1}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          PASSED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: AUTHENTIC NIGERIAN DEFENCE ACADEMY CONTINUOUS ASSESSMENT DOSSIER */}
        {activeTab === 'dossier' && (
          <div className="space-y-6 animate-fade-in text-left">
            <div className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div>
                <h4 className="font-black text-white text-base">Continuous Assessment Dossier</h4>
                <p className="text-xs text-slate-400">Official Terminal Report card for Nigerian Defence Academy Staff Secondary School</p>
              </div>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md"
              >
                <i className="fas fa-print"></i> Print Terminal Dossier
              </button>
            </div>

            {/* Exactly matching uploaded report sheet image */}
            <div className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-300 max-w-4xl mx-auto">
              {/* Header section matching exact format */}
              <div className="border-b-2 border-slate-900 pb-2 mb-3 text-center">
                <div className="flex items-center justify-between gap-3">
                  <div className="w-20 h-20 overflow-hidden p-1 flex items-center justify-center">
                    <img src="/assets/img/nda-logo.png" alt="NDA Logo" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl sm:text-2xl font-black tracking-wide text-slate-900 uppercase">
                      NIGERIAN DEFENCE ACADEMY
                    </h2>
                    <h3 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-widest mt-0.5">
                      STAFF SECONDARY SCHOOL
                    </h3>
                    <p className="text-xs font-semibold text-slate-700 uppercase tracking-widest">
                      P.M.B. 2109, KADUNA
                    </p>
                    <h4 className="text-base font-black text-white uppercase mt-1 bg-slate-900 py-0.5 tracking-wider">
                      TERMINAL REPORT
                    </h4>
                  </div>
                  <div className="w-20 h-24 border-2 border-slate-400 flex items-center justify-center p-0.5 bg-slate-50">
                    <img
                      src={selectedStudent.avatarUrl}
                      alt="Candidate"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <h5 className="text-xs sm:text-sm font-black text-slate-900 uppercase mt-2 mb-1.5 underline tracking-wider">
                  CONTINUOUS ASSESSMENT DOSSIER
                </h5>

                {/* Candidate Bio-data Grid matching exact image */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1 mt-1 text-left text-[11px] font-bold uppercase text-slate-900">
                  <div>NAME: <strong>{selectedStudent.lastName}, {selectedStudent.firstName}</strong></div>
                  <div>ADM NO: <strong>{selectedStudent.studentNo}</strong></div>
                  <div>CLASS: <strong>{selectedStudent.formClass}</strong></div>
                  <div>SPONSOR: <strong>{selectedStudent.sponsor || 'Alhaji M. Abdullahi'}</strong></div>
                  <div>HOUSE: <strong>{selectedStudent.house || 'Dalet'}</strong></div>
                  <div>SESSION: <strong>{selectedStudent.session || '2020/21'}</strong></div>
                  <div>TERM: <strong>{selectedStudent.term || 'SECOND'}</strong></div>
                  <div>AGE: <strong>{selectedStudent.age || 16}</strong></div>
                  <div>CLASS AVERAGE AGE: <strong>{selectedStudent.classAverageAge || 15}</strong></div>
                  <div>NUMBER OF TIMES SCHOOL OPENED: <strong>{selectedStudent.timesOpened || 94}</strong></div>
                  <div>TIMES PRESENT: <strong>{selectedStudent.timesPresent || 94}</strong></div>
                  <div>TIMES ABSENT: <strong>{selectedStudent.timesAbsent || 0}</strong></div>
                  <div>NO IN CLASS: <strong>{selectedStudent.noInClass || 68}</strong></div>
                  <div>POSITION IN CLASS: <strong>{selectedStudent.positionInClass || 1}</strong></div>
                  <div>NO IN FORM: <strong>{selectedStudent.noInForm || 170}</strong></div>
                  <div>POSITION IN FORM: <strong>{selectedStudent.positionInForm || 1}</strong></div>
                  <div>NO OF CREDITS & ABOVE: <strong>{creditsAndAboveCount}</strong></div>
                  <div>NO OF PASSES: <strong>0</strong></div>
                  <div>NO OF FAILURES: <strong>0</strong></div>
                </div>
              </div>

              {/* Exact Subject continuous assessment table */}
              <div className="mb-3 overflow-x-auto">
                <table className="w-full text-left text-[10px] border-collapse border border-slate-900">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-black border-b border-slate-900">
                      <th className="py-1 px-1 border-r border-slate-900 text-center" rowSpan={2}>S/No.</th>
                      <th className="py-1 px-2 border-r border-slate-900" rowSpan={2}>CORE SUBJECTS</th>
                      <th className="py-1 px-1 border-r border-slate-900 text-center">1st CAT</th>
                      <th className="py-1 px-1 border-r border-slate-900 text-center">2nd CAT</th>
                      <th className="py-1 px-1 border-r border-slate-900 text-center">3rd CAT</th>
                      <th className="py-1 px-1 border-r border-slate-900 text-center">4th CAT</th>
                      <th className="py-1 px-1 border-r border-slate-900 text-center">CAT Total</th>
                      <th className="py-1 px-1 border-r border-slate-900 text-center">Exam Marks</th>
                      <th className="py-1 px-1 border-r border-slate-900 text-center">Term Total</th>
                      <th className="py-1 px-1 border-r border-slate-900 text-center">Class Average</th>
                      <th className="py-1 px-1 border-r border-slate-900 text-center">Form Average</th>
                      <th className="py-1 px-1 border-r border-slate-900 text-center">Grade</th>
                      <th className="py-1 px-1 border-r border-slate-900 text-center">Position in Class</th>
                      <th className="py-1 px-1 border-r border-slate-900 text-center">Position in Form</th>
                      <th className="py-1 px-2 text-center">REMARK</th>
                    </tr>
                    <tr className="bg-slate-100 text-slate-900 font-black border-b border-slate-900">
                      <th className="py-0.5 px-1 border-r border-slate-900 text-center">10</th>
                      <th className="py-0.5 px-1 border-r border-slate-900 text-center">10</th>
                      <th className="py-0.5 px-1 border-r border-slate-900 text-center">10</th>
                      <th className="py-0.5 px-1 border-r border-slate-900 text-center">10</th>
                      <th className="py-0.5 px-1 border-r border-slate-900 text-center">40</th>
                      <th className="py-0.5 px-1 border-r border-slate-900 text-center">60</th>
                      <th className="py-0.5 px-1 border-r border-slate-900 text-center">100</th>
                      <th className="py-0.5 px-1 border-r border-slate-900 text-center">100</th>
                      <th className="py-0.5 px-1 border-r border-slate-900 text-center">100</th>
                      <th className="py-0.5 px-1 border-r border-slate-900 text-center"></th>
                      <th className="py-0.5 px-1 border-r border-slate-900 text-center"></th>
                      <th className="py-0.5 px-1 border-r border-slate-900 text-center"></th>
                      <th className="py-0.5 px-2 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {subjectsData.map((s, idx) => (
                      <tr key={idx} className="font-semibold text-slate-900">
                        <td className="py-1 px-1 border-r border-slate-900 text-center font-mono">{idx + 1}</td>
                        <td className="py-1 px-2 border-r border-slate-900 uppercase">{s.subject}</td>
                        <td className="py-1 px-1 border-r border-slate-900 text-center font-mono">{s.cat1}</td>
                        <td className="py-1 px-1 border-r border-slate-900 text-center font-mono">{s.cat2}</td>
                        <td className="py-1 px-1 border-r border-slate-900 text-center font-mono">{s.cat3}</td>
                        <td className="py-1 px-1 border-r border-slate-900 text-center font-mono">{s.cat4}</td>
                        <td className="py-1 px-1 border-r border-slate-900 text-center font-mono font-bold">{s.catTotal}</td>
                        <td className="py-1 px-1 border-r border-slate-900 text-center font-mono font-bold">{s.examMarks}</td>
                        <td className="py-1 px-1 border-r border-slate-900 text-center font-mono font-bold">{s.termTotal}</td>
                        <td className="py-1 px-1 border-r border-slate-900 text-center font-mono">{s.classAverage}</td>
                        <td className="py-1 px-1 border-r border-slate-900 text-center font-mono">{s.formAverage}</td>
                        <td className="py-1 px-1 border-r border-slate-900 text-center font-bold">{s.grade}</td>
                        <td className="py-1 px-1 border-r border-slate-900 text-center font-mono">{s.posInClass}</td>
                        <td className="py-1 px-1 border-r border-slate-900 text-center font-mono">{s.posInForm}</td>
                        <td className="py-1 px-2 text-center font-bold text-[9px]">{s.remark}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t border-slate-900 text-[10px]">
                    <tr>
                      <td colSpan={2} className="py-1 px-2 border-r border-slate-900">
                        Total Marks: <strong>{totalMarksSum}</strong>
                      </td>
                      <td colSpan={4} className="py-1 px-2 border-r border-slate-900">
                        Scores Average: <strong>{averagePercentage}%</strong>
                      </td>
                      <td colSpan={4} className="py-1 px-2 border-r border-slate-900">
                        Class Highest Average: <strong>85.00%</strong>
                      </td>
                      <td colSpan={5} className="py-1 px-2">
                        Form Highest Average: <strong>85.00%</strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Character Development Rating Table matching exact image */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[10px] mb-3">
                <div className="md:col-span-2">
                  <table className="w-full border-collapse border border-slate-900">
                    <thead>
                      <tr className="bg-slate-100 font-black border-b border-slate-900">
                        <th className="p-1 border-r border-slate-900 text-left">CHARACTER DEVELOPMENT</th>
                        <th className="p-1 border-r border-slate-900 text-center w-8">A</th>
                        <th className="p-1 border-r border-slate-900 text-center w-8">B</th>
                        <th className="p-1 border-r border-slate-900 text-center w-8">C</th>
                        <th className="p-1 text-center w-8">D</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {[
                        { trait: 'Punctuality', grade: 'B' },
                        { trait: 'Carrying out Assignment', grade: 'B' },
                        { trait: 'Participation in Social Activities', grade: 'B' },
                        { trait: 'Neatness', grade: 'B' },
                        { trait: 'Honesty', grade: 'B' },
                        { trait: 'Self Control', grade: 'B' },
                        { trait: 'Relationship with Other', grade: 'B' },
                        { trait: 'Games, Sports', grade: 'B' },
                        { trait: 'Attitude to Study', grade: 'B' }
                      ].map((item, i) => (
                        <tr key={i}>
                          <td className="p-1 border-r border-slate-900 font-semibold">{item.trait}</td>
                          <td className="p-1 border-r border-slate-900 text-center font-bold">{item.grade === 'A' ? 'X' : ''}</td>
                          <td className="p-1 border-r border-slate-900 text-center font-bold">{item.grade === 'B' ? 'X' : ''}</td>
                          <td className="p-1 border-r border-slate-900 text-center font-bold">{item.grade === 'C' ? 'X' : ''}</td>
                          <td className="p-1 text-center font-bold">{item.grade === 'D' ? 'X' : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border border-slate-900 p-2 text-[10px] flex flex-col justify-between">
                  <div>
                    <strong className="block text-slate-900 uppercase font-black mb-1 border-b pb-1">
                      KEYS TO CHARACTER DEVELOPMENT RATING
                    </strong>
                    <p className="font-bold my-1">A - Excellent</p>
                    <p className="font-bold my-1">B - Good</p>
                    <p className="font-bold my-1">C - Fair</p>
                    <p className="font-bold my-1">D - Poor</p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-300 text-[9px]">
                    <strong>Fee Owing:</strong> Nil (Fully Settled)
                  </div>
                </div>
              </div>

              {/* Form Master & Principal Remarks matching exact image */}
              <div className="border-t border-slate-900 pt-2 space-y-2 text-xs font-bold uppercase">
                <div className="flex justify-between items-center">
                  <div>Form Master's Remark: <span className="font-normal italic normal-case">A quiet and intelligent student.</span></div>
                  <div>Signature: <span className="font-serif italic normal-case">H. Danjuma</span></div>
                </div>

                <div className="flex justify-between items-center">
                  <div>Principal's Remark: <span className="font-normal italic normal-case">An excellent performance.</span></div>
                  <div>Signature: <span className="font-serif italic normal-case">Principal (NDA SSS)</span></div>
                </div>

                <div className="pt-1 border-t border-slate-300 flex justify-between text-[11px]">
                  <span>Next Term Begins on: <strong>Monday 26 July, 2021</strong></span>
                  <span className="text-emerald-800">[OFFICIAL VERIFIED STAMP]</span>
                </div>
              </div>

              {/* Keys to Grades Scale footer */}
              <div className="mt-3 pt-2 border-t border-slate-900 text-[9px]">
                <strong className="block font-black mb-1">KEYS TO GRADES:</strong>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 font-mono">
                  <span>75-100: A1 EXCELLENT</span>
                  <span>70-74: B2 VERY GOOD</span>
                  <span>65-69: B3 GOOD</span>
                  <span>60-64: C4 CREDIT</span>
                  <span>55-59: C5 CREDIT</span>
                  <span>50-54: C6 CREDIT</span>
                  <span>45-49: D7 PASS</span>
                  <span>40-44: D8 PASS</span>
                  <span>0-39: F9 FAIL</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: TIMETABLE & HALL ALLOCATIONS */}
        {activeTab === 'timetable' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg space-y-5 animate-fade-in text-left">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-white">Examination Timetable & Invigilator Assignments</h3>
                <p className="text-xs text-slate-400">Scheduled continuous assessment and terminal examination sessions</p>
              </div>
              <button
                onClick={() => {
                  const newEntry: ExamTimetableEntry = {
                    id: `tt-${Date.now()}`,
                    subject: 'AGRICULTURAL SCIENCE',
                    class: 'SSS 1 (All Arms)',
                    date: '2026-10-22',
                    time: '09:00 AM - 11:00 AM',
                    room: 'Agricultural Workshop',
                    invigilator: 'Mr. S. Bala',
                    candidatesCount: 68,
                    status: 'Scheduled'
                  };
                  setTimetableList([...timetableList, newEntry]);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <i className="fas fa-plus"></i> Add Timetable Session
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="py-3 px-3">Subject</th>
                    <th className="py-3 px-3">Class</th>
                    <th className="py-3 px-3">Date & Time</th>
                    <th className="py-3 px-3">Examination Room / Hall</th>
                    <th className="py-3 px-3">Appointed Invigilator</th>
                    <th className="py-3 px-3 text-center">Candidates</th>
                    <th className="py-3 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {timetableList.map((tt) => (
                    <tr key={tt.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-bold text-white uppercase">{tt.subject}</td>
                      <td className="py-3 px-3 text-slate-300 font-medium">{tt.class}</td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-emerald-400 block">{tt.date}</span>
                        <span className="text-[10px] text-slate-400">{tt.time}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-200">{tt.room}</td>
                      <td className="py-3 px-3 text-slate-300">{tt.invigilator}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-cyan-400">{tt.candidatesCount}</td>
                      <td className="py-3 px-3 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {tt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: IMMUTABLE AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg space-y-5 animate-fade-in text-left">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-white">Department Audit & Security Logs</h3>
                <p className="text-xs text-slate-400">
                  Cryptographically verified trail of examination marks entry, verification, and isolation enforcement
                </p>
              </div>
              <span className="text-xs font-mono bg-slate-950 border border-slate-800 px-3 py-1 rounded-lg text-emerald-400">
                Audit Active &bull; Scope: Department Level
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">User & Role</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Target Record</th>
                    <th className="py-2.5 px-3">Reason / Details</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {auditList.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{log.timestamp}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-white block">{log.user}</span>
                        <span className="text-[10px] text-slate-400">{log.role}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-xs text-cyan-400">{log.action}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-300 text-[11px]">{log.recordTable} ({log.recordId})</td>
                      <td className="py-2.5 px-3 text-slate-300 text-xs max-w-xs">{log.reason}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : log.status === 'DENIED'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-3 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; Nigerian Defence Academy Staff Secondary School Kaduna &bull; Examination System</span>
          <span className="text-slate-400">
            Authorization: <strong className="text-emerald-400">Level 2 (Examination Department Scope)</strong>
          </span>
        </div>
      </footer>
    </div>
  );
};

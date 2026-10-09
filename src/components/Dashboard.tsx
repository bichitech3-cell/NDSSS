import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { DEMO_SCHOOLS, MOCK_STUDENTS, MOCK_FEES, MOCK_ANNOUNCEMENTS, FATIMA_SUBJECTS } from '../data/mockData';
import { UserRole, Student, FeeTransaction, Announcement } from '../types';
import { AddStudentModal } from './AddStudentModal';
import { DepartmentAuthorizationView } from './DepartmentAuthorizationView';
import { SYSTEM_USERS, UserAccount } from '../services/securityService';
import {
  downloadStudentWordDoc,
  downloadBulkCombinedWordDoc,
  downloadBulkZipArchive,
  printSingleReportSheet,
  printBulkReportSheets,
  getStudentSubjectsData
} from '../services/reportSheetExportService';

interface DashboardProps {
  role: UserRole;
  username: string;
  onLogout: () => void;
  onOpenExamOfficer?: () => void;
  onOpenBursar?: () => void;
  onOpenPta?: () => void;
  onOpenRbac?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  role,
  username,
  onLogout,
  onOpenExamOfficer,
  onOpenBursar,
  onOpenPta,
  onOpenRbac
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'fees' | 'exams' | 'attendance' | 'broadcast' | 'rbac'>('overview');
  const [selectedSchool, setSelectedSchool] = useState(DEMO_SCHOOLS[0].code);
  const [searchStudent, setSearchStudent] = useState('');
  const [selectedForm, setSelectedForm] = useState('All');
  const [studentsList, setStudentsList] = useState<Student[]>(MOCK_STUDENTS);
  const [feesList, setFeesList] = useState<FeeTransaction[]>(MOCK_FEES);
  const [announcementsList, setAnnouncementsList] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);

  // Modal states
  const [viewingReportCardStudent, setViewingReportCardStudent] = useState<Student | null>(MOCK_STUDENTS[0]);
  const [viewingReceipt, setViewingReceipt] = useState<FeeTransaction | null>(null);
  const [exportNotification, setExportNotification] = useState<string | null>(null);
  
  // Payment recording state
  const [paymentStudentId, setPaymentStudentId] = useState(MOCK_STUDENTS[1].id);
  const [paymentAmount, setPaymentAmount] = useState('65000');
  const [paymentMethod, setPaymentMethod] = useState<'Airtel Money' | 'TNM Mpamba' | 'Bank Deposit (National Bank)' | 'Cash'>('Airtel Money');
  const [paymentPurpose, setPaymentPurpose] = useState<'Tuition Fee' | 'Boarding Fee' | 'Exam Fee'>('Tuition Fee');

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastChannel, setBroadcastChannel] = useState<'WhatsApp' | 'SMS'>('WhatsApp');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Attendance states
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'Present' | 'Late' | 'Absent'>>({
    'stu-1': 'Present',
    'stu-2': 'Present',
    'stu-3': 'Late',
    'stu-4': 'Present',
    'stu-5': 'Present'
  });

  const currentSchool = DEMO_SCHOOLS.find((s) => s.code === selectedSchool) || DEMO_SCHOOLS[0];

  const filteredStudents = studentsList.filter((s) => {
    const matchesSearch =
      s.firstName.toLowerCase().includes(searchStudent.toLowerCase()) ||
      s.lastName.toLowerCase().includes(searchStudent.toLowerCase()) ||
      s.studentNo.toLowerCase().includes(searchStudent.toLowerCase());
    const matchesForm = selectedForm === 'All' || s.formClass.includes(selectedForm);
    return matchesSearch && matchesForm;
  });

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const student = studentsList.find((s) => s.id === paymentStudentId);
    if (!student) return;

    const amt = parseFloat(paymentAmount) || 0;
    const newTx: FeeTransaction = {
      id: `tx-${Date.now()}`,
      receiptNo: `REC-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      formClass: student.formClass,
      amount: amt,
      paymentMethod,
      date: new Date().toISOString().split('T')[0],
      recordedBy: username || 'Admin Officer',
      purpose: paymentPurpose
    };

    setFeesList([newTx, ...feesList]);
    setStudentsList(
      studentsList.map((s) =>
        s.id === student.id
          ? { ...s, feeBalance: Math.max(0, s.feeBalance - amt) }
          : s
      )
    );
    setViewingReceipt(newTx);
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;

    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title: broadcastTitle,
      message: broadcastMessage,
      recipientGroup: 'Parents',
      timestamp: 'Just now',
      sentVia: broadcastChannel
    };

    setAnnouncementsList([newAnn, ...announcementsList]);
    setBroadcastTitle('');
    setBroadcastMessage('');
    setBroadcastSuccess(true);
    setTimeout(() => setBroadcastSuccess(false), 4000);
  };

  const handleAddStudent = (studentData: Omit<Student, 'id'>) => {
    const newStudent: Student = { ...studentData, id: 'stu-' + Date.now() };
    setStudentsList([...studentsList, newStudent]);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-700/40 flex items-center justify-center shadow-lg overflow-hidden p-1">
                <img src="/assets/img/nda-logo.png" alt="NDA Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-red-500 tracking-wider text-base" style={{ color: '#ff2222' }}>NDASSS</span>
                  <span className="text-xs bg-red-500/20 text-red-400 font-bold px-1.5 py-0.5 rounded border border-red-500/30">
                    PORTAL
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium truncate max-w-[200px] sm:max-w-xs">
                  {currentSchool.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden md:flex items-center gap-2 text-xs text-slate-300 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5">
                <i className="fas fa-calendar-alt text-orange-400"></i>
                <span className="font-semibold">Term 2 &bull; 2026/2027</span>
              </div>

              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="hidden lg:block text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-orange-500"
              >
                {DEMO_SCHOOLS.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-white leading-tight capitalize">{username || 'Administrator'}</p>
                  <p className="text-[10px] text-orange-400 font-semibold uppercase tracking-wider">{role}</p>
                </div>
                <button
                  onClick={onLogout}
                  title="Logout and return to reference login screen"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-red-200 text-xs font-bold transition-all cursor-pointer"
                >
                  <i className="fas fa-sign-out-alt"></i>
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Sub-navigation */}
        <div className="bg-slate-900/90 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto flex space-x-1 sm:space-x-2 py-2">
            {[
              { id: 'overview', label: 'Dashboard', icon: 'fa-tachometer-alt' },
              { id: 'students', label: 'Students Directory', icon: 'fa-user-graduate' },
              { id: 'fees', label: 'Fees & Accounts', icon: 'fa-money-bill-wave' },
              { id: 'exams', label: 'Terminal Reports', icon: 'fa-award' },
              { id: 'attendance', label: 'Attendance Roll', icon: 'fa-clipboard-check' },
              { id: 'broadcast', label: 'WhatsApp & SMS', icon: 'fa-paper-plane' },
              { id: 'rbac', label: 'Department RBAC & Security', icon: 'fa-shield-alt' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <i className={`fas ${tab.icon}`}></i>
                <span>{tab.label}</span>
              </button>
            ))}
            {onOpenExamOfficer && (
              <button
                onClick={onOpenExamOfficer}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 shadow-sm transition-all cursor-pointer"
                title="Open Dedicated Examination Officer Module"
              >
                <i className="fas fa-file-alt text-emerald-400"></i>
                <span>Exam Officer</span>
              </button>
            )}
            {onOpenBursar && (
              <button
                onClick={onOpenBursar}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-300 shadow-sm transition-all cursor-pointer"
                title="Open School Bursary & Treasury Module"
              >
                <i className="fas fa-university text-amber-400"></i>
                <span>Bursar Portal</span>
              </button>
            )}
            {onOpenPta && (
              <button
                onClick={onOpenPta}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap bg-teal-950/80 hover:bg-teal-900 border border-teal-500/40 text-teal-300 shadow-sm transition-all cursor-pointer"
                title="Open PTA Financial Secretary Module"
              >
                <i className="fas fa-hand-holding-usd text-teal-400"></i>
                <span>PTA Fin Sec</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Enrolled</p>
                    <h3 className="text-2xl font-black text-white mt-1">1,420</h3>
                    <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                      <i className="fas fa-arrow-up mr-1"></i> +8.4% this academic term
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xl">
                    <i className="fas fa-user-graduate"></i>
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-slate-400 border-t border-slate-700/60 pt-2 flex justify-between">
                  <span>MDFSS Boys: 780</span>
                  <span>MDFSS Girls: 640</span>
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Term Fees Collected</p>
                    <h3 className="text-2xl font-black text-white mt-1">MK 84.2M</h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center text-xl">
                    <i className="fas fa-wallet"></i>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1">
                    <span>Target: MK 94.4M</span>
                    <span>89.2%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: '89.2%' }}></div>
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-slate-400 border-t border-slate-700/60 pt-2 flex justify-between">
                  <span>Outstanding: MK 10.2M</span>
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg. Attendance</p>
                    <h3 className="text-2xl font-black text-white mt-1">96.8%</h3>
                  </div>
                  <div className="h-16 w-16">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[{ name: 'Attended', value: 96.8 }, { name: 'Absent', value: 3.2 }]}
                          innerRadius={20}
                          outerRadius={28}
                          startAngle={90}
                          endAngle={-270}
                          dataKey="value"
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#1e293b" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-slate-400 border-t border-slate-700/60 pt-2 flex justify-between">
                  <span>Present: 1,374</span>
                  <span>Excused: 32</span>
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Faculty & Staff</p>
                    <h3 className="text-2xl font-black text-white mt-1">48</h3>
                    <p className="text-[11px] text-cyan-400 font-semibold mt-1">
                      <i className="fas fa-chalkboard-teacher mr-1"></i> All departments active
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-xl">
                    <i className="fas fa-users-cog"></i>
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-slate-400 border-t border-slate-700/60 pt-2 flex justify-between">
                  <span>Teaching: 36</span>
                  <span>Administrative: 12</span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Notification highlights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Fee Payments */}
              <div className="lg:col-span-2 bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="font-black text-white text-base">Recent Fee Payments & Receipts</h4>
                    <p className="text-xs text-slate-400">Direct Airtel Money, TNM Mpamba, and National Bank deposits</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('fees')}
                    className="text-xs text-orange-400 font-bold hover:underline cursor-pointer"
                  >
                    View All &rarr;
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-700/80 text-slate-400 uppercase text-[10px]">
                        <th className="py-2.5 px-3">Receipt #</th>
                        <th className="py-2.5 px-3">Student</th>
                        <th className="py-2.5 px-3">Class</th>
                        <th className="py-2.5 px-3">Method</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/40">
                      {feesList.slice(0, 4).map((f) => (
                        <tr key={f.id} className="hover:bg-slate-700/30 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-orange-400">{f.receiptNo}</td>
                          <td className="py-2.5 px-3 font-medium text-white">{f.studentName}</td>
                          <td className="py-2.5 px-3 text-slate-300">{f.formClass}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-700 text-slate-300">
                              {f.paymentMethod}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-emerald-400">
                            MK {f.amount.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => setViewingReceipt(f)}
                              className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white font-bold text-[11px] cursor-pointer"
                            >
                              <i className="fas fa-print mr-1"></i> Print
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* System Announcements */}
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-black text-white text-base">Portal Notices</h4>
                    <span className="text-[11px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                      Live FSMS
                    </span>
                  </div>
                  <div className="space-y-3">
                    {announcementsList.map((ann) => (
                      <div key={ann.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 text-left">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-orange-400">{ann.title}</span>
                          <span className="text-slate-500">{ann.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{ann.message}</p>
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400">
                          <i className={`fab ${ann.sentVia === 'WhatsApp' ? 'fa-whatsapp text-green-400' : 'fa-sms text-blue-400'}`}></i>
                          <span>Dispatched via {ann.sentVia} to {ann.recipientGroup}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('broadcast')}
                  className="mt-4 w-full py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <i className="fas fa-paper-plane"></i>
                  Send Parent Notification
                </button>
              </div>
            </div>

            {/* Academic Performance Chart Section */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-lg">
              <h4 className="font-black text-white text-base mb-4">Academic Performance Trends</h4>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    { term: 'Term 1', Mathematics: 75, English: 80, Science: 70 },
                    { term: 'Term 2', Mathematics: 82, English: 78, Science: 75 },
                    { term: 'Term 3', Mathematics: 85, English: 85, Science: 80 },
                    { term: 'Term 1', Mathematics: 80, English: 82, Science: 82 },
                    { term: 'Term 2', Mathematics: 90, English: 88, Science: 85 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="term" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px', color: '#fff' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="Mathematics" stroke="#f97316" strokeWidth={3} dot={{ fill: '#f97316', r: 5 }} />
                    <Line type="monotone" dataKey="English" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 5 }} />
                    <Line type="monotone" dataKey="Science" stroke="#0ea5e9" strokeWidth={3} dot={{ fill: '#0ea5e9', r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STUDENTS DIRECTORY */}
        {activeTab === 'students' && (
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 sm:p-6 shadow-lg space-y-5 animate-fade-in text-left">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-black text-white">Student Enrollment & Bio-Data</h3>
                <p className="text-xs text-slate-400">Manage student records, stream allocations, guardian contacts, and recovery PINs</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    const headers = ['First Name', 'Last Name', 'Admission No', 'Class', 'Guardian', 'Phone'];
                    const csvContent = [
                      headers.join(','),
                      ...studentsList.map(s => [s.firstName, s.lastName, s.studentNo, s.formClass, s.guardianName, s.guardianPhone].join(','))
                    ].join('\n');
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'students_list.csv';
                    a.click();
                  }}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <i className="fas fa-file-csv"></i> Export CSV
                </button>
                <button
                  onClick={() => setIsAddStudentModalOpen(true)}
                  className="px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <i className="fas fa-plus"></i> Add Student
                </button>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 outline-none focus:border-orange-500 flex-1 sm:w-64"
                />
                <select
                  value={selectedForm}
                  onChange={(e) => setSelectedForm(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                >
                  <option value="All">All Forms</option>
                  <option value="Form 1">Form 1</option>
                  <option value="Form 2">Form 2</option>
                  <option value="Form 3">Form 3</option>
                  <option value="Form 4">Form 4</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 uppercase text-[10px]">
                    <th className="py-3 px-3">Student Details</th>
                    <th className="py-3 px-3">Admission No</th>
                    <th className="py-3 px-3">Class & Stream</th>
                    <th className="py-3 px-3">Guardian & Phone</th>
                    <th className="py-3 px-3">Fee Status</th>
                    <th className="py-3 px-3">Portal PIN</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={s.avatarUrl}
                            alt={s.firstName}
                            className="w-9 h-9 rounded-full object-cover border border-slate-600"
                          />
                          <div>
                            <p className="font-bold text-white text-xs">{s.firstName} {s.lastName}</p>
                            <p className="text-[10px] text-slate-400">{s.gender} &bull; {s.status}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-orange-400">{s.studentNo}</td>
                      <td className="py-3 px-3 text-slate-200">
                        <p className="font-bold">{s.formClass}</p>
                        <p className="text-[10px] text-slate-400">{s.stream}</p>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        <p className="font-medium text-white">{s.guardianName}</p>
                        <p className="text-[10px] text-emerald-400">
                          <i className="fab fa-whatsapp mr-1"></i> {s.guardianPhone}
                        </p>
                      </td>
                      <td className="py-3 px-3">
                        {s.feeBalance === 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Fully Cleared
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Bal: MK {s.feeBalance.toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-300">
                        <span className="bg-slate-900 px-2 py-1 rounded border border-slate-700">
                          {s.pin}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setViewingReportCardStudent(s);
                              setActiveTab('exams');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-orange-600/80 hover:bg-orange-600 text-white font-bold text-[11px] cursor-pointer"
                            title="View Report Card"
                          >
                            <i className="fas fa-file-alt mr-1"></i> Report
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

        {/* TAB 3: FEES & ACCOUNTS */}
        {activeTab === 'fees' && (
          <div className="space-y-6 animate-fade-in text-left">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Payment recording form */}
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-lg">
                <h3 className="text-base font-black text-white mb-1">Record Tuition Fee Payment</h3>
                <p className="text-xs text-slate-400 mb-4">Accept payments via Airtel Money, TNM Mpamba, or Bank</p>

                <form onSubmit={handleRecordPayment} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Select Student</label>
                    <select
                      value={paymentStudentId}
                      onChange={(e) => setPaymentStudentId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                    >
                      {studentsList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.studentNo} - {s.firstName} {s.lastName} ({s.formClass} &bull; Bal: MK {s.feeBalance.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Amount (Malawi Kwacha - MWK)</label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500 font-mono font-bold"
                      placeholder="e.g. 65000"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                    >
                      <option value="Airtel Money">Airtel Money</option>
                      <option value="TNM Mpamba">TNM Mpamba</option>
                      <option value="Bank Deposit (National Bank)">Bank Deposit (National Bank of Malawi)</option>
                      <option value="Cash">Cash (Accounts Counter)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Fee Category / Purpose</label>
                    <select
                      value={paymentPurpose}
                      onChange={(e) => setPaymentPurpose(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                    >
                      <option value="Tuition Fee">Tuition Fee</option>
                      <option value="Boarding Fee">Boarding Fee</option>
                      <option value="Exam Fee">Exam Assessment Fee</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-receipt"></i>
                    Post Payment & Generate Official Receipt
                  </button>
                </form>
              </div>

              {/* Transactions Log */}
              <div className="lg:col-span-2 bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-lg">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-base font-black text-white">Reconciled Cash Book & Receipts</h3>
                  <span className="text-xs text-slate-400">{feesList.length} total transactions</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-700 text-slate-400 uppercase text-[10px]">
                        <th className="py-2.5 px-3">Receipt No</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Student</th>
                        <th className="py-2.5 px-3">Channel</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {feesList.map((f) => (
                        <tr key={f.id} className="hover:bg-slate-700/20 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-orange-400">{f.receiptNo}</td>
                          <td className="py-2.5 px-3 text-slate-400">{f.date}</td>
                          <td className="py-2.5 px-3 font-medium text-white">{f.studentName}</td>
                          <td className="py-2.5 px-3 text-slate-300">{f.paymentMethod}</td>
                          <td className="py-2.5 px-3 font-bold text-emerald-400">
                            MK {f.amount.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => setViewingReceipt(f)}
                              className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white font-bold text-[11px] cursor-pointer"
                            >
                              <i className="fas fa-print mr-1"></i> Print
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: EXAMINATION & REPORT CARDS */}
        {activeTab === 'exams' && (
          <div className="space-y-6 animate-fade-in text-left">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-lg">
              <div>
                <h3 className="text-lg font-black text-white">Terminal Assessment & MANEB Grading</h3>
                <p className="text-xs text-slate-400">Official Malawian Secondary School Student Report Card</p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-300 font-bold">Select Student:</label>
                <select
                  value={viewingReportCardStudent?.id || ''}
                  onChange={(e) => {
                    const st = studentsList.find((s) => s.id === e.target.value);
                    if (st) setViewingReportCardStudent(st);
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                >
                  {studentsList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.formClass})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Actions Bar for Word Export and Printing */}
            {viewingReportCardStudent && (
              <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3 no-print">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      const marks = getStudentSubjectsData(viewingReportCardStudent, FATIMA_SUBJECTS);
                      setExportNotification(`Downloading Microsoft Word report sheet for ${viewingReportCardStudent.firstName}...`);
                      downloadStudentWordDoc(viewingReportCardStudent, marks);
                      setTimeout(() => setExportNotification(null), 3000);
                    }}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md shadow-blue-600/20 transition-all"
                    title="Download current student's report sheet as Microsoft Word Document (.doc)"
                  >
                    <i className="fas fa-file-word text-sm text-blue-200"></i>
                    <span>Download Word (.doc)</span>
                  </button>
                  <button
                    onClick={() => {
                      setExportNotification(`Generating combined Word file for all ${studentsList.length} enrolled students...`);
                      downloadBulkCombinedWordDoc(studentsList, 'All Forms', 'Second Term');
                      setTimeout(() => setExportNotification(null), 3500);
                    }}
                    className="px-3.5 py-2 bg-blue-900/80 hover:bg-blue-800 border border-blue-700 text-blue-100 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-all"
                    title="Download all students in a combined Word document"
                  >
                    <i className="fas fa-layer-group text-sm text-blue-300"></i>
                    <span>Bulk Word (All Students)</span>
                  </button>
                  <button
                    onClick={async () => {
                      setExportNotification(`Packaging all ${studentsList.length} student report sheets into ZIP archive...`);
                      await downloadBulkZipArchive(studentsList, 'All Forms', 'Second Term');
                      setExportNotification(null);
                    }}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-all"
                    title="Download all student report sheets in a ZIP archive"
                  >
                    <i className="fas fa-file-archive text-sm text-amber-400"></i>
                    <span>Bulk ZIP Archive</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      const marks = getStudentSubjectsData(viewingReportCardStudent, FATIMA_SUBJECTS);
                      printSingleReportSheet(viewingReportCardStudent, marks);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 transition-all"
                    title="Print official report card on paper"
                  >
                    <i className="fas fa-print"></i>
                    <span>Print Report Card</span>
                  </button>
                  <button
                    onClick={() => printBulkReportSheets(studentsList)}
                    className="px-3.5 py-2 bg-teal-800 hover:bg-teal-700 border border-teal-600 text-teal-100 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-all"
                    title="Print all student report cards in bulk"
                  >
                    <i className="fas fa-copy"></i>
                    <span>Bulk Print All</span>
                  </button>
                </div>

                {exportNotification && (
                  <div className="w-full bg-emerald-950/80 border border-emerald-500/50 rounded-xl px-3.5 py-2 text-xs text-emerald-200 flex items-center justify-between animate-fadeIn mt-1">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-spinner fa-spin text-emerald-400"></i>
                      <span>{exportNotification}</span>
                    </div>
                    <button
                      onClick={() => setExportNotification(null)}
                      className="text-emerald-400 hover:text-white font-bold"
                    >
                      &times;
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Authentic Printable Secondary School Report Card */}
            {viewingReportCardStudent && (
              <div className="printable-dossier bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-200 max-w-4xl mx-auto">
                {/* Header */}
                <div className="border-b-2 border-slate-900 pb-2 mb-4 text-center">
                  <div className="flex items-center justify-between gap-4">
                    <div className="w-20 h-20 overflow-hidden p-1">
                      <img src="/assets/img/nda-logo.png" alt="NDA Logo" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl sm:text-2xl font-black tracking-wide text-slate-900 uppercase">
                        NIGERIAN DEFENCE ACADEMY
                      </h2>
                      <h3 className="text-base font-bold text-slate-800 uppercase tracking-widest mt-1">
                        STAFF SECONDARY SCHOOL
                      </h3>
                      <p className="text-xs font-semibold text-slate-700 uppercase tracking-widest mt-1">
                        P.M.B. 2109, KADUNA
                      </p>
                      <h4 className="text-lg font-black text-slate-900 uppercase mt-2 bg-slate-900 text-white py-1">
                        TERMINAL REPORT
                      </h4>
                    </div>
                    <div className="w-20 h-24 border-2 border-slate-400 flex items-center justify-center p-0.5 bg-slate-50">
                      <img
                        src={viewingReportCardStudent.avatarUrl}
                        alt="Student"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <h5 className="text-sm font-black text-slate-900 uppercase mt-3 mb-2 underline">
                    CONTINUOUS ASSESSMENT DOSSIER
                  </h5>

                  {/* Student Bio Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 mt-2 text-left text-xs font-bold uppercase text-slate-900">
                    <div>NAME: {viewingReportCardStudent.firstName} {viewingReportCardStudent.lastName}</div>
                    <div>ADM NO: {viewingReportCardStudent.studentNo}</div>
                    <div>CLASS: {viewingReportCardStudent.formClass}</div>
                    <div>SPONSOR: {viewingReportCardStudent.guardianName}</div>
                    <div>SESSION: 2026/2027</div>
                    <div>TERM: SECOND</div>
                    <div>AGE: 16</div>
                    <div>CLASS AVERAGE AGE: 15</div>
                    <div>NUMBER OF TIMES SCHOOL OPENED: 94</div>
                    <div>TIMES PRESENT: 92</div>
                    <div>TIMES ABSENT: 2</div>
                    <div>NO IN CLASS: 52</div>
                    <div>POSITION IN CLASS: 3</div>
                    <div>NO IN FORM: 150</div>
                    <div>POSITION IN FORM: 8</div>
                    <div>NO OF CREDITS & ABOVE: 11</div>
                    <div>NO OF PASSES: 0</div>
                    <div>NO OF FAILURES: 0</div>
                  </div>
                </div>

                {/* Subject Grades Table */}
                <div className="mb-4">
                  <table className="w-full text-left text-[10px] border-collapse border border-slate-900">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 font-black border-b border-slate-900">
                        <th className="py-1 px-2 border-r border-slate-900 text-center" rowSpan={2}>S/No.</th>
                        <th className="py-1 px-2 border-r border-slate-900" rowSpan={2}>CORE SUBJECTS</th>
                        <th className="py-1 px-2 border-r border-slate-900 text-center">1st CAT</th>
                        <th className="py-1 px-2 border-r border-slate-900 text-center">2nd CAT</th>
                        <th className="py-1 px-2 border-r border-slate-900 text-center">3rd CAT</th>
                        <th className="py-1 px-2 border-r border-slate-900 text-center">4th CAT</th>
                        <th className="py-1 px-2 border-r border-slate-900 text-center">CAT Total</th>
                        <th className="py-1 px-2 border-r border-slate-900 text-center">Exam Marks</th>
                        <th className="py-1 px-2 border-r border-slate-900 text-center">Term Total</th>
                        <th className="py-1 px-2 border-r border-slate-900 text-center">Class Average</th>
                        <th className="py-1 px-2 border-r border-slate-900 text-center">Form Average</th>
                        <th className="py-1 px-2 border-r border-slate-900 text-center">Grade</th>
                        <th className="py-1 px-2 border-r border-slate-900 text-center">Position in Class</th>
                        <th className="py-1 px-2 border-r border-slate-900 text-center">Position in Form</th>
                        <th className="py-1 px-2 text-center">REMARK</th>
                      </tr>
                      <tr className="bg-slate-100 text-slate-900 font-black border-b border-slate-900">
                        <th className="py-1 px-2 border-r border-slate-900 text-center">10</th>
                        <th className="py-1 px-2 border-r border-slate-900 text-center">10</th>
                        <th className="py-1 px-2 border-r border-slate-900 text-center">10</th>
                        <th className="py-1 px-2 border-r border-slate-900 text-center">10</th>
                        <th className="py-1 px-2 border-r border-slate-900 text-center">40</th>
                        <th className="py-1 px-2 border-r border-slate-900 text-center">60</th>
                        <th className="py-1 px-2 border-r border-slate-900 text-center">100</th>
                        <th className="py-1 px-2 border-r border-slate-900 text-center">100</th>
                        <th className="py-1 px-2 border-r border-slate-900 text-center">100</th>
                        <th className="py-1 px-2 border-r border-slate-900 text-center"></th>
                        <th className="py-1 px-2 border-r border-slate-900 text-center"></th>
                        <th className="py-1 px-2 border-r border-slate-900 text-center"></th>
                        <th className="py-1 px-2 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {[
                        { sub: 'Biology', cat1:8, cat2:10, cat3:9, cat4:6, total:70, avg:58, form:28, grade:'B3', pos:2, posF:2, rem:'GOOD' },
                        { sub: 'Chemistry', cat1:10, cat2:10, cat3:10, cat4:10, total:98, avg:60, form:61, grade:'A1', pos:1, posF:1, rem:'EXCELLENT' }
                      ].map((r, i) => (
                        <tr key={i} className="font-medium text-slate-900">
                          <td className="py-1 px-2 border-r border-slate-900 text-center">{i+1}</td>
                          <td className="py-1 px-2 border-r border-slate-900">{r.sub}</td>
                          <td className="py-1 px-2 border-r border-slate-900 text-center">{r.cat1}</td>
                          <td className="py-1 px-2 border-r border-slate-900 text-center">{r.cat2}</td>
                          <td className="py-1 px-2 border-r border-slate-900 text-center">{r.cat3}</td>
                          <td className="py-1 px-2 border-r border-slate-900 text-center">{r.cat4}</td>
                          <td className="py-1 px-2 border-r border-slate-900 text-center">{r.cat1+r.cat2+r.cat3+r.cat4}</td>
                          <td className="py-1 px-2 border-r border-slate-900 text-center">{r.total - (r.cat1+r.cat2+r.cat3+r.cat4)}</td>
                          <td className="py-1 px-2 border-r border-slate-900 text-center">{r.total}</td>
                          <td className="py-1 px-2 border-r border-slate-900 text-center">{r.avg}</td>
                          <td className="py-1 px-2 border-r border-slate-900 text-center">{r.form}</td>
                          <td className="py-1 px-2 border-r border-slate-900 text-center font-bold">{r.grade}</td>
                          <td className="py-1 px-2 border-r border-slate-900 text-center">{r.pos}</td>
                          <td className="py-1 px-2 border-r border-slate-900 text-center">{r.posF}</td>
                          <td className="py-1 px-2 text-center font-bold">{r.rem}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Character Development */}
                <div className="grid grid-cols-2 gap-4 text-[10px] mb-4">
                  <table className="w-full border-collapse border border-slate-900">
                    <thead>
                      <tr className="bg-slate-100 font-black border-b border-slate-900">
                        <th className="p-1 border-r border-slate-900 text-left">CHARACTER DEVELOPMENT</th>
                        <th className="p-1 border-r border-slate-900 text-center">A</th>
                        <th className="p-1 border-r border-slate-900 text-center">B</th>
                        <th className="p-1 border-r border-slate-900 text-center">C</th>
                        <th className="p-1 border-r border-slate-900 text-center">D</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {['Punctuality', 'Neatness', 'Honesty'].map(item => (
                        <tr key={item}>
                          <td className="p-1 border-r border-slate-900">{item}</td>
                          <td className="p-1 border-r border-slate-900 text-center"></td>
                          <td className="p-1 border-r border-slate-900 text-center">X</td>
                          <td className="p-1 border-r border-slate-900 text-center"></td>
                          <td className="p-1 text-center"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div className="flex justify-between text-xs font-bold uppercase mt-4">
                  <div>FORM MASTER'S REMARK: A quiet and intelligent student.</div>
                  <div>SIGNATURE: ....................</div>
                </div>
                <div className="flex justify-between text-xs font-bold uppercase mt-2">
                  <div>PRINCIPAL'S REMARK: An excellent performance.</div>
                  <div>SIGNATURE: ....................</div>
                </div>
                <div className="text-xs font-bold uppercase mt-2">
                  Next Term Begins on: Monday 26 July, 2021
                </div>

                <div className="flex justify-end items-center gap-2 mt-4 no-print">
                  <button
                    onClick={() => {
                      const marks = getStudentSubjectsData(viewingReportCardStudent, FATIMA_SUBJECTS);
                      downloadStudentWordDoc(viewingReportCardStudent, marks);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-500 cursor-pointer flex items-center gap-2 transition-colors"
                  >
                    <i className="fas fa-file-word"></i> Download Word (.doc)
                  </button>
                  <button
                    onClick={() => {
                      const marks = getStudentSubjectsData(viewingReportCardStudent, FATIMA_SUBJECTS);
                      printSingleReportSheet(viewingReportCardStudent, marks);
                    }}
                    className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 cursor-pointer flex items-center gap-2 transition-colors"
                  >
                    <i className="fas fa-print"></i> Print Official Report Card
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: ATTENDANCE */}
        {activeTab === 'attendance' && (
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 sm:p-6 shadow-lg space-y-5 animate-fade-in text-left">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-black text-white">Daily Class Attendance Register</h3>
                <p className="text-xs text-slate-400">Class: Form 4 Science Stream A &bull; Date: 08 October 2026</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const allPres: Record<string, 'Present' | 'Late' | 'Absent'> = {};
                    studentsList.forEach((s) => (allPres[s.id] = 'Present'));
                    setAttendanceRecords(allPres);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
                >
                  <i className="fas fa-check-double mr-1"></i> Mark All Present
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 uppercase text-[10px]">
                    <th className="py-3 px-3">Student</th>
                    <th className="py-3 px-3">Admission No</th>
                    <th className="py-3 px-3">Term Attendance Rate</th>
                    <th className="py-3 px-3">Today's Roll Call Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {studentsList.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="py-3 px-3 font-bold text-white">
                        {s.firstName} {s.lastName}
                      </td>
                      <td className="py-3 px-3 font-mono text-orange-400">{s.studentNo}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full"
                              style={{ width: `${s.attendanceRate}%` }}
                            ></div>
                          </div>
                          <span className="font-bold text-emerald-400">{s.attendanceRate}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          {(['Present', 'Late', 'Absent'] as const).map((status) => (
                            <button
                              key={status}
                              onClick={() =>
                                setAttendanceRecords({ ...attendanceRecords, [s.id]: status })
                              }
                              className={`px-3 py-1 rounded-lg font-bold text-[11px] cursor-pointer transition-all ${
                                attendanceRecords[s.id] === status
                                  ? status === 'Present'
                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                                    : status === 'Late'
                                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                                    : 'bg-red-600 text-white shadow-md shadow-red-600/30'
                                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: BROADCAST & WHATSAPP */}
        {activeTab === 'broadcast' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in text-left">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center text-2xl">
                  <i className="fab fa-whatsapp"></i>
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Broadcast Center & Parent Notifications</h3>
                  <p className="text-xs text-slate-400">
                    Dispatch instant official announcements, fee alerts, and examination results directly to parent phones.
                  </p>
                </div>
              </div>

              {broadcastSuccess && (
                <div className="alert-custom alert-success-custom mb-4 flex items-center gap-2">
                  <i className="fas fa-check-circle text-green-700"></i>
                  <span>Broadcast successfully scheduled and queued for delivery to 1,420 guardian numbers!</span>
                </div>
              )}

              <form onSubmit={handleSendBroadcast} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Channel</label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-4 py-2.5 rounded-xl cursor-pointer text-xs font-bold">
                      <input
                        type="radio"
                        checked={broadcastChannel === 'WhatsApp'}
                        onChange={() => setBroadcastChannel('WhatsApp')}
                        className="text-green-500"
                      />
                      <i className="fab fa-whatsapp text-green-400"></i> WhatsApp Gateway
                    </label>
                    <label className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-4 py-2.5 rounded-xl cursor-pointer text-xs font-bold">
                      <input
                        type="radio"
                        checked={broadcastChannel === 'SMS'}
                        onChange={() => setBroadcastChannel('SMS')}
                        className="text-blue-500"
                      />
                      <i className="fas fa-sms text-blue-400"></i> Telecom SMS Broadcast
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Announcement Subject</label>
                  <input
                    type="text"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="e.g. Term 2 Report Cards Available on FECOMAS Portal"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Message Content</label>
                  <textarea
                    rows={4}
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Dear Parent/Guardian, please be advised that..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-orange-500 resize-none"
                    required
                  ></textarea>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                  <p className="font-bold text-slate-400 mb-1 flex items-center gap-1.5">
                    <i className="fas fa-eye text-orange-400"></i> Message Preview:
                  </p>
                  <div className="bg-emerald-950/40 border border-emerald-800/40 p-3 rounded-lg text-emerald-200 font-mono text-[11px] leading-relaxed">
                    [FECOMAS - {currentSchool.code}]<br />
                    <strong>{broadcastTitle || 'Subject Line'}</strong><br />
                    {broadcastMessage || 'Your announcement message will appear here with student personal token.'}<br />
                    <span className="text-emerald-400 underline">https://fecomas.com</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-green-600/20 cursor-pointer flex items-center justify-center gap-2 transition-all"
                >
                  <i className="fas fa-paper-plane"></i>
                  Send Broadcast to All Registered Guardians
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 7: RBAC & DEPARTMENT AUTHORIZATION ENGINE */}
        {activeTab === 'rbac' && (
          <DepartmentAuthorizationView
            currentUser={
              SYSTEM_USERS.find((u) => u.role === role) || SYSTEM_USERS[0]
            }
            onSelectUserToSimulate={(selected) => {
              if (selected.role === 'exam_officer' && onOpenExamOfficer) {
                onOpenExamOfficer();
              } else if (selected.role === 'bursar' && onOpenBursar) {
                onOpenBursar();
              } else if (selected.role === 'pta_secretary' && onOpenPta) {
                onOpenPta();
              }
            }}
          />
        )}
      </main>

      {/* Printable Receipt Modal */}
      {viewingReceipt && (
        <div className="modal-overlay" onClick={() => setViewingReceipt(null)}>
          <div
            className="modal-dialog-custom bg-white text-slate-900 p-6 rounded-2xl max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center border-b pb-4 mb-4">
              <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-2 overflow-hidden p-1">
                <img src="/assets/img/nda-logo.png" alt="NDA Logo" className="w-full h-full object-contain" />
              </div>
              <h4 className="font-black text-sm uppercase text-slate-900">{currentSchool.name}</h4>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Official Tuition Fee Receipt &bull; FSMS Reconciled
              </p>
            </div>

            <div className="space-y-2 text-xs text-left mb-5">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Receipt Number:</span>
                <span className="font-mono font-bold text-orange-600">{viewingReceipt.receiptNo}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Date:</span>
                <span className="font-bold text-slate-800">{viewingReceipt.date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-800">{viewingReceipt.studentName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Class:</span>
                <span className="font-bold text-slate-800">{viewingReceipt.formClass}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Payment Channel:</span>
                <span className="font-bold text-slate-800">{viewingReceipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Category:</span>
                <span className="font-bold text-slate-800">{viewingReceipt.purpose}</span>
              </div>
              <div className="flex justify-between py-2 border-b-2 border-slate-900 text-sm font-black text-emerald-700">
                <span>Amount Paid:</span>
                <span>MK {viewingReceipt.amount.toLocaleString()}</span>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-400 mb-4 italic">
              Received by {viewingReceipt.recordedBy} &bull; Fecomas School Management System
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 cursor-pointer"
              >
                <i className="fas fa-print mr-1"></i> Print Receipt
              </button>
              <button
                onClick={() => setViewingReceipt(null)}
                className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
        onAdd={handleAddStudent}
      />

      {/* Dashboard Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; Fecomas Tech Solutions 2026 &bull; Fecomas School Management System</span>
          <div className="flex items-center gap-4 text-slate-400">
            <a
              href="https://wa.me/265993189671"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-green-400 text-[11px] font-semibold"
            >
              <i className="fab fa-whatsapp mr-1 text-green-500"></i> WhatsApp Support: +265 993 189 671
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

import React, { useState } from 'react';
import { Student, SubjectMark } from '../types';
import { getStudentSubjectsData, printSingleReportSheet, downloadStudentPdf, downloadStudentWordDoc } from '../services/reportSheetExportService';
import { INITIAL_BURSARY_PAYMENTS, BursaryPayment } from '../data/financialMockData';
import { NDA_LOGO_BASE64 } from '../services/ndaLogoBase64';

interface StudentPortalViewProps {
  student: Student;
  onLogout: () => void;
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({ student, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'report_sheet' | 'school_fees'>('report_sheet');
  const [viewingReceipt, setViewingReceipt] = useState<BursaryPayment | null>(null);

  // Get marks for this specific student
  const marks: SubjectMark[] = getStudentSubjectsData(student);

  // Financial calculations
  const totalFees = student.totalFees || 380000;
  const feeBalance = student.feeBalance ?? 0;
  const amountPaid = Math.max(0, totalFees - feeBalance);
  const isPaidInFull = feeBalance === 0;
  const isPartiallyPaid = feeBalance > 0 && amountPaid > 0;
  const isUnpaid = amountPaid === 0 && feeBalance > 0;

  // Payments for this student
  const studentPayments = INITIAL_BURSARY_PAYMENTS.filter(
    (p) =>
      p.admissionNo.toLowerCase() === student.studentNo.toLowerCase() ||
      p.studentName.toLowerCase().includes(student.lastName.toLowerCase())
  );

  // Fallback demo payment if student just enrolled
  const displayedPayments =
    studentPayments.length > 0
      ? studentPayments
      : [
          {
            id: `bur-${student.id}-01`,
            receiptNumber: `NDA-BURS-2026-${student.studentNo}`,
            studentId: student.id,
            studentName: `${student.firstName} ${student.lastName}`,
            admissionNo: student.studentNo,
            class: student.formClass,
            arm: student.arm || 'Science',
            amountPaid: amountPaid,
            paymentDate: '2026-09-18',
            paymentMethod: 'Bank Transfer (CBN NIBSS)' as const,
            bankReference: `NIBSS-TRX-2026-${student.studentNo}`,
            feeItem: 'First & Second Term Composite Fee Assessment',
            term: student.term || 'SECOND',
            session: student.session || '2020/21',
            receivedBy: 'Hajiya Maryam B. Al-Hassan (Bursar)',
            status: 'VERIFIED' as const
          }
        ];

  // Subject statistics
  const totalMarks = marks.reduce((acc, m) => acc + m.termTotal, 0);
  const averageMark = marks.length ? (totalMarks / marks.length).toFixed(1) : '0.0';
  const creditsAndAbove = marks.filter((m) => ['A1', 'B2', 'B3', 'C4', 'C5', 'C6'].includes(m.grade)).length;
  const passesCount = marks.filter((m) => ['D7', 'E8'].includes(m.grade)).length;
  const failuresCount = marks.filter((m) => m.grade === 'F9').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Student Portal Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white border border-slate-700/40 flex items-center justify-center p-1 shadow-md">
                <img src={NDA_LOGO_BASE64} alt="NDA Crest" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-white tracking-wider text-sm sm:text-base">
                    NIGERIAN DEFENCE ACADEMY SSS
                  </span>
                  <span className="text-[11px] bg-blue-500/20 text-blue-400 font-bold px-2 py-0.5 rounded border border-blue-500/30">
                    STUDENT PORTAL
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Candidate: <strong className="text-white">{student.lastName}, {student.firstName}</strong> &bull; Reg No:{' '}
                  <span className="text-orange-400 font-mono font-bold">{student.studentNo}</span> &bull; Class:{' '}
                  <span className="text-emerald-400 font-semibold">{student.formClass}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-600 bg-slate-700">
                  <img src={student.avatarUrl} alt={student.firstName} className="w-full h-full object-cover" />
                </div>
                <div className="text-left text-[11px]">
                  <div className="font-bold text-white leading-tight">{student.firstName} {student.lastName}</div>
                  <div className="text-slate-400">Reg: {student.studentNo}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="py-1.5 px-3 bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow"
                title="Sign out of student account"
              >
                <i className="fas fa-sign-out-alt"></i>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Student Portal Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('report_sheet')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'report_sheet'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <i className="fas fa-file-alt"></i>
              <span>My Terminal Report Sheet</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('school_fees')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'school_fees'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <i className="fas fa-receipt"></i>
              <span>School Fees Status</span>
              {isPaidInFull ? (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] px-1.5 py-0.2 rounded font-black">
                  PAID
                </span>
              ) : (
                <span className="bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] px-1.5 py-0.2 rounded font-black">
                  ₦{feeBalance.toLocaleString()} DUE
                </span>
              )}
            </button>
          </div>

          {/* Quick Actions for Report Sheet */}
          {activeTab === 'report_sheet' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => printSingleReportSheet(student, marks)}
                className="py-2 px-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                title="Print official Terminal Continuous Assessment Report Sheet"
              >
                <i className="fas fa-print"></i>
                <span>Print Report Sheet</span>
              </button>
              <button
                type="button"
                onClick={() => downloadStudentPdf(student, marks)}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700"
                title="Download Official PDF Dossier"
              >
                <i className="fas fa-file-pdf text-red-400"></i>
                <span className="hidden sm:inline">PDF</span>
              </button>
            </div>
          )}
        </div>

        {/* TAB 1: TERMINAL REPORT SHEET */}
        {activeTab === 'report_sheet' && (
          <div className="space-y-6">
            {/* Quick Summary Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl">
                <div className="text-[11px] text-slate-400 font-medium">Position in Class</div>
                <div className="text-xl font-black text-white mt-0.5">
                  #{student.positionInClass || 1} <span className="text-xs text-slate-400 font-normal">of {student.noInClass || 68}</span>
                </div>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl">
                <div className="text-[11px] text-slate-400 font-medium">Overall Average Score</div>
                <div className="text-xl font-black text-emerald-400 mt-0.5">{averageMark}%</div>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl">
                <div className="text-[11px] text-slate-400 font-medium">Credits & Above (A1-C6)</div>
                <div className="text-xl font-black text-blue-400 mt-0.5">
                  {creditsAndAbove} <span className="text-xs text-slate-400 font-normal">of {marks.length}</span>
                </div>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl">
                <div className="text-[11px] text-slate-400 font-medium">Attendance Record</div>
                <div className="text-xl font-black text-orange-400 mt-0.5">
                  {student.timesPresent || 94} / {student.timesOpened || 94} days
                </div>
              </div>
            </div>

            {/* Authentic Printable Terminal Report Sheet Container */}
            <div className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-300 max-w-4xl mx-auto font-sans">
              {/* Header section matching exact official standard */}
              <div className="border-b-2 border-slate-900 pb-2 mb-3 text-center">
                <div className="flex items-center justify-between gap-3">
                  <div className="w-20 h-20 overflow-hidden p-1 flex items-center justify-center">
                    <img
                      src={NDA_LOGO_BASE64}
                      alt="Nigerian Defence Academy Crest Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl sm:text-2xl font-black tracking-wide text-slate-900 uppercase">
                      NIGERIAN DEFENCE ACADEMY
                    </h2>
                    <h3 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-widest mt-0.5">
                      STAFF SECONDARY SCHOOL
                    </h3>
                    <p className="text-xs font-semibold text-slate-700 uppercase tracking-widest">
                      P.M.B. 2109, KADUNA &bull; NIGERIA
                    </p>
                    <h4 className="text-base font-black text-white uppercase mt-1 bg-slate-900 py-0.5 tracking-wider">
                      TERMINAL REPORT
                    </h4>
                  </div>
                  <div className="w-20 h-24 border-2 border-slate-400 flex items-center justify-center p-0.5 bg-slate-50">
                    <img
                      src={student.avatarUrl}
                      alt="Candidate Passport Photo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <h5 className="text-xs sm:text-sm font-black text-slate-900 uppercase mt-2 mb-1.5 underline tracking-wider">
                  CONTINUOUS ASSESSMENT DOSSIER
                </h5>

                {/* Candidate Bio-data Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1 mt-1 text-left text-[11px] font-bold uppercase text-slate-900">
                  <div>NAME: <strong>{student.lastName}, {student.firstName}</strong></div>
                  <div>ADM NO: <strong className="font-mono">{student.studentNo}</strong></div>
                  <div>CLASS: <strong>{student.formClass}</strong></div>
                  <div>SPONSOR: <strong>{student.sponsor || student.guardianName}</strong></div>
                  <div>HOUSE: <strong>{student.house || 'Dalet'}</strong></div>
                  <div>SESSION: <strong>{student.session || '2020/21'}</strong></div>
                  <div>TERM: <strong>{student.term || 'SECOND'}</strong></div>
                  <div>AGE: <strong>{student.age || 16}</strong></div>
                  <div>CLASS AVG AGE: <strong>{student.classAverageAge || 15}</strong></div>
                  <div>TIMES OPENED: <strong>{student.timesOpened || 94}</strong></div>
                  <div>TIMES PRESENT: <strong>{student.timesPresent || 94}</strong></div>
                  <div>TIMES ABSENT: <strong>{student.timesAbsent || 0}</strong></div>
                  <div>NO IN CLASS: <strong>{student.noInClass || 68}</strong></div>
                  <div>POSITION IN CLASS: <strong>{student.positionInClass || 1}</strong></div>
                  <div>NO IN FORM: <strong>{student.noInForm || 170}</strong></div>
                  <div>POSITION IN FORM: <strong>{student.positionInForm || 1}</strong></div>
                  <div>CREDITS &amp; ABOVE: <strong className="text-emerald-700">{creditsAndAbove}</strong></div>
                  <div>PASSES: <strong>{passesCount}</strong> &bull; FAILURES: <strong>{failuresCount}</strong></div>
                </div>
              </div>

              {/* Subject Marks Table */}
              <div className="overflow-x-auto border-2 border-slate-900">
                <table className="w-full text-center border-collapse text-[10px] text-slate-900">
                  <thead>
                    <tr className="bg-slate-900 text-white font-black uppercase text-[10px]">
                      <th className="border border-slate-800 p-1 w-6">S/N</th>
                      <th className="border border-slate-800 p-1 text-left w-36">SUBJECTS</th>
                      <th className="border border-slate-800 p-0.5">CAT 1 (10)</th>
                      <th className="border border-slate-800 p-0.5">CAT 2 (10)</th>
                      <th className="border border-slate-800 p-0.5">CAT 3 (10)</th>
                      <th className="border border-slate-800 p-0.5">CAT 4 (10)</th>
                      <th className="border border-slate-800 p-0.5 bg-slate-800 font-black">CAT TOT (40)</th>
                      <th className="border border-slate-800 p-0.5">EXAM (60)</th>
                      <th className="border border-slate-800 p-0.5 bg-slate-800 font-black">TERM TOT (100)</th>
                      <th className="border border-slate-800 p-0.5">CLS AVG</th>
                      <th className="border border-slate-800 p-0.5">FRM AVG</th>
                      <th className="border border-slate-800 p-0.5 font-black">GRD</th>
                      <th className="border border-slate-800 p-0.5 font-black">POS</th>
                      <th className="border border-slate-800 p-1 text-left">REMARK</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-400 font-medium text-[10.5px]">
                    {marks.map((sub, idx) => (
                      <tr key={sub.sNo || idx} className="hover:bg-slate-50 transition-colors">
                        <td className="border border-slate-400 py-1 font-bold">{idx + 1}</td>
                        <td className="border border-slate-400 py-1 px-1.5 text-left font-bold uppercase">{sub.subject}</td>
                        <td className="border border-slate-400 py-1">{sub.cat1}</td>
                        <td className="border border-slate-400 py-1">{sub.cat2}</td>
                        <td className="border border-slate-400 py-1">{sub.cat3}</td>
                        <td className="border border-slate-400 py-1">{sub.cat4}</td>
                        <td className="border border-slate-400 py-1 font-bold bg-slate-100">{sub.catTotal}</td>
                        <td className="border border-slate-400 py-1">{sub.examMarks}</td>
                        <td className="border border-slate-400 py-1 font-black bg-slate-100 text-slate-900">{sub.termTotal}</td>
                        <td className="border border-slate-400 py-1">{sub.classAverage}</td>
                        <td className="border border-slate-400 py-1">{sub.formAverage}</td>
                        <td className="border border-slate-400 py-1 font-black text-slate-900">{sub.grade}</td>
                        <td className="border border-slate-400 py-1 font-bold">{sub.posInClass || idx + 1}</td>
                        <td className="border border-slate-400 py-1 px-1 text-left font-bold text-[9.5px] uppercase">{sub.remark}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Psychomotor & Affective Skills Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-2 border-t-2 border-slate-900 text-left text-[11px] text-slate-900">
                <div className="border border-slate-400 p-2 rounded">
                  <div className="font-black uppercase mb-1 border-b border-slate-300 pb-0.5">
                    AFFECTIVE ASSESSMENT (Scale: 1-5)
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
                    <div>Punctuality: <strong>5 (Excellent)</strong></div>
                    <div>Neatness: <strong>5 (Excellent)</strong></div>
                    <div>Politeness: <strong>5 (Excellent)</strong></div>
                    <div>Honesty: <strong>5 (Excellent)</strong></div>
                    <div>Self Control: <strong>4 (Very Good)</strong></div>
                    <div>Attentiveness: <strong>5 (Excellent)</strong></div>
                  </div>
                </div>

                <div className="border border-slate-400 p-2 rounded">
                  <div className="font-black uppercase mb-1 border-b border-slate-300 pb-0.5">
                    PSYCHOMOTOR SKILLS (Scale: 1-5)
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
                    <div>Handwriting: <strong>4 (Very Good)</strong></div>
                    <div>Sports &amp; Athletics: <strong>4 (Very Good)</strong></div>
                    <div>Lab Practical Skills: <strong>5 (Excellent)</strong></div>
                    <div>Musical/Artistic Skill: <strong>4 (Very Good)</strong></div>
                    <div>Verbal Fluency: <strong>5 (Excellent)</strong></div>
                    <div>Manual Dexterity: <strong>4 (Very Good)</strong></div>
                  </div>
                </div>
              </div>

              {/* Form Master & Principal Remarks */}
              <div className="mt-3 space-y-2 text-left text-[11px] font-bold text-slate-900">
                <div className="p-2 border border-slate-400 rounded bg-slate-50">
                  <span className="text-slate-700 uppercase">Form Master's Remark:</span>{' '}
                  <span className="font-serif italic text-slate-900 font-semibold">
                    An outstanding student of exceptional intellect and diligence. Keep up the high standard.
                  </span>
                  <div className="mt-1 text-right text-[10px] text-slate-600">Signed: Mr. T. O. Olatunji (Form Master)</div>
                </div>

                <div className="p-2 border border-slate-400 rounded bg-slate-50">
                  <span className="text-slate-700 uppercase">Principal's Decision &amp; Remark:</span>{' '}
                  <span className="font-serif italic text-slate-900 font-semibold">
                    Excellent terminal performance. Commended for academic excellence and exemplary conduct.
                  </span>
                  <div className="mt-1 flex justify-between items-center text-[10px] text-slate-600">
                    <span>Resumption Date: Next Term Begins on Monday, 11th January 2027</span>
                    <span>Signed: Commandant / Principal (NDA Staff Secondary School)</span>
                  </div>
                </div>
              </div>

              {/* Grading Key Footer */}
              <div className="mt-3 pt-1 border-t border-slate-400 text-center text-[9px] text-slate-600 uppercase tracking-tight">
                Grading Key: A1 (75-100% Distinction) &bull; B2 (70-74% Very Good) &bull; B3 (65-69% Good) &bull; C4 (60-64% Credit) &bull; C5 (55-59% Credit) &bull; C6 (50-54% Credit) &bull; D7 (45-49% Pass) &bull; E8 (40-44% Pass) &bull; F9 (0-39% Fail)
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SCHOOL FEES & BURSARY STATUS */}
        {activeTab === 'school_fees' && (
          <div className="space-y-6">
            {/* Prominent Payment Status Banner */}
            {isPaidInFull ? (
              <div className="bg-emerald-950/80 border-2 border-emerald-500/80 rounded-2xl p-5 flex items-start sm:items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl border border-emerald-500/40">
                    <i className="fas fa-check-circle"></i>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-white">SCHOOL FEES: PAID IN FULL</span>
                      <span className="bg-emerald-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
                        Zero Balance
                      </span>
                    </div>
                    <p className="text-xs text-emerald-200/90 mt-0.5">
                      All tuition, PTA development levies, exam, and laboratory charges for the current academic session have been fully verified and settled.
                    </p>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-[10px] text-emerald-300 uppercase tracking-widest font-bold">Clearance Status</div>
                  <div className="text-xs font-mono font-bold text-white bg-emerald-900/80 px-2.5 py-1 rounded border border-emerald-500/40 mt-1">
                    CLEARED FOR NEXT TERM
                  </div>
                </div>
              </div>
            ) : isPartiallyPaid ? (
              <div className="bg-amber-950/80 border-2 border-amber-500/80 rounded-2xl p-5 flex items-start sm:items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl border border-amber-500/40">
                    <i className="fas fa-exclamation-triangle"></i>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-white">SCHOOL FEES: PARTIALLY PAID</span>
                      <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
                        ₦{feeBalance.toLocaleString()} Outstanding
                      </span>
                    </div>
                    <p className="text-xs text-amber-200/90 mt-0.5">
                      ₦{amountPaid.toLocaleString()} paid out of ₦{totalFees.toLocaleString()}. Please clear the outstanding balance of ₦{feeBalance.toLocaleString()} at the NDA Bursary.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-950/80 border-2 border-red-500/80 rounded-2xl p-5 flex items-start sm:items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center text-2xl border border-red-500/40">
                    <i className="fas fa-times-circle"></i>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-white">SCHOOL FEES: OUTSTANDING / UNPAID</span>
                      <span className="bg-red-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
                        Payment Due
                      </span>
                    </div>
                    <p className="text-xs text-red-200/90 mt-0.5">
                      No verified payment has been recorded for this term. Full fee of ₦{totalFees.toLocaleString()} is due. Please settle via the school bank channel or Bursar's office.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Financial Status Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="text-xs text-slate-400 font-medium">Total Assessed Fees</div>
                <div className="text-2xl font-black text-white mt-1">
                  ₦{totalFees.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Full academic term assessment</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="text-xs text-slate-400 font-medium">Total Amount Paid</div>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  ₦{amountPaid.toLocaleString()}
                </div>
                <div className="text-[11px] text-emerald-400/80 mt-1">Confirmed with Bursary receipts</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="text-xs text-slate-400 font-medium">Outstanding Balance</div>
                <div className={`text-2xl font-black mt-1 ${isPaidInFull ? 'text-emerald-400' : 'text-red-400'}`}>
                  ₦{feeBalance.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {isPaidInFull ? 'Nil (Account 100% Cleared)' : 'Due before next term resumption'}
                </div>
              </div>
            </div>

            {/* School Fee Schedule / Billing Itemization */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Term Fee Structure &amp; Billing Schedule</h3>
                  <p className="text-xs text-slate-400">Approved fee rates for Nigerian Defence Academy Staff Secondary School</p>
                </div>
                <span className="text-xs font-mono font-bold bg-slate-800 text-slate-300 px-3 py-1 rounded-lg border border-slate-700">
                  Class: {student.formClass}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800/80 text-slate-300 font-bold border-b border-slate-700">
                      <th className="py-2.5 px-3">Item Category</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Amount (NGN)</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-white">Tuition &amp; Academic Instruction</td>
                      <td className="py-2.5 px-3 text-slate-400">Regular curriculum, classroom tuition &amp; continuous assessment</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">₦180,000</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-bold">
                          {isPaidInFull ? 'PAID' : isPartiallyPaid ? 'PAID' : 'UNPAID'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-white">Science Laboratory &amp; Consumables</td>
                      <td className="py-2.5 px-3 text-slate-400">Physics, Chemistry, Biology &amp; Technical workshop apparatus</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">₦60,000</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-bold">
                          {isPaidInFull ? 'PAID' : isPartiallyPaid ? 'PAID' : 'UNPAID'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-white">ICT &amp; Digital Literacy Lab</td>
                      <td className="py-2.5 px-3 text-slate-400">Computer studies, Internet access &amp; portal access maintenance</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">₦45,000</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-bold">
                          {isPaidInFull ? 'PAID' : isPartiallyPaid ? 'PAID' : 'UNPAID'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-white">PTA Development Levy</td>
                      <td className="py-2.5 px-3 text-slate-400">Solar inverter project &amp; perimeter security support fund</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">₦50,000</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-bold">
                          {isPaidInFull ? 'PAID' : 'UNPAID'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-white">Medical &amp; Infirmary Support</td>
                      <td className="py-2.5 px-3 text-slate-400">First-aid medical insurance &amp; Academy clinic coverage</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">₦25,000</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-bold">
                          {isPaidInFull ? 'PAID' : 'UNPAID'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-white">Library &amp; Terminal Examinations</td>
                      <td className="py-2.5 px-3 text-slate-400">Printed Continuous Assessment dossiers, examination materials</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">₦20,000</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-bold">
                          {isPaidInFull ? 'PAID' : 'UNPAID'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-950 font-black text-white text-xs border-t-2 border-slate-700">
                      <td colSpan={2} className="py-3 px-3 uppercase text-right">Total Assessment:</td>
                      <td className="py-3 px-3 text-right font-mono text-sm text-orange-400">₦{totalFees.toLocaleString()}</td>
                      <td className="py-3 px-3 text-center">
                        {isPaidInFull ? (
                          <span className="text-emerald-400 font-bold">100% CLEARED</span>
                        ) : (
                          <span className="text-red-400 font-bold">BALANCE: ₦{feeBalance.toLocaleString()}</span>
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Verified Bursary Payment Receipts */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Official Bursary Payment Receipts</h3>
                  <p className="text-xs text-slate-400">Payment receipts credited to your student admission record</p>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {displayedPayments.length} receipt{displayedPayments.length === 1 ? '' : 's'} recorded
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800/80 text-slate-300 font-bold border-b border-slate-700">
                      <th className="py-2.5 px-3">Receipt Number</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Channel / Bank Ref</th>
                      <th className="py-2.5 px-3 text-right">Amount Paid</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-center">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {displayedPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-orange-400">{p.receiptNumber}</td>
                        <td className="py-2.5 px-3 text-slate-300">{p.paymentDate}</td>
                        <td className="py-2.5 px-3 text-slate-400">
                          <div>{p.paymentMethod}</div>
                          <div className="text-[10px] font-mono text-slate-500">{p.bankReference}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                          ₦{p.amountPaid.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            {p.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setViewingReceipt(p)}
                            className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <i className="fas fa-eye text-blue-400"></i>
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Official Receipt Modal */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white text-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-300 text-center relative">
            <button
              type="button"
              onClick={() => setViewingReceipt(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 text-xl font-bold cursor-pointer"
            >
              &times;
            </button>

            {/* Receipt Header */}
            <div className="w-14 h-14 mx-auto mb-2 flex items-center justify-center">
              <img src={NDA_LOGO_BASE64} alt="NDA Crest" className="w-full h-full object-contain" />
            </div>
            <h3 className="text-base font-black uppercase text-slate-900">
              NIGERIAN DEFENCE ACADEMY
            </h3>
            <h4 className="text-xs font-bold uppercase text-slate-800">
              STAFF SECONDARY SCHOOL, KADUNA
            </h4>
            <div className="text-[10px] text-slate-600 mb-3">BURSARY DEPARTMENT &bull; OFFICIAL RECEIPT</div>

            {/* Receipt Itemized Details */}
            <div className="space-y-2 text-xs text-left mb-5 border-t border-b border-slate-200 py-3">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Receipt Number:</span>
                <span className="font-mono font-bold text-orange-600">{viewingReceipt.receiptNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Payment Date:</span>
                <span className="font-bold text-slate-800">{viewingReceipt.paymentDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Student Name:</span>
                <span className="font-bold text-slate-800">{viewingReceipt.studentName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Admission No:</span>
                <span className="font-mono font-bold text-slate-800">{viewingReceipt.admissionNo}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Class:</span>
                <span className="font-bold text-slate-800">{viewingReceipt.class}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Payment Channel:</span>
                <span className="font-bold text-slate-800">{viewingReceipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Bank Reference:</span>
                <span className="font-mono text-slate-700">{viewingReceipt.bankReference}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Payment Category:</span>
                <span className="font-bold text-slate-800">{viewingReceipt.feeItem}</span>
              </div>
              <div className="flex justify-between py-2 border-b-2 border-slate-900 text-sm font-black text-emerald-700">
                <span>Amount Paid:</span>
                <span>₦{viewingReceipt.amountPaid.toLocaleString()}</span>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-400 mb-4 italic">
              Verified by {viewingReceipt.receivedBy} &bull; NDA SSS Financial Information System
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <i className="fas fa-print"></i>
                <span>Print Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="px-4 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

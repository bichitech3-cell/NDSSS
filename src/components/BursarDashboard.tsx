import React, { useState } from 'react';
import {
  INITIAL_SCHOOL_FEES,
  INITIAL_BURSARY_PAYMENTS,
  SchoolFeeItem,
  BursaryPayment
} from '../data/financialMockData';
import { MOCK_STUDENTS } from '../data/mockData';
import { UserAccount, SecurityController } from '../services/securityService';
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

interface BursarDashboardProps {
  currentUser: UserAccount;
  onLogout: () => void;
  onSwitchUser?: (user: UserAccount) => void;
}

export const BursarDashboard: React.FC<BursarDashboardProps> = ({
  currentUser,
  onLogout,
  onSwitchUser
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'collect' | 'ledger' | 'feestructure' | 'reconciliation' | 'securityTest'
  >('overview');

  const [feeItems, setFeeItems] = useState<SchoolFeeItem[]>(INITIAL_SCHOOL_FEES);
  const [payments, setPayments] = useState<BursaryPayment[]>(INITIAL_BURSARY_PAYMENTS);

  // New Payment Form State
  const [selectedStudentId, setSelectedStudentId] = useState(MOCK_STUDENTS[0].id);
  const [payAmount, setPayAmount] = useState<number>(50000);
  const [payMethod, setPayMethod] = useState<BursaryPayment['paymentMethod']>('Bank Transfer (CBN NIBSS)');
  const [payFeeItem, setPayFeeItem] = useState('Standard Senior Tuition Fee');
  const [payBankRef, setPayBankRef] = useState('');
  const [receiptSuccess, setReceiptSuccess] = useState<BursaryPayment | null>(null);

  // Filter state for Ledger
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerClass, setLedgerClass] = useState('All');
  const [ledgerMethod, setLedgerMethod] = useState('All');

  // Security test feedback
  const [securityDeniedAlert, setSecurityDeniedAlert] = useState<string | null>(null);

  // Compute Metrics
  const totalCollections = payments.reduce((acc, p) => acc + p.amountPaid, 0);
  const studentCount = MOCK_STUDENTS.length;
  const verifiedCount = payments.filter((p) => p.status === 'VERIFIED').length;

  const handlePostPayment = (e: React.FormEvent) => {
    e.preventDefault();

    // Verify security clearance
    const check = SecurityController.verifyAccess(currentUser, 'CREATE', 'BURSARY_FEES');
    if (!check.allowed) {
      setSecurityDeniedAlert(check.reason);
      return;
    }

    const student = MOCK_STUDENTS.find((s) => s.id === selectedStudentId) || MOCK_STUDENTS[0];
    const newReceipt: BursaryPayment = {
      id: `BURS-REC-${Date.now()}`,
      receiptNumber: `NDA-BURS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      admissionNo: student.studentNo,
      class: student.formClass,
      arm: student.arm || 'General',
      amountPaid: Number(payAmount),
      paymentDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
      paymentMethod: payMethod,
      bankReference: payBankRef || `NIP/${Date.now()}/${Math.floor(Math.random() * 88888)}`,
      feeItem: payFeeItem,
      term: 'Second Term',
      session: '2020/21',
      receivedBy: currentUser.name,
      status: 'VERIFIED'
    };

    setPayments([newReceipt, ...payments]);
    setReceiptSuccess(newReceipt);
    setPayBankRef('');
  };

  const handleAttemptPTATamper = () => {
    // Attempt unauthorized access to PTA Levies
    const check = SecurityController.verifyAccess(currentUser, 'APPROVE', 'PTA_LEVIES');
    if (!check.allowed) {
      setSecurityDeniedAlert(check.reason);
    }
  };

  const handleAttemptExamTamper = () => {
    // Attempt unauthorized access to Exam Marks
    const check = SecurityController.verifyAccess(currentUser, 'EDIT', 'EXAM_SCORES');
    if (!check.allowed) {
      setSecurityDeniedAlert(check.reason);
    }
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.studentName.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      p.admissionNo.includes(ledgerSearch) ||
      p.receiptNumber.toLowerCase().includes(ledgerSearch.toLowerCase());
    const matchesClass = ledgerClass === 'All' || p.class.includes(ledgerClass);
    const matchesMethod = ledgerMethod === 'All' || p.paymentMethod === ledgerMethod;
    return matchesSearch && matchesClass && matchesMethod;
  });

  const chartData = [
    { name: 'Tuition', amount: 1120000 },
    { name: 'Sci Labs', amount: 320000 },
    { name: 'ICT CBT', amount: 240000 },
    { name: 'Library', amount: 110000 },
    { name: 'Medical', amount: 84000 }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-500 flex items-center justify-center text-slate-950 font-black shadow-md text-lg">
              <i className="fas fa-university"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  BURSARY & TREASURY
                </span>
                <span className="text-xs text-slate-400 font-mono">FINANCE DEPARTMENT</span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-white leading-tight">
                NDASSS Institutional Bursary Management
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white">{currentUser.name}</p>
              <p className="text-[11px] text-amber-400 font-semibold">{currentUser.roleTitle}</p>
            </div>
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-t border-slate-800 bg-slate-900/60 px-4 sm:px-6 overflow-x-auto">
          <div className="max-w-7xl mx-auto flex space-x-2 py-2">
            {[
              { id: 'overview', label: 'Financial Overview', icon: 'fa-chart-line' },
              { id: 'collect', label: 'Payment Receipting', icon: 'fa-cash-register' },
              { id: 'ledger', label: 'Tuition & Fees Ledger', icon: 'fa-book' },
              { id: 'feestructure', label: 'Approved Fee Schedules', icon: 'fa-tags' },
              { id: 'reconciliation', label: 'Bank & RRR Reconciliation', icon: 'fa-check-double' },
              { id: 'securityTest', label: 'Security & Access Isolation', icon: 'fa-shield-alt' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <i className={`fas ${tab.icon}`}></i>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Security alert notification if triggered */}
      {securityDeniedAlert && (
        <div className="max-w-7xl mx-auto w-full p-4">
          <div className="p-4 rounded-xl bg-red-950/90 border-2 border-red-600 text-red-200 flex items-start justify-between shadow-2xl">
            <div className="flex gap-3">
              <i className="fas fa-exclamation-triangle text-2xl text-red-400 mt-0.5"></i>
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider text-red-400">
                  SECURITY POLICY ENFORCEMENT ENGINE — ACCESS REJECTED
                </h4>
                <p className="text-xs mt-1 font-mono text-red-100">{securityDeniedAlert}</p>
                <p className="text-[11px] text-red-300 mt-2 font-semibold">
                  Event logged to immutable System Audit Trail: <code>SYS_SECURITY_BLOCK_EVENT</code>
                </p>
              </div>
            </div>
            <button
              onClick={() => setSecurityDeniedAlert(null)}
              className="text-red-400 hover:text-white text-sm px-2 py-1 rounded"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1 space-y-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total School Receipts</span>
                    <h3 className="text-2xl font-black text-amber-400 mt-1">₦{totalCollections.toLocaleString()}</h3>
                    <p className="text-[11px] text-emerald-400 mt-1 font-semibold">
                      <i className="fas fa-check-circle mr-1"></i> CBN NIBSS & Bank Verified
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                    <i className="fas fa-coins text-lg"></i>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Transactions</span>
                    <h3 className="text-2xl font-black text-white mt-1">{payments.length}</h3>
                    <p className="text-[11px] text-slate-400 mt-1">Second Term 2020/21</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                    <i className="fas fa-receipt text-lg"></i>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reconciliation Status</span>
                    <h3 className="text-2xl font-black text-emerald-400 mt-1">100% Balanced</h3>
                    <p className="text-[11px] text-slate-400 mt-1">Bank Statement Matched</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <i className="fas fa-balance-scale text-lg"></i>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Department Domain</span>
                    <h3 className="text-lg font-black text-white mt-1">Statutory School Fees</h3>
                    <p className="text-[11px] text-amber-300/80 mt-1 font-semibold">Strictly Isolated from PTA Funds</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                    <i className="fas fa-lock text-lg"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    School Fee Collections by Budget Category
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">₦ Nigerian Naira</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8 }} />
                      <Bar dataKey="amount" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">
                    Department Integrity Notice
                  </h3>
                  <div className="p-3 bg-amber-950/40 border border-amber-600/40 rounded-xl text-xs space-y-2 text-amber-200">
                    <p className="font-bold flex items-center gap-1.5">
                      <i className="fas fa-balance-scale"></i> Dual Treasury Protocol
                    </p>
                    <p>
                      School tuition and administrative accounts are strictly separated from Parent-Teacher Association (PTA) accounts.
                    </p>
                    <p className="text-[11px] text-amber-300">
                      As Bursar, you have no authority to approve or disperse PTA capital levies. The elected PTA Financial Secretary manages those independently.
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                  <button
                    onClick={() => setActiveTab('collect')}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <i className="fas fa-plus-circle"></i> Issue New Student Fee Receipt
                  </button>
                  <button
                    onClick={handleAttemptPTATamper}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer border border-slate-700 flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-bug text-red-400"></i> Test PTA Cross-Domain Isolation Rule
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COLLECT / ISSUE RECEIPT */}
        {activeTab === 'collect' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">Direct Entry</span>
                <h3 className="text-lg font-black text-white">Issue Official Bursary Fee Receipt</h3>
                <p className="text-xs text-slate-400">
                  Generate verified payment voucher for student academic tuition and laboratory fees.
                </p>
              </div>

              <form onSubmit={handlePostPayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Select Enrolled Student *</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    {MOCK_STUDENTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.studentNo} — {s.firstName} {s.lastName} ({s.formClass})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Fee Item Description *</label>
                    <select
                      value={payFeeItem}
                      onChange={(e) => setPayFeeItem(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="Standard Senior Tuition Fee">Standard Senior Tuition Fee (₦150,000)</option>
                      <option value="Science Laboratory Consumables">Science Laboratory Consumables (₦45,000)</option>
                      <option value="ICT / CBT Exam Facility Fee">ICT / CBT Exam Facility Fee (₦25,000)</option>
                      <option value="Library & e-Learning Access">Library & e-Learning Access (₦15,000)</option>
                      <option value="Full Comprehensive Term Clearance">Full Comprehensive Term Clearance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Amount Paid (₦ NGN) *</label>
                    <input
                      type="number"
                      value={payAmount}
                      onChange={(e) => setPayAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Payment Method / Channel *</label>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="Bank Transfer (CBN NIBSS)">Bank Transfer (CBN NIBSS)</option>
                      <option value="Remita RRR">Remita RRR (Federal Treasury)</option>
                      <option value="POS Terminal">POS Card Terminal</option>
                      <option value="Direct Teller (National Bank)">Direct Bank Teller</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Bank Ref / Teller / RRR No.</label>
                    <input
                      type="text"
                      placeholder="e.g. NIP/20261009/982019"
                      value={payBankRef}
                      onChange={(e) => setPayBankRef(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition cursor-pointer shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-print"></i> Generate & Post Bursary Official Receipt
                  </button>
                </div>
              </form>
            </div>

            {/* Receipt Preview Card */}
            <div>
              {receiptSuccess ? (
                <div className="bg-white text-slate-900 rounded-2xl p-6 shadow-2xl border-4 border-amber-500 relative">
                  <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                    PAID & VERIFIED
                  </div>
                  <div className="text-center border-b border-slate-200 pb-4">
                    <p className="text-xs font-black tracking-widest text-slate-600">NIGERIAN DEFENCE ACADEMY</p>
                    <h2 className="text-base font-black text-slate-900">STAFF SECONDARY SCHOOL (NDASSS)</h2>
                    <p className="text-[11px] text-slate-500">P.M.B. 2109, KADUNA • BURSARY ACCOUNTS DEPARTMENT</p>
                    <h4 className="text-xs font-black uppercase text-amber-700 mt-2 tracking-wider">
                      OFFICIAL FEES RECEIPT
                    </h4>
                  </div>

                  <div className="py-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Receipt Number:</span>
                      <span className="font-mono font-bold text-slate-800">{receiptSuccess.receiptNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Student Name:</span>
                      <span className="font-bold text-slate-900">{receiptSuccess.studentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Admission No / Class:</span>
                      <span className="font-bold text-slate-800">
                        {receiptSuccess.admissionNo} ({receiptSuccess.class})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment Purpose:</span>
                      <span className="font-semibold text-slate-800">{receiptSuccess.feeItem}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Channel / Ref:</span>
                      <span className="font-mono text-slate-700">{receiptSuccess.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Transaction Reference:</span>
                      <span className="font-mono text-slate-700">{receiptSuccess.bankReference}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black">
                      <span>Total Amount Paid:</span>
                      <span className="text-emerald-700 font-mono">₦{receiptSuccess.amountPaid.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-slate-300 pt-4 mt-2 flex justify-between items-end text-[10px] text-slate-500">
                    <div>
                      <p>Date: {receiptSuccess.paymentDate}</p>
                      <p>Issued By: {receiptSuccess.receivedBy}</p>
                    </div>
                    <div className="text-right">
                      <div className="w-24 border-b border-slate-700 mb-1"></div>
                      <p className="font-bold text-slate-700">Bursar Official Stamp</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center text-slate-500">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-2xl text-slate-600 mb-3">
                    <i className="fas fa-file-invoice-dollar"></i>
                  </div>
                  <h4 className="text-sm font-bold text-slate-300">Live Receipt Preview</h4>
                  <p className="text-xs max-w-sm mt-1">
                    Fill out the payment collection form on the left to generate an authentic NDASSS bursary payment voucher.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: TUITION & FEES LEDGER */}
        {activeTab === 'ledger' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-black text-white">NDASSS General Tuition & Fees Ledger</h3>
                <p className="text-xs text-slate-400">
                  Comprehensive audit journal of all student fee credits, bank references, and official receipts.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Search student, adm no, receipt..."
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <select
                  value={ledgerMethod}
                  onChange={(e) => setLedgerMethod(e.target.value)}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                >
                  <option value="All">All Channels</option>
                  <option value="Bank Transfer (CBN NIBSS)">CBN NIBSS</option>
                  <option value="Remita RRR">Remita RRR</option>
                  <option value="Direct Teller (National Bank)">Bank Teller</option>
                  <option value="POS Terminal">POS Card</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-800/80 text-slate-300 uppercase tracking-wider font-bold border-b border-slate-700">
                    <th className="p-3">Receipt No</th>
                    <th className="p-3">Adm No</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Class</th>
                    <th className="p-3">Purpose</th>
                    <th className="p-3">Channel / Bank Ref</th>
                    <th className="p-3 text-right">Amount (₦)</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredPayments.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/50 transition">
                      <td className="p-3 font-mono font-bold text-amber-400">{item.receiptNumber}</td>
                      <td className="p-3 font-mono text-slate-300">{item.admissionNo}</td>
                      <td className="p-3 font-bold text-white">{item.studentName}</td>
                      <td className="p-3 text-slate-300">{item.class}</td>
                      <td className="p-3 text-slate-300">{item.feeItem}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-400">
                        {item.paymentMethod}
                        <br />
                        <span className="text-slate-500">{item.bankReference}</span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400">
                        ₦{item.amountPaid.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: FEE SCHEDULES */}
        {activeTab === 'feestructure' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">NDASSS Approved Institutional Fee Schedule</h3>
              <p className="text-xs text-slate-400">
                Official approved rates ratified by the School Management and Ministry of Defence Education Directorate.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {feeItems.map((fee) => (
                <div key={fee.id} className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {fee.code}
                    </span>
                    <span className="text-xs text-slate-400">{fee.term}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{fee.name}</h4>
                  <p className="text-xs text-slate-400">Applicable to: {fee.applicableClass}</p>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-700/60">
                    <span className="text-xs text-slate-400">Standard Rate:</span>
                    <span className="text-base font-black text-amber-400 font-mono">
                      ₦{fee.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: BANK RECONCILIATION */}
        {activeTab === 'reconciliation' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-white">National Bank & CBN NIBSS Statement Reconciliation</h3>
                <p className="text-xs text-slate-400">
                  Electronic auto-matching between school bank settlement accounts and bursary receipt ledgers.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <i className="fas fa-check"></i> Audit Clearance Passed
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                <span className="text-xs text-slate-400">Bank Settlement Balance</span>
                <p className="text-xl font-black text-emerald-400 mt-1">₦184,350,000.00</p>
                <p className="text-[11px] text-slate-400 mt-1">National Bank Kad. Main Branch</p>
              </div>
              <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                <span className="text-xs text-slate-400">Unreconciled In-Transit Items</span>
                <p className="text-xl font-black text-white mt-1">₦0.00</p>
                <p className="text-[11px] text-emerald-400 mt-1">Zero Discrepancy</p>
              </div>
              <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                <span className="text-xs text-slate-400">Auditor Status</span>
                <p className="text-xl font-black text-amber-400 mt-1">Certified</p>
                <p className="text-[11px] text-slate-400 mt-1">Federal Audit Unit</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SECURITY TEST */}
        {activeTab === 'securityTest' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">Department Isolation & RBAC Penetration Verification</h3>
              <p className="text-xs text-slate-400">
                Simulate deliberate boundary violation attempts to verify that the Bursar role cannot tamper with PTA funds or examination grades.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <i className="fas fa-hand-holding-usd text-lg"></i>
                  <h4>Test 1: Attempt to Approve PTA Capital Levy</h4>
                </div>
                <p className="text-xs text-slate-300">
                  Statutory Rule: The Bursar administers School accounts only. PTA funds are independently governed by the elected PTA Financial Secretary.
                </p>
                <button
                  onClick={handleAttemptPTATamper}
                  className="px-4 py-2 rounded-lg bg-red-950 hover:bg-red-900 text-red-200 border border-red-700 text-xs font-bold transition cursor-pointer flex items-center gap-2"
                >
                  <i className="fas fa-bolt"></i> Trigger PTA Levy Approval Attempt
                </button>
              </div>

              <div className="p-5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <i className="fas fa-graduation-cap text-lg"></i>
                  <h4>Test 2: Attempt to Edit Examination Results</h4>
                </div>
                <p className="text-xs text-slate-300">
                  Academic Confidentiality Rule: Finance department personnel must never possess write or moderation access to student CAT and exam marks.
                </p>
                <button
                  onClick={handleAttemptExamTamper}
                  className="px-4 py-2 rounded-lg bg-red-950 hover:bg-red-900 text-red-200 border border-red-700 text-xs font-bold transition cursor-pointer flex items-center gap-2"
                >
                  <i className="fas fa-bolt"></i> Trigger Exam Score Edit Attempt
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

import React, { useState } from 'react';
import {
  INITIAL_PTA_LEVIES,
  INITIAL_PTA_PAYMENTS,
  INITIAL_PTA_EXPENSES,
  PtaLevy,
  PtaPaymentRecord,
  PtaExpense
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

interface PtaSecretaryDashboardProps {
  currentUser: UserAccount;
  onLogout: () => void;
  onSwitchUser?: (user: UserAccount) => void;
}

export const PtaSecretaryDashboard: React.FC<PtaSecretaryDashboardProps> = ({
  currentUser,
  onLogout,
  onSwitchUser
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'collect' | 'levies' | 'disbursements' | 'ledger' | 'securityTest'
  >('overview');

  const [levies, setLevies] = useState<PtaLevy[]>(INITIAL_PTA_LEVIES);
  const [payments, setPayments] = useState<PtaPaymentRecord[]>(INITIAL_PTA_PAYMENTS);
  const [expenses, setExpenses] = useState<PtaExpense[]>(INITIAL_PTA_EXPENSES);

  // New Levy collection state
  const [selectedStudentId, setSelectedStudentId] = useState(MOCK_STUDENTS[0].id);
  const [selectedLevyId, setSelectedLevyId] = useState(levies[0].id);
  const [payAmount, setPayAmount] = useState<number>(25000);
  const [payChannel, setPayChannel] = useState<PtaPaymentRecord['channel']>(
    'Bank Transfer (PTA Dedicated Account)'
  );
  const [bankRef, setBankRef] = useState('');
  const [receiptSuccess, setReceiptSuccess] = useState<PtaPaymentRecord | null>(null);

  // New Disbursement Proposal State
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState<number>(500000);
  const [expCategory, setExpCategory] = useState<PtaExpense['category']>('Infrastructure & Projects');
  const [expBeneficiary, setExpBeneficiary] = useState('');
  const [expSuccessMessage, setExpSuccessMessage] = useState<string | null>(null);

  // Security test state
  const [securityDeniedAlert, setSecurityDeniedAlert] = useState<string | null>(null);

  // Calculations
  const totalPtaCollected = payments.reduce((acc, p) => acc + p.amountPaid, 0);
  const totalPtaDisbursed = expenses.reduce((acc, e) => acc + e.amount, 0);
  const ptaCashBalance = 49550000 - totalPtaDisbursed + totalPtaCollected;

  const handlePostPtaPayment = (e: React.FormEvent) => {
    e.preventDefault();

    // Verify PTA security clearance
    const check = SecurityController.verifyAccess(currentUser, 'CREATE', 'PTA_LEVIES');
    if (!check.allowed) {
      setSecurityDeniedAlert(check.reason);
      return;
    }

    const student = MOCK_STUDENTS.find((s) => s.id === selectedStudentId) || MOCK_STUDENTS[0];
    const levy = levies.find((l) => l.id === selectedLevyId) || levies[0];

    const newPayment: PtaPaymentRecord = {
      id: `PTA-PAY-${Date.now()}`,
      ptaReceiptNo: `PTA-REC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      admissionNo: student.studentNo,
      parentName: student.guardianName,
      parentPhone: student.guardianPhone,
      class: student.formClass,
      levyTitle: levy.title,
      amountPaid: Number(payAmount),
      paymentDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
      channel: payChannel,
      bankRef: bankRef || `FBN-PTA-TX-${Math.floor(1000000 + Math.random() * 9000000)}`,
      ptaAccount: 'First Bank of Nigeria (PTA Acct: 2038471920)',
      receivedBy: currentUser.name,
      reconciliationStatus: 'RECONCILED'
    };

    setPayments([newPayment, ...payments]);
    setReceiptSuccess(newPayment);
    setBankRef('');
  };

  const handleCreateDisbursement = (e: React.FormEvent) => {
    e.preventDefault();

    const check = SecurityController.verifyAccess(currentUser, 'APPROVE', 'PTA_ACCOUNTS');
    if (!check.allowed) {
      setSecurityDeniedAlert(check.reason);
      return;
    }

    const newExp: PtaExpense = {
      id: `PTA-EXP-${Date.now()}`,
      voucherNo: `PTA-VOUCH-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: expTitle,
      category: expCategory,
      amount: Number(expAmount),
      date: new Date().toISOString().substring(0, 10),
      beneficiary: expBeneficiary,
      approvedBy: `Col. T. Aliyu (PTA Chairman) & ${currentUser.name}`,
      status: 'APPROVED'
    };

    setExpenses([newExp, ...expenses]);
    setExpSuccessMessage(`Payment voucher ${newExp.voucherNo} successfully approved and posted.`);
    setExpTitle('');
    setExpBeneficiary('');
    setTimeout(() => setExpSuccessMessage(null), 4000);
  };

  const handleAttemptAccessBursaryLedger = () => {
    const check = SecurityController.verifyAccess(currentUser, 'VIEW', 'BURSARY_LEDGER');
    if (!check.allowed) {
      setSecurityDeniedAlert(check.reason);
    }
  };

  const handleAttemptAccessExamRecords = () => {
    const check = SecurityController.verifyAccess(currentUser, 'VIEW', 'EXAM_SCORES');
    if (!check.allowed) {
      setSecurityDeniedAlert(check.reason);
    }
  };

  const pieData = [
    { name: 'Solar Project', value: 28450000, color: '#10b981' },
    { name: 'Teacher Stipends', value: 13800000, color: '#3b82f6' },
    { name: 'Perimeter Security', value: 21100000, color: '#f59e0b' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-md text-lg">
              <i className="fas fa-hand-holding-usd"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  PTA EXECUTIVE PORTAL
                </span>
                <span className="text-xs text-slate-400 font-mono">PTA DEPARTMENT (INDEPENDENT)</span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-white leading-tight">
                NDASSS Parent-Teacher Association Financial Secretariat
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white">{currentUser.name}</p>
              <p className="text-[11px] text-emerald-400 font-semibold">{currentUser.roleTitle}</p>
            </div>
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>

        {/* Sub-nav */}
        <div className="border-t border-slate-800 bg-slate-900/60 px-4 sm:px-6 overflow-x-auto">
          <div className="max-w-7xl mx-auto flex space-x-2 py-2">
            {[
              { id: 'overview', label: 'PTA Treasury Overview', icon: 'fa-chart-pie' },
              { id: 'collect', label: 'Collect PTA Levy', icon: 'fa-money-bill-wave' },
              { id: 'levies', label: 'Approved PTA Projects', icon: 'fa-tasks' },
              { id: 'disbursements', label: 'Expenditures & Vouchers', icon: 'fa-file-invoice' },
              { id: 'ledger', label: 'PTA Receipt Ledger', icon: 'fa-receipt' },
              { id: 'securityTest', label: 'Domain Isolation Tests', icon: 'fa-shield-alt' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1 space-y-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      PTA Bank Balance
                    </span>
                    <h3 className="text-2xl font-black text-emerald-400 mt-1">
                      ₦{ptaCashBalance.toLocaleString()}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 font-semibold">
                      First Bank Dedicated PTA Account
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <i className="fas fa-vault text-lg"></i>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Levies Collected
                    </span>
                    <h3 className="text-2xl font-black text-white mt-1">₦63,350,000</h3>
                    <p className="text-[11px] text-emerald-400 mt-1 font-semibold">
                      <i className="fas fa-arrow-up mr-1"></i> 89.2% Target Achieved
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                    <i className="fas fa-hand-holding-usd text-lg"></i>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Disbursed Projects
                    </span>
                    <h3 className="text-2xl font-black text-amber-400 mt-1">
                      ₦{totalPtaDisbursed.toLocaleString()}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">3 Completed Vouchers</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                    <i className="fas fa-solar-panel text-lg"></i>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Statutory Autonomy
                    </span>
                    <h3 className="text-lg font-black text-white mt-1">Elected Executive</h3>
                    <p className="text-[11px] text-emerald-300 mt-1 font-semibold">
                      Independent of School Bursar
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                    <i className="fas fa-users-cog text-lg"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">
                  PTA Special Development Levy Allocations
                </h3>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 text-xs mt-2">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></span>
                      <span className="text-slate-300 font-bold">{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">
                    PTA Statutory Charter Notice
                  </h3>
                  <div className="p-3 bg-emerald-950/40 border border-emerald-600/40 rounded-xl text-xs space-y-2 text-emerald-200">
                    <p className="font-bold flex items-center gap-1.5">
                      <i className="fas fa-certificate"></i> Independence from School Bursary
                    </p>
                    <p>
                      PTA levies are collected on behalf of the Parents and Teachers Association, NOT the Nigerian Defence Academy Treasury.
                    </p>
                    <p className="text-[11px] text-emerald-300">
                      Disbursements require dual sign-off from the PTA Chairman and PTA Financial Secretary.
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                  <button
                    onClick={() => setActiveTab('collect')}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <i className="fas fa-receipt"></i> Issue PTA Levy Receipt
                  </button>
                  <button
                    onClick={handleAttemptAccessBursaryLedger}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer border border-slate-700 flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-bug text-red-400"></i> Test School Bursary Isolation Block
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COLLECT PTA LEVY */}
        {activeTab === 'collect' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">Levy Collection</span>
                <h3 className="text-lg font-black text-white">Record PTA Parent Levy Payment</h3>
                <p className="text-xs text-slate-400">
                  Issue dedicated PTA official receipt into the First Bank PTA account.
                </p>
              </div>

              <form onSubmit={handlePostPtaPayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Select Student / Parent *</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {MOCK_STUDENTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.studentNo} — {s.firstName} {s.lastName} (Parent: {s.guardianName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Approved PTA Project Levy *</label>
                  <select
                    value={selectedLevyId}
                    onChange={(e) => setSelectedLevyId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {levies.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title} (₦{l.amount.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Amount Paid (₦ NGN) *</label>
                    <input
                      type="number"
                      value={payAmount}
                      onChange={(e) => setPayAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Payment Channel *</label>
                    <select
                      value={payChannel}
                      onChange={(e) => setPayChannel(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Bank Transfer (PTA Dedicated Account)">Bank Transfer (First Bank PTA)</option>
                      <option value="Direct Cash to Fin Sec">Direct Cash to Fin Sec</option>
                      <option value="POS Receipt">PTA POS Receipt</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Bank Reference / Teller</label>
                  <input
                    type="text"
                    placeholder="e.g. FBN-PTA-TX-9901829"
                    value={bankRef}
                    onChange={(e) => setBankRef(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-print"></i> Generate Official PTA Receipt
                  </button>
                </div>
              </form>
            </div>

            {/* Receipt Preview */}
            <div>
              {receiptSuccess ? (
                <div className="bg-white text-slate-900 rounded-2xl p-6 shadow-2xl border-4 border-emerald-500 relative">
                  <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                    PTA TREASURY CLEARED
                  </div>
                  <div className="text-center border-b border-slate-200 pb-4">
                    <p className="text-xs font-black tracking-widest text-slate-600">NDASSS PARENTS-TEACHERS ASSOCIATION</p>
                    <h2 className="text-base font-black text-slate-900">PTA FINANCIAL SECRETARIAT</h2>
                    <p className="text-[11px] text-slate-500">P.M.B. 2109, KADUNA • FIRST BANK A/C: 2038471920</p>
                    <h4 className="text-xs font-black uppercase text-emerald-700 mt-2 tracking-wider">
                      OFFICIAL PTA LEVY RECEIPT
                    </h4>
                  </div>

                  <div className="py-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Receipt No:</span>
                      <span className="font-mono font-bold text-slate-800">{receiptSuccess.ptaReceiptNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Student Name:</span>
                      <span className="font-bold text-slate-900">{receiptSuccess.studentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Parent / Guardian:</span>
                      <span className="font-bold text-slate-800">{receiptSuccess.parentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Project Levy:</span>
                      <span className="font-semibold text-slate-800">{receiptSuccess.levyTitle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Channel / Account:</span>
                      <span className="font-mono text-slate-700">{receiptSuccess.channel}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black">
                      <span>Amount Received:</span>
                      <span className="text-emerald-700 font-mono">₦{receiptSuccess.amountPaid.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-slate-300 pt-4 mt-2 flex justify-between items-end text-[10px] text-slate-500">
                    <div>
                      <p>Date: {receiptSuccess.paymentDate}</p>
                      <p>Fin Sec: {receiptSuccess.receivedBy}</p>
                    </div>
                    <div className="text-right">
                      <div className="w-24 border-b border-slate-700 mb-1"></div>
                      <p className="font-bold text-slate-700">PTA Executive Seal</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center text-slate-500">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-2xl text-slate-600 mb-3">
                    <i className="fas fa-hand-holding-usd"></i>
                  </div>
                  <h4 className="text-sm font-bold text-slate-300">Live PTA Receipt Preview</h4>
                  <p className="text-xs max-w-sm mt-1">
                    Fill the form on the left to create and preview an official PTA development levy voucher.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: APPROVED PTA LEVIES */}
        {activeTab === 'levies' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">General Assembly Approved PTA Development Levies</h3>
              <p className="text-xs text-slate-400">
                Capital development projects deliberated and voted upon by parents and teachers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {levies.map((l) => (
                <div key={l.id} className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {l.code}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-300">
                      {l.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{l.title}</h4>
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Collected: ₦{(l.collectedAmount / 1000000).toFixed(1)}M</span>
                      <span>Target: ₦{(l.targetAmount / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, (l.collectedAmount / l.targetAmount) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-700/60 text-xs">
                    <span className="text-slate-400">Levy Per Student:</span>
                    <span className="text-emerald-400 font-mono font-bold">₦{l.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: DISBURSEMENTS */}
        {activeTab === 'disbursements' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">Expense Authorizations</span>
                <h3 className="text-lg font-black text-white">PTA Expenditure Payment Vouchers</h3>
                <p className="text-xs text-slate-400">
                  Dual authorization workflow with PTA Chairman and PTA Financial Secretary signatures.
                </p>
              </div>

              {expSuccessMessage && (
                <div className="p-3 bg-emerald-950 border border-emerald-500 rounded-lg text-emerald-300 text-xs font-bold">
                  {expSuccessMessage}
                </div>
              )}

              <form onSubmit={handleCreateDisbursement} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Project Expense Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Science Laboratory Gas Piping"
                    value={expTitle}
                    onChange={(e) => setExpTitle(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Amount (₦)</label>
                  <input
                    type="number"
                    value={expAmount}
                    onChange={(e) => setExpAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Beneficiary Vendor</label>
                  <input
                    type="text"
                    placeholder="e.g. Arewa Supplies Nig Ltd"
                    value={expBeneficiary}
                    onChange={(e) => setExpBeneficiary(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                    required
                  />
                </div>
                <div className="md:col-span-4 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-xs transition cursor-pointer flex items-center gap-2"
                  >
                    <i className="fas fa-check-circle"></i> Authorize & Sign PTA Voucher
                  </button>
                </div>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800/80 text-slate-300 uppercase tracking-wider font-bold border-b border-slate-700">
                      <th className="p-3">Voucher No</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Expense Title</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Beneficiary</th>
                      <th className="p-3 text-right">Amount (₦)</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-800/50 transition">
                        <td className="p-3 font-mono font-bold text-emerald-400">{exp.voucherNo}</td>
                        <td className="p-3 text-slate-400">{exp.date}</td>
                        <td className="p-3 font-bold text-white">{exp.title}</td>
                        <td className="p-3 text-slate-300">{exp.category}</td>
                        <td className="p-3 text-slate-300">{exp.beneficiary}</td>
                        <td className="p-3 text-right font-mono font-bold text-amber-400">
                          ₦{exp.amount.toLocaleString()}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {exp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: LEDGER */}
        {activeTab === 'ledger' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-white">PTA Receipts Journal</h3>
                <p className="text-xs text-slate-400">
                  Continuous record of all Parent-Teacher Association levy payments.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                Total: ₦{payments.reduce((a, b) => a + b.amountPaid, 0).toLocaleString()}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-800/80 text-slate-300 uppercase tracking-wider font-bold border-b border-slate-700">
                    <th className="p-3">Receipt No</th>
                    <th className="p-3">Student / Adm No</th>
                    <th className="p-3">Parent Name</th>
                    <th className="p-3">Levy Title</th>
                    <th className="p-3">Bank Ref</th>
                    <th className="p-3 text-right">Amount (₦)</th>
                    <th className="p-3">Reconciliation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/50 transition">
                      <td className="p-3 font-mono font-bold text-emerald-400">{p.ptaReceiptNo}</td>
                      <td className="p-3">
                        <span className="font-bold text-white">{p.studentName}</span>
                        <br />
                        <span className="font-mono text-slate-400">{p.admissionNo} ({p.class})</span>
                      </td>
                      <td className="p-3 text-slate-300">{p.parentName}</td>
                      <td className="p-3 text-slate-300">{p.levyTitle}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-400">{p.bankRef}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400">
                        ₦{p.amountPaid.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {p.reconciliationStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: SECURITY TEST */}
        {activeTab === 'securityTest' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">PTA Department Boundary & Privilege Tests</h3>
              <p className="text-xs text-slate-400">
                Demonstrates that the PTA Financial Secretary has zero authorization to view or alter School Tuition ledgers or confidential academic marks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <i className="fas fa-university text-lg"></i>
                  <h4>Test 1: Attempt to Inspect School Bursary Ledger</h4>
                </div>
                <p className="text-xs text-slate-300">
                  Separation Rule: PTA officials must not have visibility into school tuition revenue, staff payroll, or NDA administrative funds.
                </p>
                <button
                  onClick={handleAttemptAccessBursaryLedger}
                  className="px-4 py-2 rounded-lg bg-red-950 hover:bg-red-900 text-red-200 border border-red-700 text-xs font-bold transition cursor-pointer flex items-center gap-2"
                >
                  <i className="fas fa-bolt"></i> Attempt School Bursary Inspection
                </button>
              </div>

              <div className="p-5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <i className="fas fa-graduation-cap text-lg"></i>
                  <h4>Test 2: Attempt to Inspect Examination Records</h4>
                </div>
                <p className="text-xs text-slate-300">
                  Confidentiality Rule: PTA executives have no clearance to access raw continuous assessment sheets or examination results.
                </p>
                <button
                  onClick={handleAttemptAccessExamRecords}
                  className="px-4 py-2 rounded-lg bg-red-950 hover:bg-red-900 text-red-200 border border-red-700 text-xs font-bold transition cursor-pointer flex items-center gap-2"
                >
                  <i className="fas fa-bolt"></i> Attempt Exam Records Access
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

import React, { useState } from 'react';
import { SYSTEM_USERS, UserAccount, SecurityController, Department } from '../services/securityService';
import { MOCK_AUDIT_LOGS } from '../data/mockData';
import { AuditLogEntry } from '../types';

interface DepartmentAuthorizationProps {
  currentUser: UserAccount;
  onSelectUserToSimulate: (user: UserAccount) => void;
}

export const DepartmentAuthorizationView: React.FC<DepartmentAuthorizationProps> = ({
  currentUser,
  onSelectUserToSimulate
}) => {
  const [users, setUsers] = useState<UserAccount[]>(SYSTEM_USERS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(MOCK_AUDIT_LOGS);
  const [filterDept, setFilterDept] = useState<string>('All');
  const [filterRole, setFilterRole] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'matrix' | 'users' | 'audit' | 'simulation'>('matrix');

  // Interactive Live Matrix Tester
  const [testUser, setTestUser] = useState<UserAccount>(currentUser);
  const [testAction, setTestAction] = useState<'VIEW' | 'CREATE' | 'EDIT' | 'APPROVE' | 'EXPORT' | 'DELETE'>('VIEW');
  const [testResource, setTestResource] = useState<
    | 'EXAM_SCORES'
    | 'EXAM_TIMETABLE'
    | 'BROADSHEET'
    | 'BURSARY_FEES'
    | 'BURSARY_LEDGER'
    | 'PTA_LEVIES'
    | 'PTA_ACCOUNTS'
    | 'STUDENT_RECORDS'
    | 'SYSTEM_AUDIT_LOGS'
    | 'SECURITY_PERMISSIONS'
  >('BURSARY_FEES');

  const [testResult, setTestResult] = useState<{
    tested: boolean;
    allowed: boolean;
    reason: string;
    isolationRule?: string;
  } | null>(null);

  const handleRunTest = () => {
    const res = SecurityController.verifyAccess(testUser, testAction, testResource as any);
    setTestResult({
      tested: true,
      allowed: res.allowed,
      reason: res.reason,
      isolationRule: res.isolationRule
    });

    // Add to audit trail
    const newLog: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: testUser.name,
      userId: testUser.id,
      role: testUser.roleTitle,
      department: testUser.department,
      action: `SEC_CHECK_${testAction}_${testResource}`,
      recordTable: testResource,
      recordId: 'RBAC_EVALUATION',
      reason: res.reason,
      status: res.allowed ? 'SUCCESS' : 'DENIED',
      ipAddress: '192.168.10.25'
    };
    setAuditLogs([newLog, ...auditLogs]);
  };

  const filteredUsers = users.filter((u) => {
    const matchesDept = filterDept === 'All' || u.department === filterDept;
    const matchesRole = filterRole === 'All' || u.role === filterRole;
    return matchesDept && matchesRole;
  });

  const matrixRules = [
    {
      resource: 'Examination Scores / CA Records',
      dept: 'Examination & Academic',
      examOfficer: 'FULL WRITE / MODERATE',
      bursar: 'BLOCKED (NO ACCESS)',
      ptaSec: 'BLOCKED (NO ACCESS)',
      teachers: 'ENTER SCORES (ASSIGNED ONLY)',
      students: 'VIEW APPROVED ONLY'
    },
    {
      resource: 'School Tuition & Bursary Ledger',
      dept: 'Finance Department',
      examOfficer: 'BLOCKED (STRICT ISOLATION)',
      bursar: 'FULL ACCESS / RECEIPTING',
      ptaSec: 'BLOCKED (CROSS-DOMAIN ISOLATION)',
      teachers: 'BLOCKED',
      students: 'VIEW OWN BALANCE'
    },
    {
      resource: 'PTA Development Levies & Vouchers',
      dept: 'PTA Secretariat (Independent)',
      examOfficer: 'BLOCKED (NO ACCESS)',
      bursar: 'BLOCKED (CANNOT APPROVE)',
      ptaSec: 'FULL CONTROL / DISBURSEMENT',
      teachers: 'BLOCKED',
      students: 'VIEW OWN LEVY RECEIPT'
    },
    {
      resource: 'Terminal Broadsheet & Dossiers',
      dept: 'Examination & Administration',
      examOfficer: 'GENERATE & VET',
      bursar: 'BLOCKED',
      ptaSec: 'BLOCKED',
      teachers: 'VIEW CLASS ONLY',
      students: 'BLOCKED'
    },
    {
      resource: 'Security & Access Control Settings',
      dept: 'Administration & ICT',
      examOfficer: 'BLOCKED',
      bursar: 'BLOCKED',
      ptaSec: 'BLOCKED',
      teachers: 'BLOCKED',
      students: 'BLOCKED'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Sub Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                ARCHITECTURE MODULE
              </span>
              <span className="text-xs text-slate-400 font-mono">DEPARTMENT + ROLE + PERMISSION + SCOPE</span>
            </div>
            <h2 className="text-xl font-black text-white mt-1">
              Department-Based Authorization & RBAC Engine
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Strict multi-tenant department isolation ensuring zero unauthorized data leaks between Examination, School Bursary, and PTA Treasury.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {[
              { id: 'matrix', label: 'Access Matrix', icon: 'fa-table' },
              { id: 'simulation', label: 'Security Simulator', icon: 'fa-user-shield' },
              { id: 'users', label: 'Authorized Personnels', icon: 'fa-id-badge' },
              { id: 'audit', label: 'System Audit Trail', icon: 'fa-history' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <i className={`fas ${tab.icon}`}></i>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TAB 1: ACCESS MATRIX */}
      {activeTab === 'matrix' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-black text-white">Department Isolation Access Control Matrix</h3>
            <p className="text-xs text-slate-400">
              Clear mathematical separation preventing cross-domain compromise even if URL or database IDs are discovered.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800/80 text-slate-200 uppercase tracking-wider font-bold border-b border-slate-700">
                  <th className="p-3">Resource / Information Domain</th>
                  <th className="p-3">Governing Dept</th>
                  <th className="p-3 text-emerald-400">Examination Officer</th>
                  <th className="p-3 text-amber-400">School Bursar</th>
                  <th className="p-3 text-teal-400">PTA Financial Sec</th>
                  <th className="p-3 text-blue-400">Teachers</th>
                  <th className="p-3 text-slate-400">Students / Parents</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {matrixRules.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-800/50 transition">
                    <td className="p-3 font-sans font-bold text-white">{r.resource}</td>
                    <td className="p-3 font-sans text-slate-300">{r.dept}</td>
                    <td className="p-3 text-emerald-300 font-semibold">{r.examOfficer}</td>
                    <td className="p-3 text-amber-300 font-semibold">{r.bursar}</td>
                    <td className="p-3 text-teal-300 font-semibold">{r.ptaSec}</td>
                    <td className="p-3 text-blue-300">{r.teachers}</td>
                    <td className="p-3 text-slate-400">{r.students}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
              <h4 className="text-xs font-black uppercase text-emerald-400 flex items-center gap-1.5">
                <i className="fas fa-lock"></i> Examination Confidentiality
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Scores, continuous assessment moderation, and broadsheets are strictly sandboxed inside the Examination and Academic offices. Finance personnel cannot tamper with marks.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
              <h4 className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                <i className="fas fa-university"></i> Statutory School Bursary
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tuition, science laboratory levies, and government treasury receipts are managed solely by the Bursar. Academic personnel and PTA executives have zero posting clearance.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
              <h4 className="text-xs font-black uppercase text-teal-400 flex items-center gap-1.5">
                <i className="fas fa-hand-holding-usd"></i> Independent PTA Funds
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                PTA special development levies and project disbursements are owned exclusively by the elected PTA Financial Secretary and PTA Chairman, avoiding conflation with school revenue.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SIMULATION & POLICY TESTER */}
      {activeTab === 'simulation' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-xs font-black uppercase tracking-wider text-blue-400">Live Decision Engine</span>
              <h3 className="text-lg font-black text-white">Interactive Security Policy Evaluator</h3>
              <p className="text-xs text-slate-400">
                Select any user, action, and target table to test the 8-point server-side security authorization check in real-time.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Simulate Subject User</label>
                <select
                  value={testUser.id}
                  onChange={(e) => {
                    const u = SYSTEM_USERS.find((x) => x.id === e.target.value);
                    if (u) setTestUser(u);
                  }}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
                >
                  {SYSTEM_USERS.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.roleTitle} ({u.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Attempted Operation</label>
                  <select
                    value={testAction}
                    onChange={(e) => setTestAction(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono"
                  >
                    <option value="VIEW">VIEW (Read)</option>
                    <option value="CREATE">CREATE (Insert)</option>
                    <option value="EDIT">EDIT (Update / Modify)</option>
                    <option value="APPROVE">APPROVE (Authorize)</option>
                    <option value="EXPORT">EXPORT (Download CSV/PDF)</option>
                    <option value="DELETE">DELETE (Destroy)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Target Data Asset</label>
                  <select
                    value={testResource}
                    onChange={(e) => setTestResource(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono"
                  >
                    <option value="EXAM_SCORES">EXAM_SCORES (Results/CAT)</option>
                    <option value="BROADSHEET">BROADSHEET (Full Class Marks)</option>
                    <option value="BURSARY_FEES">BURSARY_FEES (Tuition Receipts)</option>
                    <option value="BURSARY_LEDGER">BURSARY_LEDGER (School Accounts)</option>
                    <option value="PTA_LEVIES">PTA_LEVIES (Levy Collections)</option>
                    <option value="PTA_ACCOUNTS">PTA_ACCOUNTS (Disbursement Vouchers)</option>
                    <option value="STUDENT_RECORDS">STUDENT_RECORDS (Personal Data)</option>
                    <option value="SYSTEM_AUDIT_LOGS">SYSTEM_AUDIT_LOGS (Audit Trails)</option>
                    <option value="SECURITY_PERMISSIONS">SECURITY_PERMISSIONS (RBAC Settings)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleRunTest}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm transition cursor-pointer shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                >
                  <i className="fas fa-play"></i> Evaluate Security Policy Engine
                </button>
              </div>
            </div>
          </div>

          {/* Test Result Display */}
          <div>
            {testResult ? (
              <div
                className={`h-full rounded-2xl p-6 shadow-2xl border-2 flex flex-col justify-between ${
                  testResult.allowed
                    ? 'bg-slate-900 border-emerald-500'
                    : 'bg-slate-900 border-red-500'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <span
                      className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                        testResult.allowed
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-red-500/20 text-red-400 border border-red-500/40'
                      }`}
                    >
                      {testResult.allowed ? 'POLICY VERDICT: PERMITTED' : 'POLICY VERDICT: DENIED (BLOCKED)'}
                    </span>
                    <span className="text-xs font-mono text-slate-400">HTTP 200 OK</span>
                  </div>

                  <div className="py-4 space-y-3">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase">Evaluating Context:</span>
                      <p className="text-xs text-white font-semibold mt-0.5">
                        User: <span className="text-blue-400">{testUser.name}</span> ({testUser.roleTitle})
                        <br />
                        Department: <span className="text-amber-400">{testUser.department}</span> • Scope: {testUser.scope}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs">
                      <p className="text-slate-400 text-[11px] mb-1">Backend Reason / Policy Clause:</p>
                      <p className={testResult.allowed ? 'text-emerald-300' : 'text-red-300'}>
                        {testResult.reason}
                      </p>
                    </div>

                    {testResult.isolationRule && (
                      <div className="text-xs text-slate-400">
                        <span className="font-bold text-slate-300">Enforced Isolation Rule:</span> {testResult.isolationRule}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-500">Security Audit Trail: Active</span>
                  <button
                    onClick={() => onSelectUserToSimulate(testUser)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <i className="fas fa-sign-in-alt"></i> Switch & Log in as this User
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center text-slate-500">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-2xl text-slate-600 mb-3">
                  <i className="fas fa-shield-alt"></i>
                </div>
                <h4 className="text-sm font-bold text-slate-300">Awaiting Evaluation Test</h4>
                <p className="text-xs max-w-sm mt-1">
                  Select a user account and an action to evaluate the mathematical authorization constraints.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: AUTHORIZED USERS */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-white">Authorized School Personnel Directory</h3>
              <p className="text-xs text-slate-400">
                Staff accounts, designated departments, permission ceilings, and authorization scopes.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
              >
                <option value="All">All Departments</option>
                <option value="Administration">Administration</option>
                <option value="Academic">Academic</option>
                <option value="Examination">Examination</option>
                <option value="Finance">Finance</option>
                <option value="PTA">PTA</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((u) => (
              <div key={u.id} className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={u.avatarUrl}
                    alt={u.name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-600"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white">{u.name}</h4>
                    <p className="text-[11px] text-amber-400">{u.roleTitle}</p>
                    <span className="text-[10px] font-mono text-slate-400">ID: {u.id}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs border-t border-slate-700/60 pt-2 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Department:</span>
                    <span className="font-bold text-white">{u.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Permission:</span>
                    <span className="font-mono text-blue-400">{u.permissionLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Scope:</span>
                    <span className="font-mono text-slate-300 text-[11px]">{u.scope}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account Status:</span>
                    <span className="text-emerald-400 font-bold">{u.status}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => onSelectUserToSimulate(u)}
                    className="w-full py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <i className="fas fa-sign-in-alt"></i> Impersonate / Test Role
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-base font-black text-white">Immutable Security Audit Trail</h3>
              <p className="text-xs text-slate-400">
                Tamper-evident log of security checks, attempted privilege escalations, and cross-department blocks.
              </p>
            </div>
            <span className="text-xs font-mono text-blue-400">{auditLogs.length} Events Logged</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800/80 text-slate-300 uppercase tracking-wider font-bold border-b border-slate-700">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Officer / User</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target Table</th>
                  <th className="p-3">Policy Reason</th>
                  <th className="p-3">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/50 transition">
                    <td className="p-3 text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                    <td className="p-3 font-sans">
                      <span className="font-bold text-white">{log.user}</span>
                      <br />
                      <span className="text-slate-500">{log.role}</span>
                    </td>
                    <td className="p-3 text-slate-300">{log.department}</td>
                    <td className="p-3 text-blue-400 font-bold">{log.action}</td>
                    <td className="p-3 text-amber-300">{log.recordTable}</td>
                    <td className="p-3 font-sans text-slate-300 max-w-xs">{log.reason}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                      >
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
    </div>
  );
};

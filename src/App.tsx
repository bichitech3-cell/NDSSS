/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { NetworkBackground } from './components/NetworkBackground';
import { FloatingShapes } from './components/FloatingShapes';
import { LoginPortal } from './components/LoginPortal';
import { ForgotStudentPinView } from './components/ForgotStudentPinView';
import { RecoverPasswordModal } from './components/RecoverPasswordModal';
import { PolicyModal } from './components/PolicyModal';
import { Dashboard } from './components/Dashboard';
import { ExamOfficerDashboard } from './components/ExamOfficerDashboard';
import { BursarDashboard } from './components/BursarDashboard';
import { PtaSecretaryDashboard } from './components/PtaSecretaryDashboard';
import { UserRole } from './types';
import { SYSTEM_USERS, UserAccount } from './services/securityService';

export default function App() {
  const [currentView, setCurrentView] = useState<
    'login' | 'forgot-pin' | 'dashboard' | 'exam_officer' | 'bursar' | 'pta_secretary'
  >('login');
  const [currentUser, setCurrentUser] = useState<UserAccount>(SYSTEM_USERS[0]);
  const [isRecoverModalOpen, setIsRecoverModalOpen] = useState(false);
  const [policyModalType, setPolicyModalType] = useState<'terms' | 'privacy' | null>(null);

  const handleLoginSuccess = (role: UserRole, username: string) => {
    const matched =
      SYSTEM_USERS.find((u) => u.role === role) ||
      SYSTEM_USERS.find((u) => u.username.toLowerCase() === username.toLowerCase()) ||
      SYSTEM_USERS[0];

    setCurrentUser(matched);

    if (role === 'exam_officer') {
      setCurrentView('exam_officer');
    } else if (role === 'bursar') {
      setCurrentView('bursar');
    } else if (role === 'pta_secretary') {
      setCurrentView('pta_secretary');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentView('login');
  };

  const switchToAccount = (acc: UserAccount) => {
    setCurrentUser(acc);
    if (acc.role === 'exam_officer') {
      setCurrentView('exam_officer');
    } else if (acc.role === 'bursar') {
      setCurrentView('bursar');
    } else if (acc.role === 'pta_secretary') {
      setCurrentView('pta_secretary');
    } else {
      setCurrentView('dashboard');
    }
  };

  return (
    <div className="relative min-h-screen text-slate-100 font-sans selection:bg-orange-500 selection:text-white">
      {/* View Switcher Controls for Demonstration & Testing */}
      <div className="fixed top-2 right-2 z-50 flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-slate-700/80 shadow-2xl text-[11px] font-bold no-print">
        <span className="text-red-500 font-bold text-[10px] uppercase tracking-wider hidden sm:inline mr-1">
          NDASSS:
        </span>
        <button
          type="button"
          onClick={() => setCurrentView('login')}
          className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
            currentView === 'login'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Login Screen"
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => {
            const acc = SYSTEM_USERS.find((u) => u.role === 'exam_officer') || SYSTEM_USERS[3];
            switchToAccount(acc);
          }}
          className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
            currentView === 'exam_officer'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-emerald-300 hover:text-white hover:bg-emerald-950/70 border border-emerald-500/30'
          }`}
          title="Examination Officer Module"
        >
          Exam Officer
        </button>
        <button
          type="button"
          onClick={() => {
            const acc = SYSTEM_USERS.find((u) => u.role === 'bursar') || SYSTEM_USERS[4];
            switchToAccount(acc);
          }}
          className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
            currentView === 'bursar'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'text-amber-300 hover:text-white hover:bg-amber-950/70 border border-amber-500/30'
          }`}
          title="School Bursary & Finance Department"
        >
          Bursar
        </button>
        <button
          type="button"
          onClick={() => {
            const acc = SYSTEM_USERS.find((u) => u.role === 'pta_secretary') || SYSTEM_USERS[5];
            switchToAccount(acc);
          }}
          className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
            currentView === 'pta_secretary'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
              : 'text-teal-300 hover:text-white hover:bg-teal-950/70 border border-teal-500/30'
          }`}
          title="PTA Financial Secretary Module"
        >
          PTA Fin Sec
        </button>
        <button
          type="button"
          onClick={() => {
            const acc = SYSTEM_USERS.find((u) => u.role === 'admin') || SYSTEM_USERS[0];
            switchToAccount(acc);
          }}
          className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
            currentView === 'dashboard'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="School Admin Portal & RBAC Matrix"
        >
          Admin Portal
        </button>
      </div>

      {/* Main View Router */}
      {currentView === 'login' && (
        <div className="fe-bg-portal min-h-screen">
          <NetworkBackground />
          <FloatingShapes />
          <LoginPortal
            onLoginSuccess={handleLoginSuccess}
            onNavigateToForgotPin={() => setCurrentView('forgot-pin')}
            onOpenRecoverModal={() => setIsRecoverModalOpen(true)}
            onOpenPolicyModal={(type) => setPolicyModalType(type)}
          />
        </div>
      )}

      {currentView === 'forgot-pin' && (
        <ForgotStudentPinView onBackToLogin={() => setCurrentView('login')} />
      )}

      {currentView === 'exam_officer' && (
        <ExamOfficerDashboard
          onBackToMain={() => setCurrentView('dashboard')}
          onLogout={handleLogout}
        />
      )}

      {currentView === 'bursar' && (
        <BursarDashboard
          currentUser={currentUser.role === 'bursar' ? currentUser : SYSTEM_USERS[4]}
          onLogout={handleLogout}
          onSwitchUser={switchToAccount}
        />
      )}

      {currentView === 'pta_secretary' && (
        <PtaSecretaryDashboard
          currentUser={currentUser.role === 'pta_secretary' ? currentUser : SYSTEM_USERS[5]}
          onLogout={handleLogout}
          onSwitchUser={switchToAccount}
        />
      )}

      {currentView === 'dashboard' && (
        <Dashboard
          role={currentUser.role}
          username={currentUser.name}
          onLogout={handleLogout}
          onOpenExamOfficer={() => setCurrentView('exam_officer')}
          onOpenBursar={() => setCurrentView('bursar')}
          onOpenPta={() => setCurrentView('pta_secretary')}
        />
      )}

      {/* Shared Modals */}
      <RecoverPasswordModal
        isOpen={isRecoverModalOpen}
        onClose={() => setIsRecoverModalOpen(false)}
      />

      <PolicyModal
        type={policyModalType}
        onClose={() => setPolicyModalType(null)}
      />
    </div>
  );
}

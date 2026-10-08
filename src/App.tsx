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
import { UserRole } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<'login' | 'forgot-pin' | 'dashboard' | 'exam_officer'>('login');
  const [currentUser, setCurrentUser] = useState<{ role: UserRole; username: string } | null>(null);
  const [isRecoverModalOpen, setIsRecoverModalOpen] = useState(false);
  const [policyModalType, setPolicyModalType] = useState<'terms' | 'privacy' | null>(null);

  const handleLoginSuccess = (role: UserRole, username: string) => {
    setCurrentUser({ role, username });
    if (role === 'exam_officer') {
      setCurrentView('exam_officer');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
  };

  return (
    <div className="relative min-h-screen text-slate-100 font-sans selection:bg-orange-500 selection:text-white">
      {/* View Switcher Controls for Demonstration & Testing */}
      <div className="fixed top-2 right-2 z-50 flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-slate-700/80 shadow-2xl text-[11px] font-bold">
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
          title="UserLogin.aspx"
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setCurrentView('forgot-pin')}
          className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
            currentView === 'forgot-pin'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="ForgotStudentPin.aspx"
        >
          PIN Recovery
        </button>
        <button
          type="button"
          onClick={() => {
            if (!currentUser || currentUser.role !== 'exam_officer') {
              setCurrentUser({ role: 'exam_officer', username: 'Dr. A. S. Danjuma' });
            }
            setCurrentView('exam_officer');
          }}
          className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
            currentView === 'exam_officer'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-emerald-300 hover:text-white hover:bg-emerald-950/70 border border-emerald-500/30'
          }`}
          title="Dedicated Examination Officer Module"
        >
          Exam Officer
        </button>
        <button
          type="button"
          onClick={() => {
            if (!currentUser || currentUser.role === 'exam_officer') {
              setCurrentUser({ role: 'admin', username: 'admin' });
            }
            setCurrentView('dashboard');
          }}
          className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
            currentView === 'dashboard'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Interactive School Management Portal"
        >
          Portal
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

      {currentView === 'dashboard' && currentUser && (
        <Dashboard
          role={currentUser.role}
          username={currentUser.username}
          onLogout={handleLogout}
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

import React, { useState } from 'react';
import { UserRole, Student } from '../types';
import { MOCK_STUDENTS } from '../data/mockData';
import { generateComprehensivePromotedRoster } from '../services/studentPromotionService';

interface LoginPortalProps {
  onLoginSuccess: (role: UserRole, username: string, studentData?: Student) => void;
  onNavigateToForgotPin: () => void;
  onOpenRecoverModal: () => void;
  onOpenPolicyModal: (type: 'terms' | 'privacy') => void;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({
  onLoginSuccess,
  onNavigateToForgotPin,
  onOpenRecoverModal,
  onOpenPolicyModal
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [usernameValidator, setUsernameValidator] = useState('');
  const [passwordValidator, setPasswordValidator] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Cached pool of students for quick reg no lookup
  const allStudentsPool: Student[] = React.useMemo(() => {
    try {
      const roster = generateComprehensivePromotedRoster();
      const combined = [...MOCK_STUDENTS, ...roster];
      const map = new Map<string, Student>();
      combined.forEach(s => map.set(s.studentNo.toLowerCase(), s));
      return Array.from(map.values());
    } catch {
      return MOCK_STUDENTS;
    }
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameValidator('');
    setPasswordValidator('');
    setErrorMessage('');

    let hasError = false;
    if (!username.trim()) {
      setUsernameValidator('Username, Email or Registration Number is required.');
      hasError = true;
    }
    if (!password.trim()) {
      setPasswordValidator('Password or Portal PIN is required.');
      hasError = true;
    }

    if (hasError) return;

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const cleanUser = username.trim().toLowerCase();
      const cleanPass = password.trim();

      // 1. Check if user is a student signing in with their Registration Number (Admission No)
      const matchedStudent = allStudentsPool.find(
        (st) =>
          st.studentNo.toLowerCase() === cleanUser ||
          st.studentNo.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanUser.replace(/[^a-z0-9]/g, '') ||
          st.id.toLowerCase() === cleanUser
      );

      if (matchedStudent) {
        // Validate PIN or allow flexible demo access
        if (!cleanPass || (matchedStudent.pin && cleanPass !== matchedStudent.pin && cleanPass !== '2413' && cleanPass.length < 3)) {
          setErrorMessage(`Invalid PIN for Reg No ${matchedStudent.studentNo}. Default demo PIN is ${matchedStudent.pin || '2413'}.`);
          return;
        }
        onLoginSuccess('student', `${matchedStudent.firstName} ${matchedStudent.lastName}`, matchedStudent);
        return;
      }

      // 2. Check standard staff, examination, and administrative roles
      if (cleanUser === 'admin' || cleanUser === 'administrator' || cleanUser === 'bichitech3@gmail.com') {
        onLoginSuccess('admin', username);
      } else if (cleanUser.includes('exam') || cleanUser.includes('danjuma')) {
        onLoginSuccess('exam_officer', 'Dr. A. S. Danjuma (Exam Officer)');
      } else if (cleanUser.includes('bursar') || cleanUser.includes('maryam') || cleanUser.includes('alhassan')) {
        onLoginSuccess('bursar', 'Hajiya Maryam B. Al-Hassan (Bursar)');
      } else if (cleanUser.includes('pta') || cleanUser.includes('eze')) {
        onLoginSuccess('pta_secretary', 'Engr. Kenneth C. Eze (PTA Fin Sec)');
      } else if (cleanUser.includes('teach') || cleanUser === 'mr.gondwe' || cleanUser.includes('olatunji')) {
        onLoginSuccess('teacher', username);
      } else if (cleanUser.includes('stu') || cleanUser.includes('parent') || cleanUser === 'chikondi' || cleanUser === 'fatima') {
        const student = allStudentsPool[0] || MOCK_STUDENTS[0];
        onLoginSuccess('student', student.studentNo, student);
      } else if (cleanPass.length >= 3) {
        // Any realistic attempt works so the user can test the full app
        onLoginSuccess('admin', username);
      } else {
        setErrorMessage('Invalid Username or Password. Please verify your credentials and try again.');
      }
    }, 700);
  };

  const setDemoCredentials = (role: 'admin' | 'exam_officer' | 'bursar' | 'pta_secretary' | 'teacher' | 'student') => {
    setErrorMessage('');
    setUsernameValidator('');
    setPasswordValidator('');

    if (role === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else if (role === 'exam_officer') {
      setUsername('exam_officer');
      setPassword('exam2026');
    } else if (role === 'bursar') {
      setUsername('bursar');
      setPassword('bursar2026');
    } else if (role === 'pta_secretary') {
      setUsername('pta_secretary');
      setPassword('pta2026');
    } else if (role === 'teacher') {
      setUsername('teacher');
      setPassword('teach123');
    } else {
      // Fatima Abdullahi - Student Reg No 2413
      setUsername('2413');
      setPassword('2413');
    }
  };

  return (
    <>
      <form onSubmit={handleLoginSubmit} id="form1">
        <main className="login-page">
          <section className="login-card">
            <div className="logo-mark">
              <img src="/assets/img/nda-logo.png" alt="NDA Logo" className="w-16 h-16 object-contain" />
            </div>

            <h2 className="bichitech-brand">
              <span className="bichitech-main text-red-600" style={{ color: '#ff2222' }}>NDASSS</span>
              <span className="bichitech-sub">Management System</span>
            </h2>

            <p className="description">Login to access your portal</p>

            {/* Error Message matching original .login-error */}
            {errorMessage && (
              <div className="login-error animate-fade-in" role="alert">
                <i className="fas fa-exclamation-circle mr-2"></i>
                {errorMessage}
              </div>
            )}

            {/* Quick Demo Credentials Bar for Easy Testing */}
            <div className="mb-4 p-2 rounded-2xl bg-[#001430]/70 border border-blue-400/20 text-left">
              <div className="flex items-center justify-between text-[11px] text-slate-300 font-bold mb-1.5 px-1">
                <span>Quick Demo Accounts:</span>
                <span className="text-[10px] text-orange-400 font-semibold">Click to fill</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                <button
                  type="button"
                  onClick={() => setDemoCredentials('admin')}
                  className="py-1 px-1 rounded-lg bg-blue-950/80 hover:bg-orange-500/20 border border-blue-400/30 text-white text-[10px] font-bold transition-all text-center cursor-pointer"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => setDemoCredentials('exam_officer')}
                  className="py-1 px-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-[10px] font-bold transition-all text-center cursor-pointer"
                >
                  Exam Off.
                </button>
                <button
                  type="button"
                  onClick={() => setDemoCredentials('bursar')}
                  className="py-1 px-1 rounded-lg bg-amber-950/80 hover:bg-amber-500/20 border border-amber-400/30 text-amber-200 text-[10px] font-bold transition-all text-center cursor-pointer"
                >
                  Bursar
                </button>
                <button
                  type="button"
                  onClick={() => setDemoCredentials('pta_secretary')}
                  className="py-1 px-1 rounded-lg bg-teal-950/80 hover:bg-teal-500/20 border border-teal-400/30 text-teal-200 text-[10px] font-bold transition-all text-center cursor-pointer"
                >
                  PTA Sec.
                </button>
                <button
                  type="button"
                  onClick={() => setDemoCredentials('teacher')}
                  className="py-1 px-1 rounded-lg bg-blue-950/80 hover:bg-orange-500/20 border border-blue-400/30 text-white text-[10px] font-bold transition-all text-center cursor-pointer"
                >
                  Teacher
                </button>
                <button
                  type="button"
                  onClick={() => setDemoCredentials('student')}
                  className="py-1 px-1 rounded-lg bg-blue-950/80 hover:bg-blue-600/30 border border-blue-400/40 text-blue-200 text-[10px] font-bold transition-all text-center cursor-pointer"
                  title="Sign in as Fatima Abdullahi (Reg No: 2413)"
                >
                  Student (2413)
                </button>
              </div>
            </div>

            {/* Username / Reg No Input Group */}
            <div className="form-group">
              <div className="input-group">
                <div className="input-group-prepend">
                  <span className="input-group-text">
                    <i className="fas fa-user" aria-hidden="true"></i>
                  </span>
                </div>
                <input
                  name="TxtUsername"
                  id="TxtUsername"
                  className="form-control"
                  type="text"
                  placeholder="Username, Email or Student Reg No (e.g. 2413)"
                  autoComplete="off"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (usernameValidator) setUsernameValidator('');
                  }}
                />
              </div>
              {usernameValidator && (
                <span className="field-validator">{usernameValidator}</span>
              )}
            </div>

            {/* Password Input Group */}
            <div className="form-group">
              <div className="input-group">
                <div className="input-group-prepend">
                  <span className="input-group-text">
                    <i className="fas fa-lock" aria-hidden="true"></i>
                  </span>
                </div>
                <input
                  name="TxtPassword"
                  id="TxtPassword"
                  className="form-control"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  autoComplete="off"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordValidator) setPasswordValidator('');
                  }}
                />
                <button
                  type="button"
                  id="btnTogglePassword"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i
                    className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                    aria-hidden="true"
                  ></i>
                </button>
              </div>
              {passwordValidator && (
                <span className="field-validator">{passwordValidator}</span>
              )}
            </div>

            {/* Login Options / Forgot Password */}
            <div className="login-options">
              <a
                className="whatsapp-link"
                href="#recoverModal"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenRecoverModal();
                }}
              >
                <i className="fas fa-key mr-1" aria-hidden="true"></i> Forgot Password?
              </a>
            </div>

            {/* Login Button with loading state */}
            <button
              id="BtnLogin"
              type="submit"
              disabled={isLoading}
              className={`btn btn-login btn-block ${isLoading ? 'loading' : ''}`}
            >
              <span className="btn-text">
                <i className="fas fa-sign-in-alt mr-2" aria-hidden="true"></i> Login to Portal
              </span>
              <span className="btn-loading">
                <span
                  className="inline-block w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"
                  role="status"
                  aria-hidden="true"
                ></span>
                Signing in...
              </span>
            </button>

            {/* Portal Links (Forgot Student PIN) */}
            <div className="portal-links">
              <a
                href="#forgot-pin"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateToForgotPin();
                }}
              >
                <i className="fas fa-user-graduate mr-1" aria-hidden="true"></i> Student or Parent: Forgot PIN?
              </a>
            </div>

            {/* Footer Links matching original */}
            <div className="footer-links">
              <a
                className="whatsapp-link"
                href="https://wa.me/265993189671"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-whatsapp mr-1" aria-hidden="true"></i> WhatsApp Us for Quick Feedback
              </a>
              <br />
              <a
                href="#terms"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenPolicyModal('terms');
                }}
              >
                Terms and Conditions
              </a>
              <span className="mx-1">|</span>
              <a
                href="#privacy"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenPolicyModal('privacy');
                }}
              >
                Privacy Policy
              </a>
            </div>
          </section>
        </main>
      </form>

      {/* Page Copyright matching original */}
      <div className="page-copyright">&copy; Bichitech 2026</div>
    </>
  );
};

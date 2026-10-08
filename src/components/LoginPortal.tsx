import React, { useState } from 'react';
import { UserRole } from '../types';

interface LoginPortalProps {
  onLoginSuccess: (role: UserRole, username: string) => void;
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

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameValidator('');
    setPasswordValidator('');
    setErrorMessage('');

    let hasError = false;
    if (!username.trim()) {
      setUsernameValidator('Username is required.');
      hasError = true;
    }
    if (!password.trim()) {
      setPasswordValidator('Password is required.');
      hasError = true;
    }

    if (hasError) return;

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const cleanUser = username.trim().toLowerCase();
      const cleanPass = password.trim();

      // Flexible validation: allows standard demo logins or any custom credentials
      if (cleanUser === 'admin' || cleanUser === 'administrator' || cleanUser === 'bichitech3@gmail.com') {
        onLoginSuccess('admin', username);
      } else if (cleanUser.includes('exam') || cleanUser.includes('danjuma')) {
        onLoginSuccess('exam_officer', 'Dr. A. S. Danjuma (Exam Officer)');
      } else if (cleanUser.includes('teach') || cleanUser === 'mr.gondwe') {
        onLoginSuccess('teacher', username);
      } else if (cleanUser.includes('stu') || cleanUser.includes('parent') || cleanUser === 'chikondi') {
        onLoginSuccess('student', username);
      } else if (cleanPass.length >= 3) {
        // Any realistic attempt works so the user can test the full app
        onLoginSuccess('admin', username);
      } else {
        setErrorMessage('Invalid Username or Password. Please verify your credentials and try again.');
      }
    }, 850);
  };

  const setDemoCredentials = (role: 'admin' | 'exam_officer' | 'teacher' | 'student') => {
    setErrorMessage('');
    setUsernameValidator('');
    setPasswordValidator('');

    if (role === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else if (role === 'exam_officer') {
      setUsername('exam_officer');
      setPassword('exam2026');
    } else if (role === 'teacher') {
      setUsername('teacher');
      setPassword('teach123');
    } else {
      setUsername('STU-2024-0891');
      setPassword('4821');
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

            <h2 className="fecomas-brand">
              <span className="fecomas-main text-red-600" style={{ color: '#ff2222' }}>NDASSS</span>
              <span className="fecomas-sub">School Management System</span>
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
              <div className="grid grid-cols-4 gap-1.5">
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
                  onClick={() => setDemoCredentials('teacher')}
                  className="py-1 px-1 rounded-lg bg-blue-950/80 hover:bg-orange-500/20 border border-blue-400/30 text-white text-[10px] font-bold transition-all text-center cursor-pointer"
                >
                  Teacher
                </button>
                <button
                  type="button"
                  onClick={() => setDemoCredentials('student')}
                  className="py-1 px-1 rounded-lg bg-blue-950/80 hover:bg-orange-500/20 border border-blue-400/30 text-white text-[10px] font-bold transition-all text-center cursor-pointer"
                >
                  Student
                </button>
              </div>
            </div>

            {/* Username Input Group */}
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
                  placeholder="Username"
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
      <div className="page-copyright">&copy; Fecomas Tech Solutions 2026</div>
    </>
  );
};

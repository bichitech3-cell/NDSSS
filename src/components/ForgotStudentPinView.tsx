import React, { useState } from 'react';
import { MOCK_STUDENTS } from '../data/mockData';
import { Student } from '../types';

interface ForgotStudentPinViewProps {
  onBackToLogin: () => void;
}

export const ForgotStudentPinView: React.FC<ForgotStudentPinViewProps> = ({ onBackToLogin }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [schoolCode, setSchoolCode] = useState('NDASSS');
  const [studentNo, setStudentNo] = useState('STU-2024-0891');
  const [matchedStudent, setMatchedStudent] = useState<Student | null>(null);
  
  const [answer1, setAnswer1] = useState('');
  const [answer2, setAnswer2] = useState('');
  
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  const [message, setMessage] = useState<{ text: string; type: 'danger' | 'success' } | null>(null);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const sCode = schoolCode.trim().toUpperCase();
    const sNo = studentNo.trim().toUpperCase();

    if (!sCode || !sNo) {
      setMessage({ text: 'Please enter both School Code and Student Number.', type: 'danger' });
      return;
    }

    const found = MOCK_STUDENTS.find(
      (s) =>
        s.schoolCode.toUpperCase() === sCode &&
        (s.studentNo.toUpperCase() === sNo || s.studentNo.toUpperCase().includes(sNo))
    );

    if (found) {
      setMatchedStudent(found);
      setStep(2);
      setMessage(null);
    } else {
      setMessage({
        text: 'No student record found matching this School Code and Student Number. Please check your admission details or contact your school administrator.',
        type: 'danger'
      });
    }
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!matchedStudent) return;

    if (!answer1.trim() || !answer2.trim()) {
      setMessage({ text: 'Please answer both security questions.', type: 'danger' });
      return;
    }

    // Check answers (case-insensitive)
    const isAns1Correct =
      answer1.trim().toLowerCase() === matchedStudent.securityAnswer1.toLowerCase();
    const isAns2Correct =
      answer2.trim().toLowerCase() === matchedStudent.securityAnswer2.toLowerCase();

    if (isAns1Correct && isAns2Correct) {
      setStep(3);
      setMessage(null);
    } else {
      setMessage({
        text: 'Incorrect answer(s) to the security questions. Please verify your answers.',
        type: 'danger'
      });
    }
  };

  const handleStep3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setMessage({ text: 'PIN must be exactly 4 numeric digits.', type: 'danger' });
      return;
    }

    if (newPin !== confirmPin) {
      setMessage({ text: 'PINs do not match.', type: 'danger' });
      return;
    }

    if (matchedStudent) {
      matchedStudent.pin = newPin;
    }

    setMessage({
      text: 'Your PIN has been successfully updated! You can now use this new PIN to sign in.',
      type: 'success'
    });
  };

  return (
    <div className="recovery-page">
      <main className="recovery-card">
        <div className="recovery-brand">
          <i className="fas fa-key"></i>
          <h1>Recover Student PIN</h1>
          <p>Verify your security questions and create a new PIN.</p>
        </div>

        <div className="stepbar">
          <span id="bar1" className={`step ${step >= 1 ? 'on' : ''}`}></span>
          <span id="bar2" className={`step ${step >= 2 ? 'on' : ''}`}></span>
          <span id="bar3" className={`step ${step >= 3 ? 'on' : ''}`}></span>
        </div>

        {message && (
          <div
            className={`alert-custom ${
              message.type === 'danger' ? 'alert-danger-custom' : 'alert-success-custom'
            }`}
          >
            {message.type === 'danger' ? (
              <i className="fas fa-exclamation-circle mr-1"></i>
            ) : (
              <i className="fas fa-check-circle mr-1"></i>
            )}
            {message.text}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleStep1Submit} id="pnlIdentify">
            <div className="field">
              <label>School Code</label>
              <input
                name="txtSchoolCode"
                type="text"
                id="txtSchoolCode"
                className="control"
                placeholder="Example: MDFSS"
                autoComplete="off"
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Student Number</label>
              <input
                name="txtStudentNo"
                type="text"
                id="txtStudentNo"
                className="control"
                placeholder="StudentNo or StudentNo2"
                autoComplete="off"
                value={studentNo}
                onChange={(e) => setStudentNo(e.target.value)}
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 mb-3 text-left">
              <p className="text-xs text-amber-800 font-semibold mb-1">
                <i className="fas fa-info-circle mr-1"></i> Demo Credentials Quick Tip:
              </p>
              <p className="text-[11px] text-amber-700">
                School: <strong className="font-bold">NDASSS</strong> &bull; Student No:{' '}
                <strong className="font-bold">STU-2024-0891</strong> (Chikondi Banda)
              </p>
            </div>

            <input
              type="submit"
              name="btnFind"
              value="Continue"
              id="btnFind"
              className="btn-main"
            />
          </form>
        )}

        {step === 2 && matchedStudent && (
          <form onSubmit={handleStep2Submit} id="pnlQuestions">
            <div className="mb-3 text-left text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              Verifying student: <strong className="text-slate-900 font-bold">{matchedStudent.firstName} {matchedStudent.lastName}</strong> ({matchedStudent.formClass})
            </div>

            <div className="question-box">
              <strong>1. {matchedStudent.securityQuestion1}</strong>
              <input
                type="text"
                className="control"
                placeholder="Enter your answer"
                value={answer1}
                onChange={(e) => setAnswer1(e.target.value)}
                autoComplete="off"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                (Demo Answer: <em>{matchedStudent.securityAnswer1}</em>)
              </span>
            </div>

            <div className="question-box">
              <strong>2. {matchedStudent.securityQuestion2}</strong>
              <input
                type="text"
                className="control"
                placeholder="Enter your answer"
                value={answer2}
                onChange={(e) => setAnswer2(e.target.value)}
                autoComplete="off"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                (Demo Answer: <em>{matchedStudent.securityAnswer2}</em>)
              </span>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Back
              </button>
              <input
                type="submit"
                value="Verify Security Answers"
                className="btn-main flex-1"
              />
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleStep3Submit} id="pnlReset">
            {message?.type === 'success' ? (
              <div>
                <div className="success-pin">
                  <i className="fas fa-check-circle mr-1"></i>
                  <strong>Success!</strong> Your 4-digit student portal PIN has been reset to{' '}
                  <span className="font-mono font-bold text-base px-2 py-0.5 bg-white border border-emerald-300 rounded text-emerald-800">
                    {newPin}
                  </span>
                  .
                </div>
                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="btn-main mt-3"
                >
                  Return to Portal Login
                </button>
              </div>
            ) : (
              <div>
                <div className="field">
                  <label>New 4-Digit PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    className="control text-center tracking-widest text-lg font-bold"
                    placeholder="&bull;&bull;&bull;&bull;"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <label>Confirm 4-Digit PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    className="control text-center tracking-widest text-lg font-bold"
                    placeholder="&bull;&bull;&bull;&bull;"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    required
                  />
                </div>

                <input
                  type="submit"
                  value="Update & Set New PIN"
                  className="btn-main mt-2"
                />
              </div>
            )}
          </form>
        )}

        <div className="back-link">
          <button type="button" onClick={onBackToLogin}>
            <i className="fas fa-arrow-left mr-1"></i> Return to login
          </button>
        </div>
      </main>
    </div>
  );
};

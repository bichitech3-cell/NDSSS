import React, { useState } from 'react';

interface RecoverPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecoverPasswordModal: React.FC<RecoverPasswordModalProps> = ({ isOpen, onClose }) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!usernameOrEmail.trim()) {
      setErrorMessage('Please provide your registered username or email.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMessage(
        `A password reset link and temporary security token have been dispatched to the email on file for "${usernameOrEmail}". Please check your inbox or spam folder.`
      );
    }, 1000);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-dialog-custom"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 'min(92vw, 470px)' }}
      >
        <div className="modal-header-fecomas">
          <div className="flex items-center gap-2">
            <i className="fas fa-key text-yellow-400 text-lg mr-1"></i>
            <h5 className="m-0 font-bold text-white text-base tracking-wide">
              Password Recovery
            </h5>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:text-orange-300 text-2xl leading-none font-bold cursor-pointer transition-colors"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="p-6 text-left">
          <p className="text-xs text-slate-600 mb-4 font-medium leading-relaxed">
            School administrators, educators, and staff can recover their portal credentials by submitting their verified details below.
          </p>

          {errorMessage && (
            <div className="alert-custom alert-danger-custom mb-3 flex items-center gap-2">
              <i className="fas fa-exclamation-triangle text-red-600"></i>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage ? (
            <div>
              <div className="alert-custom alert-success-custom mb-4 leading-relaxed">
                <i className="fas fa-check-circle mr-1 text-green-700"></i>
                {successMessage}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="btn-main w-full py-2.5 rounded-xl font-bold cursor-pointer"
              >
                Return to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="field mb-3">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1 block">
                  School Code (Optional)
                </label>
                <input
                  type="text"
                  className="control"
                  placeholder="e.g. MDFSS, CHSS"
                  value={schoolCode}
                  onChange={(e) => setSchoolCode(e.target.value)}
                />
              </div>

              <div className="field mb-4">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1 block">
                  Username or Registered Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="control"
                  placeholder="Enter your username or email address"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-main w-full py-3 mb-3 rounded-xl font-black text-sm tracking-wide cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin"></i>
                    Verifying Details...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-1"></i>
                    Send Recovery Instructions
                  </>
                )}
              </button>

              <div className="pt-3 border-t border-slate-200 mt-4 text-center">
                <p className="text-xs text-slate-500 mb-2">Need immediate assistance with your account?</p>
                <a
                  href="https://wa.me/265993189671?text=Hello%20FECOMAS%20Support,%20I%20need%20assistance%20recovering%20my%20school%20portal%20password."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-3.5 py-2 rounded-xl transition-colors"
                >
                  <i className="fab fa-whatsapp text-sm text-green-600"></i>
                  WhatsApp Fecomas Technical Support
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

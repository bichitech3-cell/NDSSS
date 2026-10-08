import React from 'react';

interface PolicyModalProps {
  type: 'terms' | 'privacy' | null;
  onClose: () => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-dialog-custom max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 'min(92vw, 680px)' }}
      >
        <div className="modal-header-fecomas">
          <div className="flex items-center gap-2">
            <i
              className={`fas ${
                type === 'terms' ? 'fa-file-contract text-orange-400' : 'fa-user-shield text-emerald-400'
              } text-lg mr-1`}
            ></i>
            <h5 className="m-0 font-black text-white text-base">
              {type === 'terms' ? 'Terms & Conditions' : 'Privacy & Data Protection Policy'}
            </h5>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:text-orange-300 text-2xl leading-none font-bold cursor-pointer transition-colors"
          >
            &times;
          </button>
        </div>

        <div className="p-6 overflow-y-auto text-left text-slate-700 text-xs leading-relaxed space-y-4">
          {type === 'terms' ? (
            <>
              <div>
                <h6 className="text-sm font-bold text-slate-900 mb-1">
                  1. Acceptance of Terms
                </h6>
                <p>
                  By accessing or utilizing the FECOMAS School Management System (FSMS) portal provided by Fecomas Tech Solutions, participating academic institutions, administrators, educators, guardians, and students agree to adhere to all terms, operational guidelines, and security requirements outlined herein.
                </p>
              </div>

              <div>
                <h6 className="text-sm font-bold text-slate-900 mb-1">
                  2. Portal User Roles and Credential Security
                </h6>
                <p>
                  Users must safeguard their login credentials and student PINs. Unauthorized sharing of administrative or grade entry privileges is strictly prohibited. Any suspected breach must be reported immediately to school authorities or Fecomas support.
                </p>
              </div>

              <div>
                <h6 className="text-sm font-bold text-slate-900 mb-1">
                  3. Academic Records and Grade Integrity
                </h6>
                <p>
                  All examination scores, continuous assessments, terminal report cards, and attendance logs entered into the FECOMAS platform constitute official institutional records. Tampering, unauthorized alteration, or falsification of grades will result in disciplinary action.
                </p>
              </div>

              <div>
                <h6 className="text-sm font-bold text-slate-900 mb-1">
                  4. Tuition and Fee Payment Reconciliations
                </h6>
                <p>
                  Electronic receipts generated through the FECOMAS financial module reflect reconciled mobile money and banking transactions. In cases of discrepancy, official bank deposit slips and provider transaction IDs serve as secondary verification.
                </p>
              </div>

              <div>
                <h6 className="text-sm font-bold text-slate-900 mb-1">
                  5. Service Availability and Updates
                </h6>
                <p>
                  Fecomas Tech Solutions maintains 99.8% platform uptime. Scheduled maintenance and system enhancements will be broadcast through administrative notices and SMS/WhatsApp channels.
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <h6 className="text-sm font-bold text-slate-900 mb-1">
                  1. Information We Collect
                </h6>
                <p>
                  FECOMAS securely processes institutional academic data including student enrollment demographics, attendance records, academic assessments, guardian contact details (phone numbers, WhatsApp handles), and tuition payment records strictly for school administration.
                </p>
              </div>

              <div>
                <h6 className="text-sm font-bold text-slate-900 mb-1">
                  2. Child and Student Data Safeguarding
                </h6>
                <p>
                  Under strict educational data privacy regulations, student identifiable data is encrypted both in transit (TLS 1.3) and at rest. Data is never shared with third-party advertisers or commercial entities. Access is restricted exclusively to authorized school personnel and verified guardians.
                </p>
              </div>

              <div>
                <h6 className="text-sm font-bold text-slate-900 mb-1">
                  3. SMS & WhatsApp Communication Policy
                </h6>
                <p>
                  Notifications regarding report cards, fee alerts, attendance warnings, and emergency school closures are dispatched solely to the registered numbers provided during official student enrollment.
                </p>
              </div>

              <div>
                <h6 className="text-sm font-bold text-slate-900 mb-1">
                  4. Data Retention & System Audits
                </h6>
                <p>
                  Academic transcripts and financial records are retained according to National Educational Board standards. School administrators have full export and archival capabilities upon completion of each academic cycle.
                </p>
              </div>

              <div>
                <h6 className="text-sm font-bold text-slate-900 mb-1">
                  5. Technical Support Contact
                </h6>
                <p>
                  Fecomas Tech Solutions, Lilongwe, Malawi.<br />
                  Support WhatsApp / Hotline: <strong>+265 993 189 671</strong><br />
                  Official Systems: <em>https://fecomas.com</em>
                </p>
              </div>
            </>
          )}

          <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-500">
            <span>&copy; Fecomas Tech Solutions 2026</span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

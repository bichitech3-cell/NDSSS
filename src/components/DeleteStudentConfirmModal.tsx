import React, { useState } from 'react';
import { Student } from '../types';
import { supabase } from '../lib/supabase';

export interface DeleteStudentConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onConfirmDelete: (studentId: string) => void;
}

export const DeleteStudentConfirmModal: React.FC<DeleteStudentConfirmModalProps> = ({
  isOpen,
  onClose,
  student,
  onConfirmDelete
}) => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [confirmedCheck, setConfirmedCheck] = useState<boolean>(false);
  const [syncWithSupabase, setSyncWithSupabase] = useState<boolean>(true);

  if (!isOpen || !student) return null;

  const handleDelete = async () => {
    setIsDeleting(true);

    if (syncWithSupabase) {
      try {
        await supabase
          .from('students')
          .delete()
          .eq('admission_no', student.studentNo);
      } catch (err) {
        console.warn('Supabase delete record notice:', err);
      }
    }

    setIsDeleting(false);
    onConfirmDelete(student.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div
        className="bg-slate-900 border border-rose-500/50 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-950 border-b border-rose-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 text-lg shadow-inner">
              <i className="fas fa-trash-can"></i>
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Delete Student Record
              </h3>
              <p className="text-xs text-rose-300/80">
                Permanent institutional deletion
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cancel"
          >
            <i className="fas fa-times text-base"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-rose-950/30 border border-rose-800/40 rounded-xl p-3.5 text-xs text-rose-200 flex items-start gap-3">
            <i className="fas fa-triangle-exclamation text-rose-400 text-base mt-0.5 shrink-0"></i>
            <div>
              <p className="font-bold text-rose-100 mb-0.5">
                Warning: This action cannot be undone!
              </p>
              <p className="text-[11px] text-rose-300/90 leading-relaxed">
                You are about to permanently remove this student from the institutional roster, gradebooks, continuous assessment sheets, and portal access registry.
              </p>
            </div>
          </div>

          {/* Student Profile Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800/80">
              <img
                src={student.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={student.firstName}
                className="w-11 h-11 rounded-full object-cover border border-slate-700"
              />
              <div>
                <h4 className="text-sm font-bold text-white">
                  {student.firstName} {student.lastName}
                </h4>
                <div className="flex items-center gap-2 mt-0.5 text-xs">
                  <span className="font-mono font-bold text-orange-400 bg-orange-950/60 px-1.5 py-0.5 rounded border border-orange-800/40 text-[10px]">
                    {student.studentNo}
                  </span>
                  <span className="text-cyan-300 font-semibold text-[11px]">
                    {student.formClass} {student.arm ? `(${student.arm})` : ''}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-400">
              <div>
                <span className="text-slate-500">Guardian:</span>{' '}
                <strong className="text-slate-200">{student.guardianName || 'N/A'}</strong>
              </div>
              <div>
                <span className="text-slate-500">Phone:</span>{' '}
                <strong className="text-slate-200">{student.guardianPhone || 'N/A'}</strong>
              </div>
              <div>
                <span className="text-slate-500">Stream:</span>{' '}
                <strong className="text-slate-200">{student.stream || 'General'}</strong>
              </div>
              <div>
                <span className="text-slate-500">Fee Balance:</span>{' '}
                <strong className={student.feeBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                  ₦{(student.feeBalance || 0).toLocaleString()}
                </strong>
              </div>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="space-y-2 pt-1">
            <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmedCheck}
                onChange={(e) => setConfirmedCheck(e.target.checked)}
                className="mt-0.5 rounded bg-slate-950 border-slate-700 text-rose-600 focus:ring-rose-500"
              />
              <span className="leading-tight">
                I confirm that I want to delete the student record for <strong className="text-white">{student.firstName} {student.lastName}</strong> from NDASSS.
              </span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-400 cursor-pointer pl-6">
              <input
                type="checkbox"
                checked={syncWithSupabase}
                onChange={(e) => setSyncWithSupabase(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-rose-600 focus:ring-rose-500"
              />
              <span className="text-[11px]">
                Also purge from Supabase PostgreSQL database
              </span>
            </label>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!confirmedCheck || isDeleting}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-rose-600/30 flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <i className="fas fa-trash-alt"></i>
                <span>Permanently Delete Student</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

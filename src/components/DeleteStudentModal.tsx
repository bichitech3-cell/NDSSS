import React, { useState } from 'react';
import { Student } from '../types';
import { supabase } from '../lib/supabase';

export interface DeleteStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onConfirmDelete: (studentId: string) => void;
}

export const DeleteStudentModal: React.FC<DeleteStudentModalProps> = ({
  isOpen,
  onClose,
  student,
  onConfirmDelete
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !student) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Fire background deletion attempt to Supabase
      if (student.studentNo) {
        await supabase
          .from('students')
          .delete()
          .eq('admission_no', student.studentNo);
      }
    } catch {
      // Handled gracefully
    } finally {
      setIsDeleting(false);
      onConfirmDelete(student.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-rose-950 via-slate-900 to-slate-900 border-b border-rose-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 text-lg shadow-inner">
              <i className="fas fa-user-xmark"></i>
            </div>
            <div>
              <h2 className="text-base font-black text-white">Remove Student from Registry</h2>
              <p className="text-xs text-rose-300">Permanent record deletion</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-300">
            Are you sure you want to remove this student? This will delete their registration, marks, and dossiers from the current school session.
          </p>

          {/* Student Profile Card preview */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <img
              src={student.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={student.firstName}
              className="w-12 h-12 rounded-full object-cover border-2 border-rose-500/50 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate">
                  {student.firstName} {student.lastName}
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {student.gender}
                </span>
              </div>
              <p className="font-mono text-rose-400 text-xs font-semibold">
                {student.studentNo}
              </p>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3">
                <span>Class: <strong className="text-slate-200">{student.formClass} {student.arm ? `(${student.arm})` : ''}</strong></span>
                <span>•</span>
                <span>Guardian: <strong className="text-slate-200">{student.guardianName || 'N/A'}</strong></span>
              </div>
            </div>
          </div>

          <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-3 text-amber-300/90 flex items-start gap-2.5 text-[11px]">
            <i className="fas fa-triangle-exclamation text-amber-400 mt-0.5 text-sm shrink-0"></i>
            <span>
              <strong>Warning:</strong> Removing this student will exclude them from the broadsheet, continuous assessments, report sheets, and CSV exports.
            </span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end gap-3 text-xs">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-5 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold rounded-xl transition-all shadow-md shadow-rose-900/40 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                <span>Removing...</span>
              </>
            ) : (
              <>
                <i className="fas fa-trash-alt"></i>
                <span>Yes, Remove Student</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

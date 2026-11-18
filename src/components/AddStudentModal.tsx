import React, { useState, useMemo } from 'react';
import { Student } from '../types';
import { getSubjectsForClass } from '../services/studentPromotionService';
import { supabase } from '../lib/supabase';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (student: Omit<Student, 'id'>) => void;
  currentSession?: string;
  currentTerm?: string;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  currentSession = '2026/2027',
  currentTerm = 'Second Term'
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    studentNo: '',
    gender: 'Male' as 'Male' | 'Female',
    formClass: 'JSS 1',
    arm: 'A',
    stream: 'Junior Secondary A',
    house: 'Dalet',
    age: 14,
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    feeBalance: 0,
    totalFees: 380000,
    attendanceRate: 100,
    pin: Math.floor(1000 + Math.random() * 9000).toString(),
    session: currentSession,
    term: currentTerm
  });
  const [syncWithSupabase, setSyncWithSupabase] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Matched subjects preview
  const matchedSubjects = useMemo(() => {
    return getSubjectsForClass(formData.formClass, formData.arm);
  }, [formData.formClass, formData.arm]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMsg('First and last names are required.');
      return;
    }

    if (!formData.studentNo.trim()) {
      setErrorMsg('Admission number is required.');
      return;
    }

    const newStudentData: Omit<Student, 'id'> = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      studentNo: formData.studentNo.trim(),
      gender: formData.gender,
      formClass: formData.formClass,
      arm: formData.arm,
      stream: formData.stream || `${formData.formClass} Stream ${formData.arm}`,
      house: formData.house,
      schoolCode: 'NDASSS',
      status: 'Active',
      age: Number(formData.age),
      guardianName: formData.guardianName.trim() || 'Parent / Guardian',
      guardianPhone: formData.guardianPhone.trim() || 'N/A',
      guardianEmail: formData.guardianEmail.trim() || '',
      feeBalance: Number(formData.feeBalance),
      totalFees: Number(formData.totalFees),
      attendanceRate: Number(formData.attendanceRate),
      pin: formData.pin.trim() || '1234',
      session: formData.session,
      term: formData.term,
      avatarUrl: `https://images.unsplash.com/photo-${formData.gender === 'Female' ? '1534528741775-53994a69daeb' : '1539571696357-5a69c17a67c6'}?w=150&auto=format&fit=crop&q=80`,
      securityQuestion1: 'What is your primary school name?',
      securityAnswer1: 'Command Children School',
      securityQuestion2: 'What is your favorite subject?',
      securityAnswer2: 'Mathematics'
    };

    if (syncWithSupabase) {
      try {
        await supabase.from('students').upsert({
          admission_no: newStudentData.studentNo,
          first_name: newStudentData.firstName,
          last_name: newStudentData.lastName,
          class: newStudentData.formClass,
          arm: newStudentData.arm,
          gender: newStudentData.gender,
          guardian_name: newStudentData.guardianName,
          guardian_phone: newStudentData.guardianPhone,
          guardian_email: newStudentData.guardianEmail,
          fee_balance: newStudentData.feeBalance,
          total_fees: newStudentData.totalFees,
          status: newStudentData.status
        }, { onConflict: 'admission_no' });
      } catch (err) {
        console.warn('Supabase student registration warning:', err);
      }
    }

    onAdd(newStudentData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-orange-950/60 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 text-lg shadow-inner">
              <i className="fas fa-user-plus"></i>
            </div>
            <div>
              <h3 className="text-base font-black text-white">Enroll New Student</h3>
              <p className="text-xs text-slate-400">Add student bio-data, academic level, and guardian contact</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <i className="fas fa-times text-base"></i>
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-950/80 border-b border-rose-500/40 px-6 py-2.5 text-xs text-rose-300 flex items-center gap-2 shrink-0">
            <i className="fas fa-circle-exclamation text-rose-400"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                First Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                placeholder="e.g. Ibrahim"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Last Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                placeholder="e.g. Musa"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Admission Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.studentNo}
                onChange={(e) => setFormData({ ...formData, studentNo: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-orange-400 placeholder-slate-500 focus:outline-none focus:border-orange-500"
                placeholder="NDASSS/JSS1A/025"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Male' | 'Female' })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">House</label>
              <select
                value={formData.house}
                onChange={(e) => setFormData({ ...formData, house: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                <option value="Dalet">Dalet</option>
                <option value="Mogadishu">Mogadishu</option>
                <option value="Burma">Burma</option>
                <option value="Abyssinia">Abyssinia</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Class / Form</label>
              <select
                value={formData.formClass}
                onChange={(e) => {
                  const newClass = e.target.value;
                  const newStream = newClass.startsWith('JSS')
                    ? `Junior Secondary ${formData.arm}`
                    : `Senior ${formData.arm === 'A' || formData.arm === 'Science' ? 'Science' : 'General'} Stream`;
                  setFormData({ ...formData, formClass: newClass, stream: newStream });
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-bold text-cyan-300"
              >
                <option value="JSS 1">JSS 1</option>
                <option value="JSS 2">JSS 2</option>
                <option value="JSS 3">JSS 3</option>
                <option value="SSS 1">SSS 1</option>
                <option value="SSS 2">SSS 2</option>
                <option value="SSS 3">SSS 3</option>
                <option value="SSS1 B">SSS1 B</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Arm</label>
              <select
                value={formData.arm}
                onChange={(e) => setFormData({ ...formData, arm: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                <option value="A">Arm A</option>
                <option value="B">Arm B</option>
                <option value="C">Arm C</option>
                <option value="D">Arm D</option>
                <option value="E">Arm E</option>
                <option value="Science">Science</option>
                <option value="Commercial">Commercial</option>
                <option value="Humanities">Humanities</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Portal PIN</label>
              <input
                type="text"
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Matched Subjects Preview */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="text-xs text-slate-400 mb-1.5 flex items-center justify-between">
              <span className="font-bold text-slate-300">
                <i className="fas fa-book-open text-emerald-400 mr-1.5"></i>
                Auto-Assigned Curriculum Subjects ({matchedSubjects.length})
              </span>
              <span className="text-[11px] text-emerald-400">Class: {formData.formClass}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
              {matchedSubjects.map((sub, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[11px]">
                  {sub}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Guardian Name</label>
              <input
                type="text"
                value={formData.guardianName}
                onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                placeholder="Guardian Full Name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Guardian Phone</label>
              <input
                type="text"
                value={formData.guardianPhone}
                onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono"
                placeholder="+234 802 000 0000"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Guardian Email</label>
              <input
                type="email"
                value={formData.guardianEmail}
                onChange={(e) => setFormData({ ...formData, guardianEmail: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                placeholder="parent@example.com"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
            <input
              type="checkbox"
              id="sync-supabase-add"
              checked={syncWithSupabase}
              onChange={(e) => setSyncWithSupabase(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-orange-600 focus:ring-orange-500"
            />
            <label htmlFor="sync-supabase-add" className="cursor-pointer">
              Synchronize to Supabase database (<code className="text-slate-300">students</code> table)
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-orange-600/30 flex items-center gap-2 cursor-pointer"
            >
              <i className="fas fa-plus"></i>
              <span>Save & Enroll Student</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

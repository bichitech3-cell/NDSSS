import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { supabase } from '../lib/supabase';

export interface UpdateStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onUpdate: (updatedStudent: Student) => void;
}

export const UpdateStudentModal: React.FC<UpdateStudentModalProps> = ({
  isOpen,
  onClose,
  student,
  onUpdate
}) => {
  const [formData, setFormData] = useState<Partial<Student>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (student) {
      setFormData({
        firstName: student.firstName,
        lastName: student.lastName,
        studentNo: student.studentNo,
        gender: student.gender,
        formClass: student.formClass,
        arm: student.arm || 'A',
        stream: student.stream || 'General',
        house: student.house || 'Dalet',
        age: student.age || 15,
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone,
        guardianEmail: student.guardianEmail || '',
        status: student.status || 'Active',
        feeBalance: student.feeBalance ?? 0,
        totalFees: student.totalFees ?? 380000,
        pin: student.pin || '1234'
      });
      setErrorMessage(null);
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName?.trim() || !formData.lastName?.trim() || !formData.studentNo?.trim()) {
      setErrorMessage('First Name, Last Name, and Admission Number are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const updated: Student = {
      ...student,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      studentNo: formData.studentNo.trim(),
      gender: (formData.gender as 'Male' | 'Female') || 'Male',
      formClass: formData.formClass?.trim() || student.formClass,
      arm: formData.arm?.trim() || student.arm,
      stream: formData.stream?.trim() || student.stream,
      house: formData.house?.trim() || student.house,
      age: Number(formData.age) || student.age,
      guardianName: formData.guardianName?.trim() || '',
      guardianPhone: formData.guardianPhone?.trim() || '',
      guardianEmail: formData.guardianEmail?.trim() || '',
      status: (formData.status as 'Active' | 'Suspended' | 'Alumni') || 'Active',
      feeBalance: Number(formData.feeBalance) || 0,
      totalFees: Number(formData.totalFees) || student.totalFees,
      pin: formData.pin?.trim() || student.pin
    };

    try {
      // Background sync to supabase if available
      const payload = {
        admission_no: updated.studentNo,
        first_name: updated.firstName,
        last_name: updated.lastName,
        class_level: updated.formClass,
        arm: updated.arm,
        stream: updated.stream,
        gender: updated.gender,
        guardian_name: updated.guardianName,
        guardian_phone: updated.guardianPhone,
        status: updated.status,
        fee_balance: updated.feeBalance
      };
      await supabase.from('students').upsert(payload, { onConflict: 'admission_no' });
    } catch {
      // Handled gracefully
    } finally {
      setIsSubmitting(false);
      onUpdate(updated);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 text-lg shadow-inner">
              <i className="fas fa-user-pen"></i>
            </div>
            <div>
              <h2 className="text-base font-black text-white">Update Student Record</h2>
              <p className="text-xs text-slate-400">
                Modify biodata, class assignments, and guardian contacts for <span className="text-orange-300 font-semibold">{student.firstName} {student.lastName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        {/* Error notice */}
        {errorMessage && (
          <div className="bg-rose-950/80 border-b border-rose-500/50 px-6 py-2 text-xs text-rose-300 flex items-center gap-2">
            <i className="fas fa-exclamation-circle text-rose-400"></i>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Identity Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <i className="fas fa-id-card text-orange-400"></i>
              Biodata & Identification
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={formData.firstName || ''}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={formData.lastName || ''}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Admission Number *</label>
                <input
                  type="text"
                  required
                  value={formData.studentNo || ''}
                  onChange={(e) => setFormData({ ...formData, studentNo: e.target.value })}
                  placeholder="e.g. NDASSS/JSS2A/001"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-orange-300 font-mono font-bold focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Gender</label>
                <select
                  value={formData.gender || 'Male'}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Male' | 'Female' })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Age</label>
                <input
                  type="number"
                  min="5"
                  max="30"
                  value={formData.age || 15}
                  onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">House</label>
                <select
                  value={formData.house || 'Dalet'}
                  onChange={(e) => setFormData({ ...formData, house: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="Dalet">Dalet</option>
                  <option value="Mogadishu">Mogadishu</option>
                  <option value="Abyssinia">Abyssinia</option>
                  <option value="Burma">Burma</option>
                  <option value="Ribadu">Ribadu</option>
                </select>
              </div>
            </div>
          </div>

          {/* Academic & Class Placement */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <i className="fas fa-graduation-cap text-cyan-400"></i>
              Class & Stream Allocation
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Class Level</label>
                <select
                  value={formData.formClass || 'JSS 1'}
                  onChange={(e) => setFormData({ ...formData, formClass: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-orange-500"
                >
                  <option value="JSS 1">JSS 1</option>
                  <option value="JSS 2">JSS 2</option>
                  <option value="JSS 3">JSS 3</option>
                  <option value="SSS 1">SSS 1</option>
                  <option value="SSS 2">SSS 2</option>
                  <option value="SSS 3">SSS 3</option>
                  <option value="Form 1A">Form 1A</option>
                  <option value="Form 2A">Form 2A</option>
                  <option value="Form 3A">Form 3A</option>
                  <option value="SSS1 B">SSS1 B</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Arm / Division</label>
                <input
                  type="text"
                  value={formData.arm || 'A'}
                  onChange={(e) => setFormData({ ...formData, arm: e.target.value })}
                  placeholder="e.g. A, B, C, Science"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Curriculum Stream</label>
                <input
                  type="text"
                  value={formData.stream || 'General'}
                  onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                  placeholder="e.g. Science, Commercial, Arts"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Guardian Information */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <i className="fas fa-user-shield text-emerald-400"></i>
              Guardian & Contact Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Guardian Name</label>
                <input
                  type="text"
                  value={formData.guardianName || ''}
                  onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Guardian Phone</label>
                <input
                  type="text"
                  value={formData.guardianPhone || ''}
                  onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                  placeholder="e.g. +234 803 123 4567"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Guardian Email</label>
                <input
                  type="email"
                  value={formData.guardianEmail || ''}
                  onChange={(e) => setFormData({ ...formData, guardianEmail: e.target.value })}
                  placeholder="parent@example.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Financial & Status */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <i className="fas fa-coins text-amber-400"></i>
              Fees, Status & Credentials
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Enrollment Status</label>
                <select
                  value={formData.status || 'Active'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Suspended' | 'Alumni' })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Alumni">Alumni</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Fee Balance (NGN)</label>
                <input
                  type="number"
                  value={formData.feeBalance ?? 0}
                  onChange={(e) => setFormData({ ...formData, feeBalance: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Total Term Fees (NGN)</label>
                <input
                  type="number"
                  value={formData.totalFees ?? 380000}
                  onChange={(e) => setFormData({ ...formData, totalFees: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Portal PIN</label>
                <input
                  type="text"
                  maxLength={6}
                  value={formData.pin || '1234'}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono font-bold focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl transition-all shadow-md shadow-orange-900/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

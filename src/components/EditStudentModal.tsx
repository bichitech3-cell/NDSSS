import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { supabase } from '../lib/supabase';

export interface EditStudentModalProps {
  isOpen: boolean;
  student: Student | null;
  onClose: () => void;
  onSave: (updatedStudent: Student) => void;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  isOpen,
  student,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    studentNo: '',
    formClass: 'JSS 1',
    arm: 'A',
    stream: 'General',
    gender: 'Male' as 'Male' | 'Female',
    house: 'Dalet',
    age: 15,
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    feeBalance: 0,
    status: 'Active' as 'Active' | 'Suspended' | 'Alumni',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (student) {
      setFormData({
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        studentNo: student.studentNo || '',
        formClass: student.formClass || 'JSS 1',
        arm: student.arm || 'A',
        stream: student.stream || 'General',
        gender: student.gender || 'Male',
        house: student.house || 'Dalet',
        age: student.age || 15,
        guardianName: student.guardianName || '',
        guardianPhone: student.guardianPhone || '',
        guardianEmail: student.guardianEmail || '',
        feeBalance: student.feeBalance ?? 0,
        status: student.status || 'Active',
      });
      setErrorMessage(null);
    }
  }, [student, isOpen]);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMessage('Please provide both First Name and Last Name.');
      return;
    }

    if (!formData.studentNo.trim()) {
      setErrorMessage('Admission Number cannot be blank.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const updatedStudent: Student = {
      ...student,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      studentNo: formData.studentNo.trim(),
      formClass: formData.formClass.trim(),
      arm: formData.arm.trim(),
      stream: formData.stream.trim(),
      gender: formData.gender,
      house: formData.house.trim(),
      age: Number(formData.age) || 15,
      guardianName: formData.guardianName.trim(),
      guardianPhone: formData.guardianPhone.trim(),
      guardianEmail: formData.guardianEmail.trim(),
      feeBalance: Number(formData.feeBalance) || 0,
      status: formData.status,
    };

    // Attempt background sync to Supabase if configured
    try {
      await supabase
        .from('students')
        .update({
          first_name: updatedStudent.firstName,
          last_name: updatedStudent.lastName,
          admission_no: updatedStudent.studentNo,
          form_class: updatedStudent.formClass,
          arm: updatedStudent.arm,
          stream: updatedStudent.stream,
          gender: updatedStudent.gender,
          guardian_name: updatedStudent.guardianName,
          guardian_phone: updatedStudent.guardianPhone,
          fee_balance: updatedStudent.feeBalance,
          status: updatedStudent.status,
        })
        .or(`admission_no.eq.${student.studentNo},id.eq.${student.id}`);
    } catch {
      // Graceful fallback if offline or table schema differs
    }

    setIsSaving(false);
    onSave(updatedStudent);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/90 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 text-lg">
              <i className="fas fa-user-edit"></i>
            </div>
            <div>
              <h3 className="text-base font-black text-white">Update Student Information</h3>
              <p className="text-xs text-slate-400">
                Modify biodata, admission number, and class allocation for{' '}
                <span className="text-blue-300 font-bold">{student.firstName} {student.lastName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 flex items-center gap-2">
              <i className="fas fa-exclamation-circle text-rose-400"></i>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Student Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                First Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 text-xs"
                placeholder="e.g. Fatima"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Last Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 text-xs"
                placeholder="e.g. Bello"
              />
            </div>
          </div>

          {/* Admission Number & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Admission Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.studentNo}
                onChange={(e) => setFormData({ ...formData, studentNo: e.target.value })}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-orange-400 font-mono font-bold outline-none focus:border-blue-500 text-xs"
                placeholder="e.g. NDASSS/JSS2A/001"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Male' | 'Female' })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 text-xs"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          {/* Class, Arm, Stream */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Class Level</label>
              <select
                value={formData.formClass}
                onChange={(e) => setFormData({ ...formData, formClass: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 text-xs"
              >
                <option value="JSS 1">JSS 1</option>
                <option value="JSS 2">JSS 2</option>
                <option value="JSS 3">JSS 3</option>
                <option value="SSS 1">SSS 1</option>
                <option value="SSS 2">SSS 2</option>
                <option value="SSS 3">SSS 3</option>
                <option value="Form 1A">Form 1A</option>
                <option value="Form 2B">Form 2B</option>
                <option value="Form 3C">Form 3C</option>
                <option value="SSS1 B">SSS1 B</option>
                <option value="SSS2">SSS2</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Arm / Division</label>
              <input
                type="text"
                value={formData.arm}
                onChange={(e) => setFormData({ ...formData, arm: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 text-xs"
                placeholder="A, B, C, Science, etc."
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Stream</label>
              <input
                type="text"
                value={formData.stream}
                onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 text-xs"
                placeholder="Science, Commercial, Arts..."
              />
            </div>
          </div>

          {/* House, Age, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">House</label>
              <input
                type="text"
                value={formData.house}
                onChange={(e) => setFormData({ ...formData, house: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 text-xs"
                placeholder="Dalet, Mogadishu..."
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) || 15 })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Enrollment Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Suspended' | 'Alumni' })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 text-xs"
              >
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
                <option value="Alumni">Alumni</option>
              </select>
            </div>
          </div>

          {/* Guardian Info */}
          <div className="pt-2 border-t border-slate-800">
            <h4 className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-2">Guardian / Sponsor Contacts</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Guardian Name</label>
                <input
                  type="text"
                  value={formData.guardianName}
                  onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 text-xs"
                  placeholder="e.g. Alh. Shehu Bello"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Guardian Phone</label>
                <input
                  type="text"
                  value={formData.guardianPhone}
                  onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 text-xs font-mono"
                  placeholder="e.g. +234 803 123 4567"
                />
              </div>
            </div>
          </div>

          {/* Fee Balance */}
          <div className="pt-2 border-t border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Outstanding Fee Balance (NGN)</label>
                <input
                  type="number"
                  value={formData.feeBalance}
                  onChange={(e) => setFormData({ ...formData, feeBalance: Number(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 text-xs"
                  placeholder="0"
                />
                <span className="text-[10px] text-slate-500">Set to 0 if fully paid.</span>
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer transition-all shadow-md shadow-blue-600/30 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-check"></i>
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

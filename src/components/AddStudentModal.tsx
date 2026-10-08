import React, { useState } from 'react';
import { Student } from '../types';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (student: Omit<Student, 'id'>) => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    studentNo: '',
    formClass: 'Form 1A',
    gender: 'Male' as 'Male' | 'Female',
    guardianName: '',
    guardianPhone: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      ...formData,
      schoolCode: 'NDASSS', // Default school code
      stream: 'General',
      guardianEmail: '',
      status: 'Active',
      feeBalance: 0,
      totalFees: 300000,
      attendanceRate: 100,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      securityQuestion1: '',
      securityAnswer1: '',
      securityQuestion2: '',
      securityAnswer2: '',
      pin: Math.floor(1000 + Math.random() * 9000).toString(),
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog-custom bg-slate-900 p-6 text-white" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-black mb-4">Add New Student</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="First Name" className="control" required onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
            <input type="text" placeholder="Last Name" className="control" required onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
          </div>
          <input type="text" placeholder="Admission No" className="control" required onChange={(e) => setFormData({...formData, studentNo: e.target.value})} />
          <input type="text" placeholder="Guardian Name" className="control" required onChange={(e) => setFormData({...formData, guardianName: e.target.value})} />
          <input type="text" placeholder="Guardian Phone" className="control" required onChange={(e) => setFormData({...formData, guardianPhone: e.target.value})} />
          
          <button type="submit" className="btn-main w-full">Save Student</button>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { Student } from '../types';
import {
  downloadAllStudentsRecordsCsv,
  generateStudentsRecordsCsvString,
  printAllStudentsRecordsTable,
  printAllStudentsRecordsCsvText
} from '../services/reportSheetExportService';
import { getSubjectsForClass } from '../services/studentPromotionService';
import { UpdateStudentModal } from './UpdateStudentModal';
import { DeleteStudentModal } from './DeleteStudentModal';
import { matchesClassAndArmFilter } from '../services/classArmFilterService';

export interface AllStudentsRecordsPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  currentSession?: string;
  currentTerm?: string;
  roleTitle?: string; // 'Administrator' or 'Examination Officer'
  onUpdateStudent?: (student: Student) => void;
  onDeleteStudent?: (studentId: string) => void;
}

type ViewMode = 'table' | 'csv' | 'print-sheet';

export const AllStudentsRecordsPreviewModal: React.FC<AllStudentsRecordsPreviewModalProps> = ({
  isOpen,
  onClose,
  students,
  currentSession = '2026/2027',
  currentTerm = 'Second Term',
  roleTitle = 'Admin & Exam Officer Registry',
  onUpdateStudent,
  onDeleteStudent
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedArm, setSelectedArm] = useState<string>('all');
  const [selectedFeeStatus, setSelectedFeeStatus] = useState<string>('all');
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<Student | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  // Compute unique classes and arms from data
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.formClass) set.add(s.formClass);
    });
    return Array.from(set).sort();
  }, [students]);

  const availableArms = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.arm) set.add(s.arm);
    });
    return Array.from(set).sort();
  }, [students]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = `${st.firstName} ${st.lastName}`.toLowerCase().includes(query);
        const matchesNo = (st.studentNo || '').toLowerCase().includes(query);
        const matchesClass = (st.formClass || '').toLowerCase().includes(query);
        const matchesGuardian = (st.guardianName || '').toLowerCase().includes(query);
        const matchesPhone = (st.guardianPhone || '').toLowerCase().includes(query);
        if (!matchesName && !matchesNo && !matchesClass && !matchesGuardian && !matchesPhone) {
          return false;
        }
      }

      // Class & Arm filter
      if (selectedClass !== 'all' || selectedArm !== 'all') {
        const matchesClassArm = matchesClassAndArmFilter(
          st,
          selectedClass === 'all' ? 'All' : selectedClass,
          selectedArm === 'all' ? 'All' : selectedArm
        );
        if (!matchesClassArm) return false;
      }

      // Fee status filter
      if (selectedFeeStatus !== 'all') {
        const hasBalance = (st.feeBalance || 0) > 0;
        if (selectedFeeStatus === 'paid' && hasBalance) return false;
        if (selectedFeeStatus === 'outstanding' && !hasBalance) return false;
      }

      return true;
    });
  }, [students, searchQuery, selectedClass, selectedArm, selectedFeeStatus]);

  // Generate CSV representation
  const csvString = useMemo(() => {
    return generateStudentsRecordsCsvString(filteredStudents, false);
  }, [filteredStudents]);

  // Quick statistics
  const stats = useMemo(() => {
    const total = students.length;
    const paid = students.filter((s) => (s.feeBalance || 0) <= 0).length;
    const male = students.filter((s) => s.gender === 'Male').length;
    const female = students.filter((s) => s.gender === 'Female').length;
    return { total, paid, male, female };
  }, [students]);

  if (!isOpen) return null;

  const handleDownloadCsv = () => {
    const fileName = `NDASSS_Students_Registry_${selectedClass !== 'all' ? selectedClass.replace(/\s+/g, '_') : 'All'}_${new Date().toISOString().split('T')[0]}.csv`;
    downloadAllStudentsRecordsCsv(filteredStudents, fileName);
    setActionNotice(`Downloaded ${filteredStudents.length} records in CSV format.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handlePrintTable = () => {
    printAllStudentsRecordsTable(
      filteredStudents,
      `NDASSS Students Registry (${filteredStudents.length} Students)`
    );
    setActionNotice(`Sent ${filteredStudents.length} student records to printer.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handlePrintCsvText = () => {
    printAllStudentsRecordsCsvText(
      filteredStudents,
      `NDASSS Students CSV Stream (${filteredStudents.length} Students)`
    );
    setActionNotice(`Printing raw CSV stream (${filteredStudents.length} records)...`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleCopyCsv = () => {
    navigator.clipboard.writeText(csvString).then(() => {
      setCopyFeedback(true);
      setActionNotice('CSV data copied to clipboard!');
      setTimeout(() => {
        setCopyFeedback(false);
        setActionNotice(null);
      }, 3000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-7xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-lg shadow-inner">
              <i className="fas fa-users-viewfinder"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-wide">
                  Comprehensive Student Records Preview
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {roleTitle}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official Roster: {students.length} Total Enrolled Students • {currentSession} ({currentTerm})
              </p>
            </div>
          </div>

          {/* Quick Actions (Download CSV, Print Table, Print CSV, Close) */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownloadCsv}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              title="Download all filtered student records as a RFC-4180 CSV spreadsheet file"
            >
              <i className="fas fa-file-csv text-white"></i>
              <span>Download CSV ({filteredStudents.length})</span>
            </button>

            <button
              onClick={handlePrintTable}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              title="Print official student registry table document formatted for printing"
            >
              <i className="fas fa-print text-white"></i>
              <span>Print Official Table</span>
            </button>

            <button
              onClick={handlePrintCsvText}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Print raw CSV text document"
            >
              <i className="fas fa-code text-slate-400"></i>
              <span>Print CSV Format</span>
            </button>

            <button
              onClick={handleCopyCsv}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Copy CSV string to clipboard"
            >
              <i className={`fas ${copyFeedback ? 'fa-check text-emerald-400' : 'fa-copy text-slate-400'}`}></i>
              <span>{copyFeedback ? 'Copied!' : 'Copy CSV'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-2 cursor-pointer"
              title="Close Preview"
            >
              <i className="fas fa-times text-lg"></i>
            </button>
          </div>
        </div>

        {/* FEEDBACK NOTICE BAR */}
        {actionNotice && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/40 px-6 py-2 text-xs text-emerald-300 flex items-center justify-between animate-fadeIn">
            <span className="flex items-center gap-2">
              <i className="fas fa-check-circle text-emerald-400"></i>
              {actionNotice}
            </span>
            <button onClick={() => setActionNotice(null)} className="text-emerald-400 hover:text-white">
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}

        {/* FILTER & VIEW CONTROLS TOOLBAR */}
        <div className="px-6 py-3 bg-slate-800/60 border-b border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
          {/* View Mode Switcher */}
          <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <i className="fas fa-table-cells"></i>
              <span>Interactive Table ({filteredStudents.length})</span>
            </button>
            <button
              onClick={() => setViewMode('csv')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'csv'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <i className="fas fa-file-code"></i>
              <span>Raw CSV Preview</span>
            </button>
            <button
              onClick={() => setViewMode('print-sheet')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'print-sheet'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <i className="fas fa-file-lines"></i>
              <span>Print Layout Preview</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-2.5 text-slate-500 text-xs"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, admission no, parent..."
                className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-56 sm:w-64"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-500 hover:text-white text-xs"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>

            {/* Class Filter */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Classes</option>
              <optgroup label="JSS 2 Streams">
                <option value="JSS 2">JSS 2 (All)</option>
                <option value="2A">★ JSS 2A (2A)</option>
                <option value="2B">★ JSS 2B (2B)</option>
                <option value="2C">★ JSS 2C (2C)</option>
                <option value="2D">★ JSS 2D (2D)</option>
              </optgroup>
              <optgroup label="JSS 1 & 3">
                <option value="1A">JSS 1A</option>
                <option value="1B">JSS 1B</option>
                <option value="1C">JSS 1C</option>
                <option value="1D">JSS 1D</option>
                <option value="3A">JSS 3A</option>
                <option value="3B">JSS 3B</option>
                <option value="3C">JSS 3C</option>
                <option value="3D">JSS 3D</option>
              </optgroup>
              <optgroup label="Senior Secondary">
                <option value="SSS 1A">SSS 1A</option>
                <option value="SSS 1B">SSS 1B</option>
                <option value="SSS 1C">SSS 1C</option>
                <option value="SSS 1D">SSS 1D</option>
                <option value="SSS 2A">SSS 2A</option>
                <option value="SSS 2B">SSS 2B</option>
                <option value="SSS 3A">SSS 3A</option>
                <option value="SSS 3B">SSS 3B</option>
              </optgroup>
            </select>

            {/* Arm Filter */}
            <select
              value={selectedArm}
              onChange={(e) => setSelectedArm(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Arms (A - E)</option>
              <option value="A">Arm A</option>
              <option value="B">Arm B</option>
              <option value="C">Arm C</option>
              <option value="D">Arm D</option>
              <option value="E">Arm E</option>
            </select>

            {/* Fee Filter */}
            <select
              value={selectedFeeStatus}
              onChange={(e) => setSelectedFeeStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Fee Status</option>
              <option value="paid">Fully Paid</option>
              <option value="outstanding">Outstanding Balance</option>
            </select>

            {/* Clear Filters Button */}
            {(searchQuery || selectedClass !== 'all' || selectedArm !== 'all' || selectedFeeStatus !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedClass('all');
                  setSelectedArm('all');
                  setSelectedFeeStatus('all');
                }}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg cursor-pointer"
                title="Reset all filters"
              >
                Reset
              </button>
            )}
          </div>

          {/* Quick Stream Buttons (2A differently, 2B differently...) */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-wide mr-1 flex items-center gap-1">
              <i className="fas fa-layer-group"></i> Quick Stream:
            </span>
            {['2A', '2B', '2C', '2D', '1A', '1B', '3A', 'SSS 1A', 'SSS 1B'].map((tag) => {
              const isSelected = selectedClass === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setSelectedClass(isSelected ? 'all' : tag);
                    setSelectedArm('all');
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-300'
                      : 'bg-slate-900 text-slate-300 border border-slate-700 hover:border-amber-500'
                  }`}
                  title={`Filter records by ${tag}`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* METRICS SUMMARY STRIP */}
        <div className="px-6 py-2 bg-slate-950/60 border-b border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span>
              Showing <strong className="text-white">{filteredStudents.length}</strong> of{' '}
              <strong className="text-white">{stats.total}</strong> Students
            </span>
            <span>•</span>
            <span>
              <i className="fas fa-mars text-blue-400 mr-1"></i> Male: <strong className="text-white">{stats.male}</strong>
            </span>
            <span>•</span>
            <span>
              <i className="fas fa-venus text-pink-400 mr-1"></i> Female: <strong className="text-white">{stats.female}</strong>
            </span>
            <span>•</span>
            <span>
              <i className="fas fa-check-circle text-emerald-400 mr-1"></i> Paid: <strong className="text-white">{stats.paid}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-500">
            <span>CSV Columns: <strong className="text-slate-300">24 Official Fields</strong></span>
            <span>•</span>
            <span>Auto-Joined Subjects: <strong className="text-emerald-400">Class & Arm Matched</strong></span>
          </div>
        </div>

        {/* MAIN BODY AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* VIEW 1: INTERACTIVE TABLE VIEW */}
          {viewMode === 'table' && (
            <div className="overflow-x-auto rounded-xl border border-slate-700/80 bg-slate-900/60 shadow-inner">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-800/90 text-slate-300 uppercase font-bold text-[10px] tracking-wider border-b border-slate-700">
                    <th className="py-3 px-3 text-center w-10">#</th>
                    <th className="py-3 px-3">Admission No</th>
                    <th className="py-3 px-3">Student Name</th>
                    <th className="py-3 px-3 text-center">Sex</th>
                    <th className="py-3 px-3">Class & Arm</th>
                    <th className="py-3 px-3">Stream</th>
                    <th className="py-3 px-3">Assigned Subjects</th>
                    <th className="py-3 px-3">Guardian / Phone</th>
                    <th className="py-3 px-3 text-right">Fee Status</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-normal">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-500">
                        <i className="fas fa-user-slash text-3xl mb-2 block"></i>
                        No student records match the active search and filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((st, idx) => {
                      const subjects = getSubjectsForClass(st.formClass, st.arm);
                      const isSelected = selectedStudentDetail?.id === st.id;
                      const hasBalance = (st.feeBalance || 0) > 0;

                      return (
                        <React.Fragment key={st.id}>
                          <tr
                            className={`hover:bg-slate-800/50 transition-colors ${
                              isSelected ? 'bg-slate-800/70 border-l-4 border-emerald-500' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                              {idx + 1}
                            </td>

                            <td className="py-2.5 px-3">
                              <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded text-[11px]">
                                {st.studentNo}
                              </span>
                            </td>

                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-white">
                                  {st.firstName} {st.lastName}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingStudent(st);
                                  }}
                                  className="text-slate-400 hover:text-orange-400 text-[10px] p-0.5 rounded cursor-pointer transition-colors"
                                  title={`Update / Edit ${st.firstName} ${st.lastName}`}
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingStudent(st);
                                  }}
                                  className="text-slate-400 hover:text-rose-400 text-[10px] p-0.5 rounded cursor-pointer transition-colors"
                                  title={`Remove / Delete ${st.firstName} ${st.lastName}`}
                                >
                                  <i className="fas fa-trash-alt"></i>
                                </button>
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {st.house ? `${st.house} House` : 'Enrolled'} • Age {st.age || 15}
                              </div>
                            </td>

                            <td className="py-2.5 px-3 text-center font-bold">
                              {st.gender === 'Female' ? (
                                <span className="text-pink-400 bg-pink-950/40 px-1.5 py-0.5 rounded text-[10px]">F</span>
                              ) : (
                                <span className="text-blue-400 bg-blue-950/40 px-1.5 py-0.5 rounded text-[10px]">M</span>
                              )}
                            </td>

                            <td className="py-2.5 px-3">
                              <span className="font-bold text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
                                {st.formClass}
                              </span>
                              {st.arm && (
                                <span className="ml-1 text-slate-400 text-[10px] font-semibold">
                                  ({st.arm})
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-3 text-slate-300 text-[11px]">
                              {st.stream || `${st.arm || 'General'} Stream`}
                            </td>

                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-emerald-300">
                                  {subjects.length} Subjects
                                </span>
                                <button
                                  onClick={() => setSelectedStudentDetail(isSelected ? null : st)}
                                  className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                                >
                                  {isSelected ? 'Hide' : 'View'}
                                </button>
                              </div>
                              <div className="text-[10px] text-slate-500 truncate max-w-xs mt-0.5">
                                {subjects.slice(0, 4).join(', ')}...
                              </div>
                            </td>

                            <td className="py-2.5 px-3">
                              <div className="text-slate-300 text-[11px] font-medium">
                                {st.guardianName || 'Parent / Guardian'}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {st.guardianPhone || 'No Phone Recorded'}
                              </div>
                            </td>

                            <td className="py-2.5 px-3 text-right">
                              {hasBalance ? (
                                <div>
                                  <span className="text-rose-400 font-bold text-[10px] bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-800/40">
                                    Bal: ₦{(st.feeBalance || 0).toLocaleString()}
                                  </span>
                                </div>
                              ) : (
                                <div>
                                  <span className="text-emerald-400 font-bold text-[10px] bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
                                    Fully Paid
                                  </span>
                                </div>
                              )}
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingStudent(st);
                                  }}
                                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-orange-400 hover:text-orange-300 transition-colors cursor-pointer text-xs"
                                  title="Update Student Record"
                                >
                                  <i className="fas fa-user-pen"></i>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingStudent(st);
                                  }}
                                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer text-xs"
                                  title="Remove / Delete Student"
                                >
                                  <i className="fas fa-trash-alt"></i>
                                </button>
                                <button
                                  onClick={() => setSelectedStudentDetail(isSelected ? null : st)}
                                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs"
                                  title="Expand Student Record Details"
                                >
                                  <i className={`fas ${isSelected ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* EXPANDED STUDENT DETAILS ROW */}
                          {isSelected && (
                            <tr className="bg-slate-950/70 border-b border-slate-800">
                              <td colSpan={10} className="p-4">
                                <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 shadow-md space-y-3">
                                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-black text-emerald-400 text-sm">
                                        {st.studentNo}
                                      </span>
                                      <span className="text-white font-bold text-sm">
                                        {st.firstName} {st.lastName}
                                      </span>
                                      <span className="text-xs text-slate-400">
                                        • Class: <strong className="text-cyan-300">{st.formClass}</strong>
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => setEditingStudent(st)}
                                        className="px-2.5 py-1 bg-orange-700 hover:bg-orange-600 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                      >
                                        <i className="fas fa-user-pen"></i> Edit Profile
                                      </button>
                                      <button
                                        onClick={() => setDeletingStudent(st)}
                                        className="px-2.5 py-1 bg-rose-800 hover:bg-rose-700 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                      >
                                        <i className="fas fa-trash-alt"></i> Remove Student
                                      </button>
                                    </div>
                                    <div className="text-xs text-slate-400">
                                      Session: <strong className="text-white">{st.session || currentSession}</strong> • Term: <strong className="text-white">{st.term || currentTerm}</strong>
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                                      <i className="fas fa-book-open text-emerald-400"></i>
                                      Official Joined Subjects for {st.formClass} ({subjects.length} Curriculum Units):
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5">
                                      {subjects.map((sub, sIdx) => (
                                        <span
                                          key={sIdx}
                                          className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1"
                                        >
                                          <span className="text-emerald-400 text-[10px]">#{sIdx + 1}</span>
                                          {sub}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-slate-800 text-slate-400">
                                    <div>
                                      <span className="text-slate-500">Guardian Contact:</span>{' '}
                                      <strong className="text-slate-200">{st.guardianName || 'N/A'}</strong> (
                                      {st.guardianPhone || 'N/A'})
                                    </div>
                                    <div>
                                      <span className="text-slate-500">Attendance Rate:</span>{' '}
                                      <strong className="text-slate-200">{st.attendanceRate ? `${st.attendanceRate}%` : '100%'}</strong>
                                    </div>
                                    <div>
                                      <span className="text-slate-500">Term Tuition:</span>{' '}
                                      <strong className="text-slate-200">₦{(st.totalFees || 380000).toLocaleString()}</strong>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW 2: RAW CSV CODE PREVIEW */}
          {viewMode === 'csv' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 text-xs">
                <span className="text-slate-300 font-mono">
                  RFC 4180 Format • {filteredStudents.length} Records • {(csvString.length / 1024).toFixed(1)} KB
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCsv}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <i className={`fas ${copyFeedback ? 'fa-check text-emerald-400' : 'fa-copy'}`}></i>
                    <span>{copyFeedback ? 'Copied' : 'Copy Text'}</span>
                  </button>
                  <button
                    onClick={handleDownloadCsv}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <i className="fas fa-download"></i>
                    <span>Download .CSV</span>
                  </button>
                  <button
                    onClick={handlePrintCsvText}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <i className="fas fa-print"></i>
                    <span>Print CSV</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-[58vh] leading-relaxed shadow-inner select-all">
                <pre>{csvString}</pre>
              </div>
            </div>
          )}

          {/* VIEW 3: PRINT SHEET SIMULATION PREVIEW */}
          {viewMode === 'print-sheet' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-blue-950/40 border border-blue-600/40 p-3 rounded-xl text-xs text-blue-200">
                <div className="flex items-center gap-2">
                  <i className="fas fa-print text-blue-400 text-base"></i>
                  <span>
                    Print Simulation View: This preview represents the A4 landscape document generated for physical paper print or PDF export.
                  </span>
                </div>
                <button
                  onClick={handlePrintTable}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow"
                >
                  <i className="fas fa-print"></i>
                  <span>Print Now</span>
                </button>
              </div>

              {/* Printable container replica */}
              <div className="bg-white text-slate-900 rounded-xl p-6 shadow-2xl border border-slate-300 max-h-[60vh] overflow-y-auto">
                <div className="border-b-2 border-slate-900 pb-3 mb-4 flex justify-between items-start">
                  <div>
                    <h1 className="text-base font-black tracking-wider uppercase text-slate-950">
                      Nigerian Defence Academy Secondary School
                    </h1>
                    <h2 className="text-xs font-bold text-sky-800 uppercase tracking-wide">
                      Official Comprehensive Student Registry & Curriculum Subject Allocation
                    </h2>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      Ribadu Campus, Kaduna • Academic Session: {currentSession} ({currentTerm})
                    </p>
                  </div>
                  <div className="text-right text-[10px] text-slate-600">
                    <div><strong>Total Students:</strong> {filteredStudents.length}</div>
                    <div><strong>Generated:</strong> {new Date().toLocaleDateString('en-GB')}</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white text-[10px] uppercase">
                        <th className="p-1.5 text-center w-8">#</th>
                        <th className="p-1.5">Admission No</th>
                        <th className="p-1.5">Full Name</th>
                        <th className="p-1.5 text-center">Sex</th>
                        <th className="p-1.5">Class</th>
                        <th className="p-1.5">Stream</th>
                        <th className="p-1.5">Registered Subjects</th>
                        <th className="p-1.5">Guardian Contact</th>
                        <th className="p-1.5 text-right">Fee Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredStudents.map((st, idx) => {
                        const subjects = getSubjectsForClass(st.formClass, st.arm);
                        const feeStatus = (st.feeBalance || 0) <= 0 ? 'Fully Paid' : 'Outstanding';
                        const feeColor = (st.feeBalance || 0) <= 0 ? 'text-emerald-700' : 'text-rose-700';

                        return (
                          <tr key={st.id} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                            <td className="p-1.5 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="p-1.5 font-mono font-bold text-slate-900">{st.studentNo}</td>
                            <td className="p-1.5 font-semibold text-slate-950">{st.firstName} {st.lastName}</td>
                            <td className="p-1.5 text-center font-bold">{st.gender || 'M'}</td>
                            <td className="p-1.5 font-bold text-sky-800">{st.formClass} {st.arm ? `(${st.arm})` : ''}</td>
                            <td className="p-1.5 text-slate-600">{st.stream || 'Standard'}</td>
                            <td className="p-1.5 text-slate-700 text-[10px]">
                              <strong>{subjects.length} Subs:</strong> {subjects.slice(0, 4).join(', ')}...
                            </td>
                            <td className="p-1.5 text-slate-700 text-[10px]">
                              {st.guardianName || 'Parent'} ({st.guardianPhone || '-'})
                            </td>
                            <td className={`p-1.5 text-right font-bold text-[10px] ${feeColor}`}>
                              {feeStatus}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-300 flex justify-between text-[10px] text-slate-500">
                  <div>NDASSS Management System • Confidential</div>
                  <div>Certified Official Record Sheet</div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-400">
            Showing <strong className="text-white">{filteredStudents.length}</strong> of{' '}
            <strong className="text-white">{students.length}</strong> student records
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintTable}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <i className="fas fa-print"></i>
              <span>Print Official Records</span>
            </button>

            <button
              onClick={handleDownloadCsv}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow"
            >
              <i className="fas fa-download"></i>
              <span>Download CSV File</span>
            </button>

            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>

      {/* MODAL: UPDATE STUDENT RECORD */}
      <UpdateStudentModal
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        student={editingStudent}
        onUpdate={(updated) => {
          onUpdateStudent?.(updated);
          if (selectedStudentDetail?.id === updated.id) {
            setSelectedStudentDetail(updated);
          }
          setActionNotice(`Updated student record for ${updated.firstName} ${updated.lastName}`);
          setTimeout(() => setActionNotice(null), 4000);
        }}
      />

      {/* MODAL: CONFIRM DELETE STUDENT */}
      <DeleteStudentModal
        isOpen={!!deletingStudent}
        onClose={() => setDeletingStudent(null)}
        student={deletingStudent}
        onConfirmDelete={(id) => {
          onDeleteStudent?.(id);
          if (selectedStudentDetail?.id === id) {
            setSelectedStudentDetail(null);
          }
          setActionNotice(`Removed student from registry.`);
          setTimeout(() => setActionNotice(null), 4000);
        }}
      />
    </div>
  );
};

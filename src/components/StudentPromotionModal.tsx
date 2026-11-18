import React, { useState, useMemo } from 'react';
import { Student } from '../types';
import {
  promoteStudentCohort,
  getSubjectsForClass,
  PromotionResult,
  getPromotedClass,
  formatAdmissionNo,
  extractArmLetter
} from '../services/studentPromotionService';
import { supabase } from '../lib/supabase';

export interface StudentPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onPromotionComplete: (updatedStudents: Student[], results: PromotionResult[]) => void;
  currentSession?: string;
  currentTerm?: string;
}

type PromotionStep = 'all' | 'jss1_jss2' | 'jss2_jss3' | 'jss3_sss1' | 'sss1_sss2' | 'sss2_sss3';

export const StudentPromotionModal: React.FC<StudentPromotionModalProps> = ({
  isOpen,
  onClose,
  students,
  onPromotionComplete,
  currentSession = '2026/2027',
  currentTerm = 'First Term',
}) => {
  const [selectedStep, setSelectedStep] = useState<PromotionStep>('all');
  const [targetSession, setTargetSession] = useState<string>(currentSession);
  const [targetTerm, setTargetTerm] = useState<string>(currentTerm);
  const [syncSupabase, setSyncSupabase] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedPreviewSubjectStudent, setSelectedPreviewSubjectStudent] = useState<string | null>(null);

  // Compute eligible target classes based on step
  const targetClassesForStep = useMemo(() => {
    switch (selectedStep) {
      case 'jss1_jss2':
        return ['JSS 1', 'JSS 1A', 'JSS 1B', 'JSS 1C', 'JSS 1D', 'JSS 1E', 'Form 1'];
      case 'jss2_jss3':
        return ['JSS 2', 'JSS 2A', 'JSS 2B', 'JSS 2C', 'JSS 2D', 'JSS 2E', 'Form 2'];
      case 'jss3_sss1':
        return ['JSS 3', 'JSS 3A', 'JSS 3B', 'JSS 3C', 'JSS 3D', 'JSS 3E', 'Form 3'];
      case 'sss1_sss2':
        return ['SSS 1', 'SSS 1A', 'SSS 1B', 'SSS 1C', 'SSS 1D', 'SSS 1E', 'SSS1', 'SSS1 B', 'Form 4'];
      case 'sss2_sss3':
        return ['SSS 2', 'SSS 2A', 'SSS 2B', 'SSS 2C', 'SSS 2D', 'SSS 2E', 'SSS2'];
      case 'all':
      default:
        return undefined; // All eligible classes
    }
  }, [selectedStep]);

  // Compute preview of promotion
  const promotionPreview = useMemo(() => {
    return promoteStudentCohort(students, {
      targetClasses: targetClassesForStep,
      newSession: targetSession,
      newTerm: targetTerm,
    });
  }, [students, targetClassesForStep, targetSession, targetTerm]);

  if (!isOpen) return null;

  const handleExecutePromotion = async () => {
    if (promotionPreview.results.length === 0) {
      setStatusMessage('No eligible candidates found in the selected promotion filter.');
      return;
    }

    setIsProcessing(true);
    setStatusMessage(`Promoting ${promotionPreview.results.length} students and joining curriculum subjects...`);

    // Optional background sync to Supabase
    if (syncSupabase) {
      try {
        const payload = promotionPreview.results.map((r) => ({
          admission_no: r.newAdmissionNo,
          first_name: r.student.firstName,
          last_name: r.student.lastName,
          gender: r.student.gender,
          guardian_name: r.student.guardianName,
          guardian_phone: r.student.guardianPhone,
          guardian_email: r.student.guardianEmail,
        }));
        await supabase.from('students').upsert(payload, { onConflict: 'admission_no' });
      } catch (err) {
        console.warn('Supabase promotion upsert notice:', err);
      }
    }

    onPromotionComplete(promotionPreview.promotedStudents, promotionPreview.results);
    setIsProcessing(false);
    setStatusMessage(`Successfully promoted ${promotionPreview.results.length} students into their next classes with newly joined subjects!`);

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleExportCsv = () => {
    if (promotionPreview.results.length === 0) return;

    const headers = [
      'New Admission No',
      'Old Admission No',
      'Full Name',
      'Gender',
      'Promoted Class',
      'Old Class',
      'Arm / Track',
      'Joined Subjects Count',
      'Joined Subjects List'
    ];

    const rows = promotionPreview.results.map((r) => [
      `"${r.newAdmissionNo}"`,
      `"${r.oldAdmissionNo}"`,
      `"${r.student.firstName} ${r.student.lastName}"`,
      `"${r.student.gender}"`,
      `"${r.newClass}"`,
      `"${r.oldClass}"`,
      `"${r.student.arm || 'General'}"`,
      r.joinedSubjectsCount,
      `"${r.subjects.join('; ')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NDASSS_Promoted_Students_${selectedStep.toUpperCase()}_${targetSession.replace(/\//g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600/20 text-teal-400 border border-teal-500/30 flex items-center justify-center text-lg font-bold">
              <i className="fas fa-level-up-alt"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">Student Progression & Class Promotion Engine</h3>
                <span className="text-[11px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                  NDASSS Registry
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Push students (JSS 1→2, JSS 2→3, JSS 3→SSS 1, SSS 1→2, SSS 2→3), format IDs as <code className="text-teal-300 font-mono">NDASSS/JSS2A/001</code>, and join matching curriculum subjects
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer shrink-0"
            aria-label="Close promotion modal"
          >
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Status Message */}
          {statusMessage && (
            <div className="p-3 rounded-xl bg-slate-800 border border-teal-500/40 text-xs text-teal-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <i className="fas fa-check-circle text-teal-400"></i>
                <span>{statusMessage}</span>
              </div>
              <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white text-xs">
                &times;
              </button>
            </div>
          )}

          {/* Configuration Controls Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Promotion Progression Level</label>
              <select
                value={selectedStep}
                onChange={(e) => setSelectedStep(e.target.value as PromotionStep)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500"
              >
                <option value="all">All Progression Tiers (Complete Cohort)</option>
                <option value="jss1_jss2">JSS 1 → JSS 2 (NDASSS/JSS2A/001...)</option>
                <option value="jss2_jss3">JSS 2 → JSS 3 (NDASSS/JSS3A/001...)</option>
                <option value="jss3_sss1">JSS 3 → SSS 1 (NDASSS/SSS1A/001...)</option>
                <option value="sss1_sss2">SSS 1 → SSS 2 (NDASSS/SSS2A/001...)</option>
                <option value="sss2_sss3">SSS 2 → SSS 3 (NDASSS/SSS3A/001...)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">New Academic Session</label>
              <input
                type="text"
                value={targetSession}
                onChange={(e) => setTargetSession(e.target.value)}
                placeholder="2026/2027"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">New Academic Term</label>
              <select
                value={targetTerm}
                onChange={(e) => setTargetTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500"
              >
                <option value="First Term">First Term (Resumption)</option>
                <option value="Second Term">Second Term</option>
                <option value="Third Term">Third Term</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={syncSupabase}
                  onChange={(e) => setSyncSupabase(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-0 cursor-pointer"
                />
                <span>Sync with Supabase DB</span>
              </label>
            </div>
          </div>

          {/* Promotion Mapping Rule Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            {[
              { from: 'JSS 1', to: 'JSS 2', format: 'NDASSS/JSS2A/001', subCount: 22, type: 'Junior Core' },
              { from: 'JSS 2', to: 'JSS 3', format: 'NDASSS/JSS3A/001', subCount: 22, type: 'Junior Core' },
              { from: 'JSS 3', to: 'SSS 1', format: 'NDASSS/SSS1A/001', subCount: 13, type: 'Stream Transition' },
              { from: 'SSS 1', to: 'SSS 2', format: 'NDASSS/SSS2A/001', subCount: 13, type: 'Senior Stream' },
              { from: 'SSS 2', to: 'SSS 3', format: 'NDASSS/SSS3A/001', subCount: 13, type: 'Terminal WASSCE' },
            ].map((rule) => {
              const countInRule = promotionPreview.results.filter((r) => r.newClass.startsWith(rule.to)).length;
              return (
                <div
                  key={rule.from}
                  className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-left space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{rule.from} &rarr; {rule.to}</span>
                    <span className="font-mono tabular-nums text-teal-400 font-bold">{countInRule}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 truncate">
                    {rule.format}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {rule.subCount} matching subjects joined &bull; {rule.type}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-950/70 rounded-xl border border-slate-800">
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-slate-400">Total School Roster: </span>
                <strong className="text-white font-mono tabular-nums">{students.length}</strong>
              </div>
              <div>
                <span className="text-slate-400">Ready to Push: </span>
                <strong className="text-teal-400 font-mono tabular-nums">{promotionPreview.summary.promoted}</strong>
              </div>
              {promotionPreview.summary.unchanged > 0 && (
                <div>
                  <span className="text-slate-400">Unchanged / Final Year: </span>
                  <strong className="text-slate-300 font-mono tabular-nums">{promotionPreview.summary.unchanged}</strong>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={promotionPreview.results.length === 0}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <i className="fas fa-file-csv text-teal-400"></i> Export Promoted CSV
              </button>
            </div>
          </div>

          {/* Promotion Preview Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40 text-left">
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900/90 sticky top-0 border-b border-slate-800 text-slate-300">
                  <tr>
                    <th className="p-2.5 font-bold">#</th>
                    <th className="p-2.5 font-bold">New Formatted Admission No</th>
                    <th className="p-2.5 font-bold">Candidate Name</th>
                    <th className="p-2.5 font-bold">Current Class</th>
                    <th className="p-2.5 font-bold text-teal-300">Promoted Class</th>
                    <th className="p-2.5 font-bold">Arm / Track</th>
                    <th className="p-2.5 font-bold">Matched Subjects</th>
                    <th className="p-2.5 font-bold text-center">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {promotionPreview.results.map((res, idx) => {
                    const isSelected = selectedPreviewSubjectStudent === res.student.id;
                    return (
                      <React.Fragment key={res.student.id}>
                        <tr className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-2.5 font-mono text-slate-500 tabular-nums">{idx + 1}</td>
                          <td className="p-2.5 font-mono font-bold text-teal-300">{res.newAdmissionNo}</td>
                          <td className="p-2.5 text-white font-medium">
                            {res.student.firstName} {res.student.lastName}
                          </td>
                          <td className="p-2.5 text-slate-400">{res.oldClass}</td>
                          <td className="p-2.5 font-bold text-emerald-400 flex items-center gap-1.5">
                            <span>{res.newClass}</span>
                            <span className="text-[10px] text-emerald-500">&bull; Promoted</span>
                          </td>
                          <td className="p-2.5 text-slate-300">{res.student.arm || 'General'}</td>
                          <td className="p-2.5 text-slate-300">
                            <span className="text-xs text-teal-400 font-mono font-bold">
                              {res.joinedSubjectsCount} Subjects
                            </span>
                            <span className="text-[11px] text-slate-400 ml-1.5">joined</span>
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedPreviewSubjectStudent(isSelected ? null : res.student.id)}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 cursor-pointer"
                            >
                              {isSelected ? 'Hide' : 'View Subjects'}
                            </button>
                          </td>
                        </tr>

                        {/* Subject inspection row if expanded */}
                        {isSelected && (
                          <tr className="bg-slate-900/90 border-y border-slate-800/80">
                            <td colSpan={8} className="p-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <strong className="text-white">
                                    Joined Curriculum Subjects for {res.student.firstName} {res.student.lastName} ({res.newClass}):
                                  </strong>
                                  <span className="text-slate-400 font-mono text-[11px]">
                                    {res.subjects.length} Total Registered
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {res.subjects.map((sub, sIdx) => (
                                    <span
                                      key={sIdx}
                                      className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[11px] text-slate-300 font-mono"
                                    >
                                      {sub}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              {promotionPreview.results.length} students queued for progression
            </span>
            <button
              type="button"
              disabled={promotionPreview.results.length === 0 || isProcessing}
              onClick={handleExecutePromotion}
              className={`px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md ${
                promotionPreview.results.length === 0 || isProcessing
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-teal-900/40 active:scale-95'
              }`}
            >
              {isProcessing ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Executing Promotion...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-check-circle"></i>
                  <span>Execute Class Promotion & Join Subjects ({promotionPreview.results.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPromotionModal;

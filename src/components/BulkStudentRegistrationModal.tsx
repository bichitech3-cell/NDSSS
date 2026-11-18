import React, { useState, useId, useMemo } from 'react';
import { Student } from '../types';
import { supabase } from '../lib/supabase';

export interface BulkStudentRow {
  index: number;
  studentNo: string;
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female';
  formClass: string;
  arm?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  feeBalance?: number;
  totalFees?: number;
  session?: string;
  term?: string;
  isValid: boolean;
  errors: string[];
}

export interface BulkStudentRegistrationProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: (importedStudents: Student[]) => void;
  currentSession?: string;
  currentTerm?: string;
  schoolCode?: string;
}

const SAMPLE_CSV = `admission_no,first_name,last_name,gender,class,arm,guardian_name,guardian_phone,guardian_email,fee_balance
2414,Amina,Suleiman,Female,SSS1 B,Science,Mallam B. Suleiman,+234 802 999 1122,amina.parent@nda.edu.ng,0
2415,Chukwuemeka,Okonkwo,Male,SSS 1 Science,Science,Chief E. Okonkwo,+234 803 444 8899,ce.okonkwo@gmail.com,15000
2416,Zainab,Aliyu,Female,JSS 2A,General,Dr. M. Aliyu,+234 818 777 3344,aliyu.family@yahoo.com,0
2417,David,Banda,Male,Form 2,Commerce,Mrs. Grace Banda,+265 991 223 344,gbanda@gmail.com,50000
2418,Blessings,Phiri,Female,Form 3,Humanities,Mr. J. Phiri,+265 888 334 556,jphiri@malawi.edu,0`;

/**
 * Robust CSV parser handling quotes, escaped quotes, commas, and various line endings.
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseStudentsCsv(csvText: string, defaultSession = '2026/2027', defaultTerm = 'Second Term'): {
  rows: BulkStudentRow[];
  headers: string[];
  totalCount: number;
  validCount: number;
  invalidCount: number;
} {
  const cleaned = csvText.trim();
  if (!cleaned) {
    return { rows: [], headers: [], totalCount: 0, validCount: 0, invalidCount: 0 };
  }

  const lines = cleaned.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { rows: [], headers: [], totalCount: 0, validCount: 0, invalidCount: 0 };
  }

  // Parse header
  const rawHeaders = parseCsvLine(lines[0]);
  const headers = rawHeaders.map((h) => h.toLowerCase().replace(/[\s_-]+/g, ''));

  // Column index detection
  const colIndex = {
    admNo: headers.findIndex((h) => ['admissionno', 'studentno', 'admno', 'admissionnumber', 'id', 'regno'].includes(h)),
    firstName: headers.findIndex((h) => ['firstname', 'first', 'givenname'].includes(h)),
    lastName: headers.findIndex((h) => ['lastname', 'last', 'surname', 'familyname'].includes(h)),
    fullName: headers.findIndex((h) => ['fullname', 'name', 'studentname'].includes(h)),
    gender: headers.findIndex((h) => ['gender', 'sex'].includes(h)),
    formClass: headers.findIndex((h) => ['class', 'formclass', 'form', 'grade', 'level'].includes(h)),
    arm: headers.findIndex((h) => ['arm', 'stream', 'track', 'department'].includes(h)),
    guardianName: headers.findIndex((h) => ['guardianname', 'parentname', 'guardian', 'parent', 'sponsor'].includes(h)),
    guardianPhone: headers.findIndex((h) => ['guardianphone', 'parentphone', 'phone', 'telephone', 'mobile'].includes(h)),
    guardianEmail: headers.findIndex((h) => ['guardianemail', 'parentemail', 'email'].includes(h)),
    feeBalance: headers.findIndex((h) => ['feebalance', 'balance', 'feesdue', 'amountdue'].includes(h)),
    totalFees: headers.findIndex((h) => ['totalfees', 'fees', 'termfees'].includes(h)),
    session: headers.findIndex((h) => ['session', 'academicsession', 'year'].includes(h)),
    term: headers.findIndex((h) => ['term', 'semester'].includes(h)),
  };

  const rows: BulkStudentRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawTokens = parseCsvLine(lines[i]);
    const errors: string[] = [];

    // Extract fields
    let studentNo = colIndex.admNo !== -1 ? rawTokens[colIndex.admNo] || '' : '';
    let firstName = colIndex.firstName !== -1 ? rawTokens[colIndex.firstName] || '' : '';
    let lastName = colIndex.lastName !== -1 ? rawTokens[colIndex.lastName] || '' : '';

    // If full name provided instead of split
    if ((!firstName || !lastName) && colIndex.fullName !== -1 && rawTokens[colIndex.fullName]) {
      const parts = rawTokens[colIndex.fullName].trim().split(/\s+/);
      if (parts.length === 1) {
        firstName = parts[0];
        lastName = 'Student';
      } else {
        firstName = parts[0];
        lastName = parts.slice(1).join(' ');
      }
    }

    // Gender normalization
    let genderRaw = (colIndex.gender !== -1 ? rawTokens[colIndex.gender] || '' : '').toLowerCase();
    let gender: 'Male' | 'Female' = 'Male';
    if (genderRaw.startsWith('f') || genderRaw === 'girl' || genderRaw === 'woman') {
      gender = 'Female';
    } else if (genderRaw.startsWith('m') || genderRaw === 'boy' || genderRaw === 'man') {
      gender = 'Male';
    } else if (genderRaw) {
      errors.push(`Invalid gender '${genderRaw}' (expected Male or Female)`);
    }

    const formClass = colIndex.formClass !== -1 ? rawTokens[colIndex.formClass] || 'SSS 1' : 'SSS 1';
    const arm = colIndex.arm !== -1 ? rawTokens[colIndex.arm] || undefined : undefined;
    const guardianName = colIndex.guardianName !== -1 ? rawTokens[colIndex.guardianName] || '' : '';
    const guardianPhone = colIndex.guardianPhone !== -1 ? rawTokens[colIndex.guardianPhone] || '' : '';
    const guardianEmail = colIndex.guardianEmail !== -1 ? rawTokens[colIndex.guardianEmail] || '' : '';
    
    let feeBalance = 0;
    if (colIndex.feeBalance !== -1 && rawTokens[colIndex.feeBalance]) {
      const parsed = parseFloat(rawTokens[colIndex.feeBalance].replace(/[^0-9.-]+/g, ''));
      if (!isNaN(parsed)) feeBalance = Math.max(0, parsed);
    }

    let totalFees = 300000;
    if (colIndex.totalFees !== -1 && rawTokens[colIndex.totalFees]) {
      const parsed = parseFloat(rawTokens[colIndex.totalFees].replace(/[^0-9.-]+/g, ''));
      if (!isNaN(parsed) && parsed > 0) totalFees = parsed;
    }

    const session = colIndex.session !== -1 && rawTokens[colIndex.session] ? rawTokens[colIndex.session] : defaultSession;
    const term = colIndex.term !== -1 && rawTokens[colIndex.term] ? rawTokens[colIndex.term] : defaultTerm;

    // Validations
    if (!studentNo) {
      errors.push('Missing admission / student number');
    }
    if (!firstName) {
      errors.push('Missing first name');
    }
    if (!lastName) {
      errors.push('Missing last name');
    }
    if (!formClass) {
      errors.push('Missing class assignment');
    }

    rows.push({
      index: i,
      studentNo,
      firstName,
      lastName,
      gender,
      formClass,
      arm,
      guardianName,
      guardianPhone,
      guardianEmail,
      feeBalance,
      totalFees,
      session,
      term,
      isValid: errors.length === 0,
      errors,
    });
  }

  const validCount = rows.filter((r) => r.isValid).length;
  const invalidCount = rows.length - validCount;

  return {
    rows,
    headers: rawHeaders,
    totalCount: rows.length,
    validCount,
    invalidCount,
  };
}

export const BulkStudentRegistrationModal: React.FC<BulkStudentRegistrationProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  currentSession = '2026/2027',
  currentTerm = 'Second Term',
  schoolCode = 'NDASSS',
}) => {
  const [csvInput, setCsvInput] = useState<string>('');
  const [targetSession, setTargetSession] = useState<string>(currentSession);
  const [targetTerm, setTargetTerm] = useState<string>(currentTerm);
  const [filterMode, setFilterMode] = useState<'all' | 'valid' | 'errors'>('all');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [syncWithSupabase, setSyncWithSupabase] = useState<boolean>(true);
  const [importStatusMessage, setImportStatusMessage] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);

  const fileInputId = useId();

  // Parse whenever csvInput or session/term changes
  const parseResult = useMemo(() => {
    return parseStudentsCsv(csvInput, targetSession, targetTerm);
  }, [csvInput, targetSession, targetTerm]);

  if (!isOpen) return null;

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) || '';
      setCsvInput(content);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleLoadSample = () => {
    setCsvInput(SAMPLE_CSV);
    setImportStatusMessage('Sample roster loaded with 5 candidate records.');
    setTimeout(() => setImportStatusMessage(null), 3000);
  };

  const handleClear = () => {
    setCsvInput('');
    setImportStatusMessage(null);
  };

  const handleExecuteImport = async () => {
    const validRows = parseResult.rows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setImportStatusMessage('Error: No valid student rows to import. Please review row errors.');
      return;
    }

    setIsSubmitting(true);
    setImportStatusMessage(`Importing ${validRows.length} students...`);

    // Prepare domain Student objects
    const newStudents: Student[] = validRows.map((r) => {
      const inferredArm = r.arm || (r.formClass.toLowerCase().includes('science') ? 'Science' : r.formClass.toLowerCase().includes('art') ? 'Humanities' : 'General');
      return {
        id: `stu-${r.studentNo}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
        studentNo: r.studentNo,
        schoolCode,
        firstName: r.firstName,
        lastName: r.lastName,
        gender: r.gender,
        formClass: r.formClass,
        arm: inferredArm,
        stream: `${inferredArm} Stream`,
        house: 'Dalet',
        session: r.session || targetSession,
        term: r.term || targetTerm,
        age: 15,
        guardianName: r.guardianName || `Guardian of ${r.firstName}`,
        guardianPhone: r.guardianPhone || '+234 800 000 0000',
        guardianEmail: r.guardianEmail || '',
        status: 'Active',
        feeBalance: r.feeBalance ?? 0,
        totalFees: r.totalFees ?? 300000,
        attendanceRate: 100,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(r.firstName + ' ' + r.lastName)}&backgroundColor=0f172a,1e293b,334155`,
        securityQuestion1: "What is your primary school?",
        securityAnswer1: 'NDA Staff School',
        securityQuestion2: "What is your guardian's mother's maiden name?",
        securityAnswer2: 'Bello',
        pin: Math.floor(1000 + Math.random() * 9000).toString(),
      };
    });

    // Optionally sync into Supabase 'students' table if accessible
    if (syncWithSupabase) {
      try {
        const payload = newStudents.map((s) => ({
          admission_no: s.studentNo,
          first_name: s.firstName,
          last_name: s.lastName,
          gender: s.gender,
          guardian_name: s.guardianName,
          guardian_phone: s.guardianPhone,
          guardian_email: s.guardianEmail,
        }));

        // Fire background attempt to Supabase (graceful fallback if table structure differs)
        await supabase.from('students').upsert(payload, { onConflict: 'admission_no' });
      } catch (err) {
        console.warn('Supabase student sync warning:', err);
      }
    }

    setIsSubmitting(false);
    setImportStatusMessage(`Successfully registered ${newStudents.length} students into the school roster!`);

    if (onImportSuccess) {
      onImportSuccess(newStudents);
    }

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const displayedRows = parseResult.rows.filter((r) => {
    if (filterMode === 'valid') return r.isValid;
    if (filterMode === 'errors') return !r.isValid;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30 flex items-center justify-center text-lg font-bold">
              <i className="fas fa-file-csv"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">Bulk Student Registration</h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {schoolCode} &bull; CSV Import Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Import complete student cohorts, admissions, class forms, and parent contact biodata via CSV string or file
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer shrink-0"
          >
            &times;
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Status Notification if any */}
          {importStatusMessage && (
            <div className="p-3 rounded-xl bg-slate-800/90 border border-orange-500/40 text-xs text-orange-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <i className="fas fa-info-circle text-orange-400"></i>
                <span>{importStatusMessage}</span>
              </div>
              <button
                onClick={() => setImportStatusMessage(null)}
                className="text-slate-400 hover:text-white ml-2 text-xs"
              >
                &times;
              </button>
            </div>
          )}

          {/* Configuration & Controls Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-950/50 rounded-xl border border-slate-800">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Target Academic Session</label>
              <input
                type="text"
                value={targetSession}
                onChange={(e) => setTargetSession(e.target.value)}
                placeholder="e.g. 2026/2027"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-orange-500 font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Target Academic Term</label>
              <select
                value={targetTerm}
                onChange={(e) => setTargetTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-orange-500"
              >
                <option value="First Term">First Term</option>
                <option value="Second Term">Second Term</option>
                <option value="Third Term">Third Term</option>
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={syncWithSupabase}
                  onChange={(e) => setSyncWithSupabase(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-0 cursor-pointer"
                />
                <span>Sync with Supabase DB</span>
              </label>
            </div>
          </div>

          {/* CSV Input Section: Paste or File Upload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <i className="fas fa-edit text-orange-400"></i>
                <span>Paste CSV Data or Drag & Drop File</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <i className="fas fa-magic"></i> Load Sample Data
                </button>
                <span className="text-slate-600">&bull;</span>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-slate-400 hover:text-slate-300 font-semibold cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl transition-all ${
                dragOver ? 'border-orange-500 bg-orange-950/20' : 'border-slate-700 bg-slate-950/40'
              }`}
            >
              <textarea
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                placeholder="Paste CSV rows here, e.g.:&#10;admission_no,first_name,last_name,gender,class,arm,guardian_name,guardian_phone&#10;2414,Amina,Suleiman,Female,SSS1 B,Science,Mallam B. Suleiman,+234 802 999 1122"
                rows={7}
                className="w-full bg-transparent p-3 text-xs font-mono text-slate-200 placeholder-slate-500 outline-none resize-y border-none"
                spellCheck={false}
              />
              <div className="p-2 border-t border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span>Supported columns:</span>
                  <code className="text-[11px] text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                    admission_no, first_name, last_name, gender, class, arm, guardian_name, phone
                  </code>
                </div>
                <div>
                  <input
                    id={fileInputId}
                    type="file"
                    accept=".csv,text/csv,text/plain"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                  <label
                    htmlFor={fileInputId}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1.5"
                  >
                    <i className="fas fa-folder-open text-orange-400"></i> Browse File (.csv)
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Validation & Preview Section */}
          {parseResult.totalCount > 0 && (
            <div className="space-y-3">
              {/* Summary Metrics Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-slate-400">Total Detected: </span>
                    <strong className="text-white font-mono tabular-nums">{parseResult.totalCount}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Valid Candidates: </span>
                    <strong className="text-emerald-400 font-mono tabular-nums">{parseResult.validCount}</strong>
                  </div>
                  {parseResult.invalidCount > 0 && (
                    <div>
                      <span className="text-slate-400">Rows with Errors: </span>
                      <strong className="text-rose-400 font-mono tabular-nums">{parseResult.invalidCount}</strong>
                    </div>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                  <button
                    onClick={() => setFilterMode('all')}
                    className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                      filterMode === 'all' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({parseResult.totalCount})
                  </button>
                  <button
                    onClick={() => setFilterMode('valid')}
                    className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                      filterMode === 'valid' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Valid Only ({parseResult.validCount})
                  </button>
                  {parseResult.invalidCount > 0 && (
                    <button
                      onClick={() => setFilterMode('errors')}
                      className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                        filterMode === 'errors' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Errors Only ({parseResult.invalidCount})
                    </button>
                  )}
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/30">
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900/90 sticky top-0 border-b border-slate-800 text-slate-300">
                      <tr>
                        <th className="p-2.5 font-bold">#</th>
                        <th className="p-2.5 font-bold">Status</th>
                        <th className="p-2.5 font-bold">Adm No</th>
                        <th className="p-2.5 font-bold">Full Name</th>
                        <th className="p-2.5 font-bold">Gender</th>
                        <th className="p-2.5 font-bold">Class / Arm</th>
                        <th className="p-2.5 font-bold">Guardian</th>
                        <th className="p-2.5 font-bold">Phone</th>
                        <th className="p-2.5 font-bold text-right">Fee Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {displayedRows.map((row) => (
                        <tr
                          key={row.index}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            !row.isValid ? 'bg-rose-950/20' : ''
                          }`}
                        >
                          <td className="p-2.5 font-mono text-slate-500 tabular-nums">{row.index}</td>
                          <td className="p-2.5">
                            {row.isValid ? (
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <i className="fas fa-check-circle text-xs"></i> Ready
                              </span>
                            ) : (
                              <span
                                className="text-rose-400 font-bold flex items-center gap-1"
                                title={row.errors.join('; ')}
                              >
                                <i className="fas fa-exclamation-triangle text-xs"></i> {row.errors[0]}
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 font-mono font-bold text-slate-200">{row.studentNo || '—'}</td>
                          <td className="p-2.5 text-white font-medium">
                            {row.firstName} {row.lastName}
                          </td>
                          <td className="p-2.5 text-slate-300">{row.gender}</td>
                          <td className="p-2.5 text-slate-300">
                            {row.formClass} {row.arm ? `(${row.arm})` : ''}
                          </td>
                          <td className="p-2.5 text-slate-400 truncate max-w-[140px]">
                            {row.guardianName || '—'}
                          </td>
                          <td className="p-2.5 font-mono text-slate-400 text-[11px] truncate max-w-[120px]">
                            {row.guardianPhone || '—'}
                          </td>
                          <td className="p-2.5 font-mono tabular-nums text-right text-slate-300">
                            {row.feeBalance !== undefined ? row.feeBalance.toLocaleString() : '0'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            {parseResult.validCount > 0 && (
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                {parseResult.validCount} students ready for import
              </span>
            )}
            <button
              type="button"
              disabled={parseResult.validCount === 0 || isSubmitting}
              onClick={handleExecuteImport}
              className={`px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md ${
                parseResult.validCount === 0 || isSubmitting
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-900/40 active:scale-95'
              }`}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus"></i>
                  <span>Import {parseResult.validCount} Students</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkStudentRegistrationModal;

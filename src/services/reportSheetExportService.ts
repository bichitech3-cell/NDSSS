import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { Student, SubjectMark } from '../types';
import { FATIMA_SUBJECTS } from '../data/mockData';
import { generateSubjectMarksForStudent, getSubjectsForClass } from './studentPromotionService';
import { NDA_LOGO_BASE64 } from './ndaLogoBase64';

export const STANDARD_SECONDARY_SUBJECTS: string[] = [
  'Mathematics',
  'English Language',
  'Civic Education',
  'Biology',
  'Chemistry',
  'Physics',
  'Further Mathematics',
  'Economics',
  'Computer Studies',
  'Agricultural Science',
  'Geography',
  'Catering Craft Practice',
  'Government',
  'Literature in English',
  'Commerce',
  'Financial Accounting',
  'Data Processing',
  'Technical Drawing',
  'Islamic Studies',
  'Christian Religious Studies',
  'Hausa Language'
];

export const CURRICULUM_PRESETS: Record<string, { name: string; subjects: string[] }> = {
  science: {
    name: 'Senior Science Stream',
    subjects: [
      'Mathematics',
      'English Language',
      'Civic Education',
      'Biology',
      'Chemistry',
      'Physics',
      'Computer Studies',
      'Further Mathematics',
      'Catering Craft Practice'
    ]
  },
  commercial: {
    name: 'Commercial & Business Studies',
    subjects: [
      'Mathematics',
      'English Language',
      'Civic Education',
      'Economics',
      'Commerce',
      'Financial Accounting',
      'Computer Studies',
      'Data Processing',
      'Agricultural Science'
    ]
  },
  arts: {
    name: 'Arts & Humanities',
    subjects: [
      'Mathematics',
      'English Language',
      'Civic Education',
      'Literature in English',
      'Government',
      'Economics',
      'Islamic Studies',
      'Geography',
      'Computer Studies'
    ]
  },
  general: {
    name: 'General Core Curriculum',
    subjects: [
      'Mathematics',
      'English Language',
      'Civic Education',
      'Computer Studies',
      'Economics',
      'Biology'
    ]
  }
};

export const computeSubjectGrade = (termTotal: number): { grade: SubjectMark['grade']; remark: SubjectMark['remark'] } => {
  if (termTotal >= 75) return { grade: 'A1', remark: 'EXCELLENT' };
  if (termTotal >= 70) return { grade: 'B2', remark: 'VERY GOOD' };
  if (termTotal >= 65) return { grade: 'B3', remark: 'GOOD' };
  if (termTotal >= 60) return { grade: 'C4', remark: 'CREDIT' };
  if (termTotal >= 55) return { grade: 'C5', remark: 'CREDIT' };
  if (termTotal >= 50) return { grade: 'C6', remark: 'CREDIT' };
  if (termTotal >= 45) return { grade: 'D7', remark: 'PASS' };
  if (termTotal >= 40) return { grade: 'D8', remark: 'PASS' };
  return { grade: 'F9', remark: 'FAIL' };
};

export const createDefaultSubjectMark = (
  subject: string,
  sNo: number = 1,
  cat1: number = 8,
  cat2: number = 9,
  cat3: number = 8,
  cat4: number = 8,
  examMarks: number = 45
): SubjectMark => {
  const catTotal = Math.min(40, cat1 + cat2 + cat3 + cat4);
  const exam = Math.min(60, examMarks);
  const termTotal = catTotal + exam;
  const { grade, remark } = computeSubjectGrade(termTotal);
  return {
    sNo,
    subject,
    cat1,
    cat2,
    cat3,
    cat4,
    catTotal,
    examMarks: exam,
    termTotal,
    classAverage: 58,
    formAverage: 52,
    grade,
    posInClass: 2,
    posInForm: 2,
    remark
  };
};

// Generate authentic subject marks for any student matching their specific class & curriculum
export const getStudentSubjectsData = (student: Student, baseSubjects: SubjectMark[] = FATIMA_SUBJECTS): SubjectMark[] => {
  if (student.studentNo === '2413') {
    return baseSubjects;
  }

  // If student is in a specific class other than Fatima's default, generate subjects matched to their class
  if (student.formClass && (student.formClass.includes('JSS') || student.formClass.includes('SSS 2') || student.formClass.includes('SSS 3') || student.formClass.includes('SSS 1C') || student.formClass.includes('SSS 1D') || student.formClass.includes('SSS 1E') || student.studentNo.includes('NDASSS/'))) {
    return generateSubjectMarksForStudent(student);
  }

  // Adjust scores slightly based on student position for realistic data
  const posOffset = (student.positionInClass || 2) - 1;
  return baseSubjects.map((s, index) => {
    const scoreDeduction = (posOffset * 2) + ((index % 3) * 1);
    const catTotal = Math.max(22, s.catTotal - Math.min(6, posOffset));
    const examMarks = Math.max(30, s.examMarks - Math.min(12, scoreDeduction));
    const termTotal = catTotal + examMarks;

    let grade: SubjectMark['grade'] = 'C4';
    let remark: SubjectMark['remark'] = 'CREDIT';

    if (termTotal >= 75) { grade = 'A1'; remark = 'EXCELLENT'; }
    else if (termTotal >= 70) { grade = 'B2'; remark = 'VERY GOOD'; }
    else if (termTotal >= 65) { grade = 'B3'; remark = 'GOOD'; }
    else if (termTotal >= 60) { grade = 'C4'; remark = 'CREDIT'; }
    else if (termTotal >= 55) { grade = 'C5'; remark = 'CREDIT'; }
    else if (termTotal >= 50) { grade = 'C6'; remark = 'CREDIT'; }
    else if (termTotal >= 45) { grade = 'D7'; remark = 'PASS'; }
    else if (termTotal >= 40) { grade = 'D8'; remark = 'PASS'; }
    else { grade = 'F9'; remark = 'FAIL'; }

    return {
      ...s,
      catTotal,
      examMarks,
      termTotal,
      grade,
      remark,
      posInClass: Math.min(student.noInClass || 68, (student.positionInClass || 1) + (index % 2)),
      posInForm: Math.min(student.noInForm || 170, (student.positionInForm || 1) + (index % 3))
    };
  });
};

// Generates the inner HTML for one student's report sheet - Exactly mirroring PDF layout & typography
export const generateReportSheetHtmlBody = (student: Student, subjects: SubjectMark[]): string => {
  const totalMarks = subjects.reduce((acc, curr) => acc + curr.termTotal, 0);
  const averagePercentage = (totalMarks / Math.max(1, subjects.length)).toFixed(2);
  const creditsAndAbove = subjects.filter(s => ['A1', 'B2', 'B3', 'C4', 'C5', 'C6'].includes(s.grade)).length;
  const passes = subjects.filter(s => ['D7', 'D8'].includes(s.grade)).length;
  const failures = subjects.filter(s => s.grade === 'F9').length;

  const characterTraits = [
    { trait: 'Punctuality', grade: 'B' },
    { trait: 'Carrying out Assignment', grade: 'A' },
    { trait: 'Participation in Social Activities', grade: 'B' },
    { trait: 'Neatness', grade: 'A' },
    { trait: 'Honesty', grade: 'A' },
    { trait: 'Self Control', grade: 'B' },
    { trait: 'Relationship with Others', grade: 'A' },
    { trait: 'Games, Sports', grade: 'B' },
    { trait: 'Attitude to Study', grade: 'A' }
  ];

  return `
    <div style="width: 100%; max-width: 780px; margin: 0 auto; border: 1.5pt solid #000000; padding: 8pt; background: #ffffff; box-sizing: border-box; font-family: Arial, Helvetica, sans-serif; color: #000000;">
      <!-- 1. HEADER SECTION (Crest, Academy Titles, Terminal Banner, Passport) -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; margin-bottom: 5pt;">
        <tr>
          <!-- Academy Official Crest Logo (Left) -->
          <td width="78" align="left" valign="middle" style="width: 78px; padding-right: 4pt;">
            <div style="width: 72px; height: 74px; text-align: center; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
              <img 
                src="${NDA_LOGO_BASE64}" 
                alt="NDA Crest Logo" 
                width="72" 
                height="72" 
                style="width: 72px; height: 72px; max-width: 72px; max-height: 72px; object-fit: contain; display: block; margin: 0 auto; -webkit-print-color-adjust: exact; print-color-adjust: exact;" 
              />
            </div>
          </td>

          <!-- Center Titles -->
          <td align="center" valign="middle" style="text-align: center; padding: 0 4pt;">
            <div style="font-size: 14pt; font-weight: bold; color: #000000; text-transform: uppercase; letter-spacing: 0.5px; font-family: Arial, sans-serif; line-height: 1.15;">
              NIGERIAN DEFENCE ACADEMY
            </div>
            <div style="font-size: 10.5pt; font-weight: bold; color: #111111; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 1.5pt; font-family: Arial, sans-serif;">
              STAFF SECONDARY SCHOOL
            </div>
            <div style="font-size: 7.5pt; color: #333333; margin-top: 1pt; font-family: Arial, sans-serif;">
              P.M.B. 2109, KADUNA &bull; NIGERIA
            </div>
            <table width="65%" align="center" cellpadding="0" cellspacing="0" border="0" style="margin: 3pt auto 0 auto; border-collapse: collapse;">
              <tr>
                <td bgcolor="#000000" align="center" style="background-color: #000000; color: #ffffff; font-size: 9pt; font-weight: bold; text-align: center; padding: 2.5pt 0; letter-spacing: 1.5px; text-transform: uppercase; font-family: Arial, sans-serif;">
                  TERMINAL REPORT
                </td>
              </tr>
            </table>
            <div style="font-size: 8.5pt; font-weight: bold; color: #000000; text-decoration: underline; margin-top: 3pt; letter-spacing: 0.5px; text-transform: uppercase; font-family: Arial, sans-serif;">
              CONTINUOUS ASSESSMENT DOSSIER
            </div>
          </td>

          <!-- Passport Box (Right) -->
          <td width="74" align="right" valign="middle" style="width: 74px; padding-left: 4pt;">
            <table cellpadding="0" cellspacing="0" border="0" style="width: 68px; height: 76px; border: 1pt solid #555555; background-color: #f8f9fa; text-align: center; border-collapse: collapse; margin-left: auto;">
              <tr>
                <td align="center" valign="middle" style="font-size: 6.5pt; font-weight: bold; color: #666666; font-family: Arial, sans-serif; line-height: 1.3; text-align: center; padding: 1px;">
                  ${student.avatarUrl ? `<img src="${student.avatarUrl}" alt="${student.firstName}" style="width: 64px; height: 72px; object-fit: cover; display: block; margin: 0 auto; -webkit-print-color-adjust: exact; print-color-adjust: exact;" />` : `AFFIX<br>PASSPORT<br>PHOTO`}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- 2. BIO-DATA SECTION (Exact 6 Rows x 3 Columns) -->
      <table width="100%" cellpadding="2" cellspacing="0" border="1" style="width: 100%; border-collapse: collapse; border: 0.75pt solid #000000; background-color: #fcfcfc; margin-bottom: 4.5pt; font-size: 7.5pt; font-family: Arial, sans-serif;">
        <tr>
          <td style="border: 0.5pt solid #000000; padding: 2.5pt 4pt; width: 33%;">
            <span style="font-weight: bold; color: #333333;">NAME:</span> <strong style="color: #000000; font-size: 8pt;">${student.lastName}, ${student.firstName}</strong>
          </td>
          <td style="border: 0.5pt solid #000000; padding: 2.5pt 4pt; width: 33%;">
            <span style="font-weight: bold; color: #333333;">ADM NO:</span> <strong style="color: #000000; font-size: 8pt;">${student.studentNo}</strong>
          </td>
          <td style="border: 0.5pt solid #000000; padding: 2.5pt 4pt; width: 34%;">
            <span style="font-weight: bold; color: #333333;">CLASS:</span> <strong style="color: #000000; font-size: 8pt;">${student.formClass}</strong>
          </td>
        </tr>
        <tr>
          <td style="border: 0.5pt solid #000000; padding: 2.5pt 4pt;">
            <span style="font-weight: bold; color: #333333;">SPONSOR:</span> <span>${student.sponsor || student.guardianName || 'Alhaji M. Abdullahi'}</span>
          </td>
          <td style="border: 0.5pt solid #000000; padding: 2.5pt 4pt;">
            <span style="font-weight: bold; color: #333333;">HOUSE:</span> <span>${student.house || 'Dalet'}</span>
          </td>
          <td style="border: 0.5pt solid #000000; padding: 2.5pt 4pt;">
            <span style="font-weight: bold; color: #333333;">SESSION:</span> <span>${student.session || '2020/21'}</span>
          </td>
        </tr>
        <tr>
          <td style="border: 0.5pt solid #000000; padding: 2.5pt 4pt;">
            <span style="font-weight: bold; color: #333333;">TERM:</span> <span>${student.term || 'SECOND'}</span>
          </td>
          <td style="border: 0.5pt solid #000000; padding: 2.5pt 4pt;">
            <span style="font-weight: bold; color: #333333;">AGE:</span> <span>${student.age || 16}</span>
          </td>
          <td style="border: 0.5pt solid #000000; padding: 2.5pt 4pt;">
            <span style="font-weight: bold; color: #333333;">CLASS AVG AGE:</span> <span>${student.classAverageAge || 15}</span>
          </td>
        </tr>
        <tr>
          <td style="border: 0.5pt solid #000000; padding: 2.5pt 4pt;">
            <span style="font-weight: bold; color: #333333;">TIMES OPENED:</span> <span>${student.timesOpened || 94}</span>
          </td>
          <td style="border: 0.5pt solid #000000; padding: 2.5pt 4pt;">
            <span style="font-weight: bold; color: #333333;">TIMES PRESENT:</span> <span>${student.timesPresent || 94}</span>
          </td>
          <td style="border: 0.5pt solid #000000; padding: 2.5pt 4pt;">
            <span style="font-weight: bold; color: #333333;">TIMES ABSENT:</span> <span>${student.timesAbsent || 0}</span>
          </td>
        </tr>
        <tr>
          <td style="border: 0.5pt solid #000000; padding: 2.5pt 4pt;">
            <span style="font-weight: bold; color: #333333;">NO IN CLASS:</span> <span>${student.noInClass || 68}</span>
          </td>
          <td style="border: 0.5pt solid #000000; padding: 2.5pt 4pt;">
            <span style="font-weight: bold; color: #333333;">POSITION IN CLASS:</span> <strong style="color: #000000;">${student.positionInClass || 1}</strong>
          </td>
          <td style="border: 0.5pt solid #000000; padding: 2.5pt 4pt;">
            <span style="font-weight: bold; color: #333333;">NO IN FORM:</span> <span>${student.noInForm || 170}</span>
          </td>
        </tr>
        <tr>
          <td style="border: 0.5pt solid #000000; padding: 2.5pt 4pt;">
            <span style="font-weight: bold; color: #333333;">POSITION IN FORM:</span> <strong style="color: #000000;">${student.positionInForm || 1}</strong>
          </td>
          <td style="border: 0.5pt solid #000000; padding: 2.5pt 4pt;">
            <span style="font-weight: bold; color: #333333;">CREDITS &amp; ABOVE:</span> <strong style="color: #006600;">${creditsAndAbove}</strong>
          </td>
          <td style="border: 0.5pt solid #000000; padding: 2.5pt 4pt;">
            <span style="font-weight: bold; color: #333333;">PASSES:</span> <span>${passes}</span> &bull; <span style="font-weight: bold; color: #333333;">FAILURES:</span> <span>${failures}</span>
          </td>
        </tr>
      </table>

      <!-- 3. CONTINUOUS ASSESSMENT SCORE TABLE (Exact PDF Columns & Sub-headers) -->
      <table width="100%" cellpadding="2" cellspacing="0" border="1" style="width: 100%; border-collapse: collapse; border: 0.75pt solid #000000; margin-bottom: 4.5pt; font-size: 7pt; font-family: Arial, sans-serif;">
        <thead>
          <tr bgcolor="#ebeef2" style="background-color: #ebeef2; font-weight: bold; text-align: center;">
            <th rowspan="2" style="border: 0.5pt solid #000000; width: 22px;">S/N</th>
            <th rowspan="2" style="border: 0.5pt solid #000000; text-align: left; padding-left: 4px; width: 175px;">CORE &amp; ELECTIVE SUBJECTS</th>
            <th style="border: 0.5pt solid #000000; width: 26px;">1st</th>
            <th style="border: 0.5pt solid #000000; width: 26px;">2nd</th>
            <th style="border: 0.5pt solid #000000; width: 26px;">3rd</th>
            <th style="border: 0.5pt solid #000000; width: 26px;">4th</th>
            <th style="border: 0.5pt solid #000000; width: 34px;">CAT</th>
            <th style="border: 0.5pt solid #000000; width: 34px;">Exam</th>
            <th style="border: 0.5pt solid #000000; width: 36px;">Term</th>
            <th style="border: 0.5pt solid #000000; width: 30px;">Cls</th>
            <th style="border: 0.5pt solid #000000; width: 30px;">Frm</th>
            <th style="border: 0.5pt solid #000000; width: 28px;">Grd</th>
            <th style="border: 0.5pt solid #000000; width: 26px;">Pos</th>
            <th style="border: 0.5pt solid #000000; width: 26px;">Pos</th>
            <th rowspan="2" style="border: 0.5pt solid #000000; width: 68px;">REMARK</th>
          </tr>
          <tr bgcolor="#ebeef2" style="background-color: #ebeef2; font-size: 5.8pt; color: #505050; text-align: center;">
            <th style="border: 0.5pt solid #000000;">(10)</th>
            <th style="border: 0.5pt solid #000000;">(10)</th>
            <th style="border: 0.5pt solid #000000;">(10)</th>
            <th style="border: 0.5pt solid #000000;">(10)</th>
            <th style="border: 0.5pt solid #000000;">(40)</th>
            <th style="border: 0.5pt solid #000000;">(60)</th>
            <th style="border: 0.5pt solid #000000;">(100)</th>
            <th style="border: 0.5pt solid #000000;">Avg</th>
            <th style="border: 0.5pt solid #000000;">Avg</th>
            <th style="border: 0.5pt solid #000000;"></th>
            <th style="border: 0.5pt solid #000000;">Cls</th>
            <th style="border: 0.5pt solid #000000;">Frm</th>
          </tr>
        </thead>
        <tbody>
          ${subjects.map((s, idx) => `
            <tr bgcolor="${idx % 2 === 1 ? '#f9fafc' : '#ffffff'}" style="background-color: ${idx % 2 === 1 ? '#f9fafc' : '#ffffff'}; text-align: center;">
              <td style="border: 0.5pt solid #000000; font-family: monospace; color: #444444;">${idx + 1}</td>
              <td style="border: 0.5pt solid #000000; text-align: left; padding-left: 4px; font-weight: bold; text-transform: uppercase; color: #000000;">${s.subject}</td>
              <td style="border: 0.5pt solid #000000; font-family: monospace;">${s.cat1}</td>
              <td style="border: 0.5pt solid #000000; font-family: monospace;">${s.cat2}</td>
              <td style="border: 0.5pt solid #000000; font-family: monospace;">${s.cat3}</td>
              <td style="border: 0.5pt solid #000000; font-family: monospace;">${s.cat4}</td>
              <td style="border: 0.5pt solid #000000; font-family: monospace; font-weight: bold;">${s.catTotal}</td>
              <td style="border: 0.5pt solid #000000; font-family: monospace; font-weight: bold;">${s.examMarks}</td>
              <td bgcolor="#eef5ff" style="border: 0.5pt solid #000000; font-family: monospace; font-weight: bold; background-color: #eef5ff; color: #002266;">${s.termTotal}</td>
              <td style="border: 0.5pt solid #000000; font-family: monospace; color: #444444;">${s.classAverage}</td>
              <td style="border: 0.5pt solid #000000; font-family: monospace; color: #444444;">${s.formAverage}</td>
              <td style="border: 0.5pt solid #000000; font-weight: bold; color: ${s.grade.startsWith('A') ? '#007800' : s.grade.startsWith('B') ? '#0046b4' : '#000000'};">${s.grade}</td>
              <td style="border: 0.5pt solid #000000; font-family: monospace;">${s.posInClass}</td>
              <td style="border: 0.5pt solid #000000; font-family: monospace;">${s.posInForm}</td>
              <td style="border: 0.5pt solid #000000; font-weight: bold; font-size: 6.2pt; text-transform: uppercase;">${s.remark}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr bgcolor="#ebeef2" style="background-color: #ebeef2; font-weight: bold; font-size: 7.2pt;">
            <td colspan="2" style="border: 0.5pt solid #000000; padding: 2.5pt 4pt; text-align: left;">
              Total Marks: <strong style="font-size: 8pt; color: #000000;">${totalMarks}</strong>
            </td>
            <td colspan="4" style="border: 0.5pt solid #000000; padding: 2.5pt 2pt; text-align: center;">
              Scores Average: <strong style="font-size: 8pt; color: #000000;">${averagePercentage}%</strong>
            </td>
            <td colspan="4" style="border: 0.5pt solid #000000; padding: 2.5pt 2pt; text-align: center;">
              Class Highest Avg: <strong style="color: #000000;">85.00%</strong>
            </td>
            <td colspan="5" style="border: 0.5pt solid #000000; padding: 2.5pt 2pt; text-align: center;">
              Form Highest Avg: <strong style="color: #000000;">85.00%</strong>
            </td>
          </tr>
        </tfoot>
      </table>

      <!-- 4. CHARACTER DEVELOPMENT / PSYCHOMOTOR & BEHAVIOURAL RATING (Exact PDF Side-by-Side) -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 4.5pt; border-collapse: collapse;">
        <tr>
          <!-- Psychomotor Domain Table (Left, 66% width) -->
          <td width="66%" valign="top" style="width: 66%; padding-right: 4pt;">
            <table width="100%" cellpadding="1.5" cellspacing="0" border="1" style="width: 100%; border-collapse: collapse; border: 0.75pt solid #000000; font-size: 6.8pt; font-family: Arial, sans-serif;">
              <thead>
                <tr bgcolor="#ebeef2" style="background-color: #ebeef2; font-weight: bold; text-align: center;">
                  <th style="border: 0.5pt solid #000000; text-align: left; padding: 2pt 4pt;">CHARACTER DEVELOPMENT / PSYCHOMOTOR DOMAIN</th>
                  <th style="border: 0.5pt solid #000000; width: 22px;">A</th>
                  <th style="border: 0.5pt solid #000000; width: 22px;">B</th>
                  <th style="border: 0.5pt solid #000000; width: 22px;">C</th>
                  <th style="border: 0.5pt solid #000000; width: 22px;">D</th>
                </tr>
              </thead>
              <tbody>
                ${characterTraits.map(item => `
                  <tr>
                    <td style="border: 0.5pt solid #000000; padding: 1.5pt 4pt; font-weight: normal; color: #000000;">${item.trait}</td>
                    <td style="border: 0.5pt solid #000000; text-align: center; font-weight: bold; color: #000000;">${item.grade === 'A' ? 'X' : ''}</td>
                    <td style="border: 0.5pt solid #000000; text-align: center; font-weight: bold; color: #000000;">${item.grade === 'B' ? 'X' : ''}</td>
                    <td style="border: 0.5pt solid #000000; text-align: center; font-weight: bold; color: #000000;">${item.grade === 'C' ? 'X' : ''}</td>
                    <td style="border: 0.5pt solid #000000; text-align: center; font-weight: bold; color: #000000;">${item.grade === 'D' ? 'X' : ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </td>

          <!-- Key to Behavioural Rating Box (Right, 34% width) -->
          <td width="34%" valign="top" style="width: 34%;">
            <table width="100%" cellpadding="3" cellspacing="0" border="1" style="width: 100%; border-collapse: collapse; border: 0.75pt solid #000000; background-color: #fcfcfc; font-size: 6.8pt; font-family: Arial, sans-serif;">
              <tr>
                <td style="padding: 4pt 6pt;">
                  <div style="text-align: center; font-weight: bold; font-size: 7.2pt; border-bottom: 0.5pt solid #b4b4b4; padding-bottom: 2pt; margin-bottom: 3pt; text-transform: uppercase;">
                    KEY TO BEHAVIOURAL RATING
                  </div>
                  <div style="margin: 2pt 0; font-size: 6.8pt;">A - Excellent</div>
                  <div style="margin: 2pt 0; font-size: 6.8pt;">B - Good</div>
                  <div style="margin: 2pt 0; font-size: 6.8pt;">C - Fair</div>
                  <div style="margin: 2pt 0; font-size: 6.8pt;">D - Poor</div>
                  <div style="margin-top: 5pt; padding-top: 3pt; border-top: 0.5pt dashed #888888; font-size: 6.8pt;">
                    <strong style="color: #000000;">Fee Account Status:</strong><br>
                    <span style="color: #007800; font-weight: bold;">Nil (Fully Settled)</span>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- 5. REMARKS & SIGNATURES SECTION (Exact PDF borders & layout) -->
      <table width="100%" cellpadding="3" cellspacing="0" border="1" style="width: 100%; border-collapse: collapse; border: 0.75pt solid #000000; margin-bottom: 4.5pt; font-size: 7.2pt; font-family: Arial, sans-serif;">
        <tr>
          <td width="72%" style="border: 0.5pt solid #000000; padding: 3pt 4pt;">
            <strong style="color: #000000;">FORM MASTER'S REMARK:</strong> <span style="font-style: italic; color: #111111;">A dedicated, hardworking, and exceptionally intelligent student.</span>
          </td>
          <td width="28%" style="border: 0.5pt solid #000000; padding: 3pt 4pt; text-align: right;">
            <strong style="color: #000000;">SIGNATURE:</strong> <span style="font-family: 'Brush Script MT', 'Lucida Calligraphy', cursive; font-size: 10.5pt; font-weight: normal; margin-left: 4px; color: #000000;">H. Danjuma</span>
          </td>
        </tr>
        <tr>
          <td style="border: 0.5pt solid #000000; padding: 3pt 4pt;">
            <strong style="color: #000000;">PRINCIPAL'S REMARK:</strong> <span style="font-style: italic; color: #111111;">Outstanding performance and character. Recommended for promotion.</span>
          </td>
          <td style="border: 0.5pt solid #000000; padding: 3pt 4pt; text-align: right;">
            <strong style="color: #000000;">SIGNATURE:</strong> <span style="font-family: 'Brush Script MT', 'Lucida Calligraphy', cursive; font-size: 10.5pt; font-weight: normal; margin-left: 4px; color: #000000;">Col. M. A. Principal</span>
          </td>
        </tr>
        <tr>
          <td style="border: 0.5pt solid #000000; padding: 3pt 4pt;">
            <strong style="color: #000000;">NEXT TERM BEGINS ON:</strong> <strong style="text-decoration: underline; margin-left: 4px; color: #000000;">Monday 26 July, 2021</strong>
          </td>
          <td style="border: 0.5pt solid #000000; padding: 3pt 4pt; text-align: right; color: #006600; font-weight: bold; font-size: 7.5pt;">
            [OFFICIALLY SEALED &amp; VERIFIED]
          </td>
        </tr>
      </table>

      <!-- 6. KEYS TO GRADES (Exact PDF wording & alignment) -->
      <table width="100%" cellpadding="2.5" cellspacing="0" border="1" style="width: 100%; border-collapse: collapse; border: 0.75pt solid #000000; background-color: #fcfcfc; margin-bottom: 4pt; font-size: 6.2pt; font-family: Arial, sans-serif;">
        <tr>
          <td style="padding: 2.5pt 4pt;">
            <strong style="text-transform: uppercase; margin-right: 4pt; font-size: 6.8pt; color: #000000;">KEYS TO GRADES:</strong>
            <span style="margin-right: 6pt;">75-100: A1 EXCELLENT</span>
            <span style="margin-right: 6pt;">|</span>
            <span style="margin-right: 6pt;">70-74: B2 VERY GOOD</span>
            <span style="margin-right: 6pt;">|</span>
            <span style="margin-right: 6pt;">65-69: B3 GOOD</span>
            <span style="margin-right: 6pt;">|</span>
            <span style="margin-right: 6pt;">60-64: C4 CREDIT</span>
            <span style="margin-right: 6pt;">|</span>
            <span style="margin-right: 6pt;">55-59: C5 CREDIT</span>
            <br>
            <span style="margin-left: 68pt; margin-right: 6pt;">50-54: C6 CREDIT</span>
            <span style="margin-right: 6pt;">|</span>
            <span style="margin-right: 6pt;">45-49: D7 PASS</span>
            <span style="margin-right: 6pt;">|</span>
            <span style="margin-right: 6pt;">40-44: D8 PASS</span>
            <span style="margin-right: 6pt;">|</span>
            <span>0-39: F9 FAIL</span>
          </td>
        </tr>
      </table>

      <!-- 7. SECURITY WATERMARK / FOOTER (Exact PDF Footer Line) -->
      <div style="text-align: center; font-size: 5.5pt; font-style: italic; color: #666666; font-family: Arial, sans-serif; margin-top: 3pt;">
        Official NDA Staff Secondary School Terminal Assessment Dossier &bull; Candidate Adm No: ${student.studentNo} &bull; Verified: ${new Date().toLocaleDateString('en-GB')}
      </div>
    </div>
  `;
};

// Generates the full Word document wrapping the HTML with MS Word namespaces and styles
export const createWordDocContent = (htmlBodies: string[], documentTitle: string = 'Terminal Report'): string => {
  return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${documentTitle}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
          <w:Compatibility>
            <w:BreakWrappedTables/>
            <w:SnapToGridInCell/>
            <w:WrapTextWithPunct/>
            <w:UseAsianBreakRules/>
          </w:Compatibility>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page Section1 {
          size: 210mm 297mm; /* Exact A4 portrait matching jsPDF */
          margin: 6mm 7mm 6mm 7mm;
          mso-header-margin: 0mm;
          mso-footer-margin: 0mm;
          mso-paper-source: 0;
        }
        div.Section1 { 
          page: Section1;
          mso-page-orientation: portrait;
        }
        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 7.5pt;
          color: #000000;
          background: #ffffff;
          margin: 0;
          padding: 0;
        }
        table {
          border-collapse: collapse;
          mso-table-lspace: 0pt;
          mso-table-rspace: 0pt;
          mso-padding-alt: 1.5pt 2.5pt 1.5pt 2.5pt;
        }
        td, th {
          border-color: #000000;
          mso-border-alt: solid windowtext .5pt;
        }
        tr {
          page-break-inside: avoid;
          mso-break-type: none;
        }
        .page-break { 
          page-break-before: always; 
          mso-break-type: section-break; 
        }
      </style>
    </head>
    <body>
      <div class="Section1">
        ${htmlBodies.map((body, index) => `
          ${index > 0 ? "<br clear=all style='page-break-before:always; mso-break-type:section-break'>" : ""}
          ${body}
        `).join('')}
      </div>
    </body>
    </html>
  `;
};

// Trigger download in browser
export const triggerBrowserDownload = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

// ============================================================================
// PDF GENERATION ENGINE USING jsPDF (High-Fidelity Official NDA Dossier)
// ============================================================================

export const renderStudentPdfPage = (
  doc: jsPDF,
  student: Student,
  subjects: SubjectMark[],
  isFirstPage: boolean = true
) => {
  if (!isFirstPage) {
    doc.addPage('a4', 'portrait');
  }

  const startX = 10;
  const contentWidth = 190;
  const totalMarks = subjects.reduce((acc, curr) => acc + curr.termTotal, 0);
  const averagePercentage = (totalMarks / subjects.length).toFixed(2);
  const creditsAndAbove = subjects.filter(s => ['A1', 'B2', 'B3', 'C4', 'C5', 'C6'].includes(s.grade)).length;
  const passes = subjects.filter(s => ['D7', 'D8'].includes(s.grade)).length;
  const failures = subjects.filter(s => s.grade === 'F9').length;

  // Outer Page Border
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(7, 6, 196, 285);

  // 1. HEADER SECTION (y: 8 to 36)
  // Crest / Official NDA Secondary School Logo
  try {
    doc.addImage(NDA_LOGO_BASE64, 'PNG', 11, 8, 20, 22, undefined, 'FAST');
  } catch {
    doc.setDrawColor(0, 34, 68);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(11, 8.5, 20, 21, 1, 1, 'FD');
    doc.setTextColor(0, 34, 68);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('NDA SSS', 21, 19, { align: 'center' });
    doc.setFontSize(5);
    doc.setTextColor(71, 85, 105);
    doc.text('KADUNA', 21, 24, { align: 'center' });
  }

  // Center Titles
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('NIGERIAN DEFENCE ACADEMY', 105, 14, { align: 'center' });
  doc.setFontSize(10.5);
  doc.text('STAFF SECONDARY SCHOOL', 105, 19, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(50, 50, 50);
  doc.text('P.M.B. 2109, KADUNA • NIGERIA', 105, 23, { align: 'center' });

  // Black Banner for "TERMINAL REPORT"
  doc.setFillColor(0, 0, 0);
  doc.rect(58, 25, 94, 5.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TERMINAL REPORT', 105, 29, { align: 'center' });

  // Dossier Subtitle
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('CONTINUOUS ASSESSMENT DOSSIER', 105, 34.5, { align: 'center' });
  doc.setLineWidth(0.3);
  doc.line(72, 35.2, 138, 35.2);

  // Passport Photo Box
  doc.setDrawColor(120, 120, 120);
  doc.setFillColor(248, 249, 250);
  doc.rect(176, 9, 21, 24, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(100, 100, 100);
  doc.text('AFFIX', 186.5, 20, { align: 'center' });
  doc.text('PASSPORT', 186.5, 23.5, { align: 'center' });

  // 2. BIO-DATA SECTION (y: 37 to 61)
  const bioY = 37;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.setFillColor(252, 252, 252);
  doc.rect(startX, bioY, contentWidth, 24, 'FD');

  // Bio-Data Rows
  const bioRows = [
    [
      { label: 'NAME:', val: `${student.lastName}, ${student.firstName}`, bold: true, x: 12 },
      { label: 'ADM NO:', val: student.studentNo, bold: true, x: 80 },
      { label: 'CLASS:', val: student.formClass, bold: true, x: 140 }
    ],
    [
      { label: 'SPONSOR:', val: student.sponsor || student.guardianName || 'Alhaji M. Abdullahi', x: 12 },
      { label: 'HOUSE:', val: student.house || 'Dalet', x: 80 },
      { label: 'SESSION:', val: student.session || '2020/21', x: 140 }
    ],
    [
      { label: 'TERM:', val: student.term || 'SECOND', x: 12 },
      { label: 'AGE:', val: String(student.age || 16), x: 80 },
      { label: 'CLASS AVG AGE:', val: String(student.classAverageAge || 15), x: 140 }
    ],
    [
      { label: 'TIMES OPENED:', val: String(student.timesOpened || 94), x: 12 },
      { label: 'TIMES PRESENT:', val: String(student.timesPresent || 94), x: 80 },
      { label: 'TIMES ABSENT:', val: String(student.timesAbsent || 0), x: 140 }
    ],
    [
      { label: 'NO IN CLASS:', val: String(student.noInClass || 68), x: 12 },
      { label: 'POSITION IN CLASS:', val: `${student.positionInClass || 1}`, bold: true, x: 80 },
      { label: 'NO IN FORM:', val: String(student.noInForm || 170), x: 140 }
    ],
    [
      { label: 'POSITION IN FORM:', val: `${student.positionInForm || 1}`, bold: true, x: 12 },
      { label: 'CREDITS & ABOVE:', val: `${creditsAndAbove}`, bold: true, color: [0, 100, 0], x: 80 },
      { label: 'PASSES:', val: `${passes}  •  FAILURES: ${failures}`, x: 140 }
    ]
  ];

  doc.setFontSize(7.5);
  bioRows.forEach((row, rIdx) => {
    const curY = bioY + 3.8 + (rIdx * 3.8);
    row.forEach(item => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text(item.label, item.x, curY);

      const labelWidth = doc.getTextWidth(item.label) + 1.5;
      if (item.bold) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }

      if (item.color) {
        doc.setTextColor(item.color[0], item.color[1], item.color[2]);
      } else {
        doc.setTextColor(0, 0, 0);
      }
      doc.text(item.val, item.x + labelWidth, curY);
    });
  });

  // 3. CONTINUOUS ASSESSMENT SCORE TABLE (y: 63 to 135)
  const tblY = 63;
  const colW = {
    sn: 6,
    sub: 44,
    cat1: 8.5,
    cat2: 8.5,
    cat3: 8.5,
    cat4: 8.5,
    catTot: 12,
    exam: 12,
    termTot: 13,
    clsAvg: 11,
    frmAvg: 11,
    grade: 10,
    posCls: 9,
    posFrm: 9,
    rem: 19
  };

  // Table Column X Coordinates
  const colX: { [key: string]: number } = {};
  let rollingX = startX;
  colX.sn = rollingX; rollingX += colW.sn;
  colX.sub = rollingX; rollingX += colW.sub;
  colX.cat1 = rollingX; rollingX += colW.cat1;
  colX.cat2 = rollingX; rollingX += colW.cat2;
  colX.cat3 = rollingX; rollingX += colW.cat3;
  colX.cat4 = rollingX; rollingX += colW.cat4;
  colX.catTot = rollingX; rollingX += colW.catTot;
  colX.exam = rollingX; rollingX += colW.exam;
  colX.termTot = rollingX; rollingX += colW.termTot;
  colX.clsAvg = rollingX; rollingX += colW.clsAvg;
  colX.frmAvg = rollingX; rollingX += colW.frmAvg;
  colX.grade = rollingX; rollingX += colW.grade;
  colX.posCls = rollingX; rollingX += colW.posCls;
  colX.posFrm = rollingX; rollingX += colW.posFrm;
  colX.rem = rollingX;

  // Header Background
  doc.setFillColor(235, 238, 242);
  doc.rect(startX, tblY, contentWidth, 8, 'F');
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(startX, tblY, contentWidth, 8);

  // Header Row 1 text
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);

  doc.text('S/N', colX.sn + colW.sn / 2, tblY + 3.5, { align: 'center' });
  doc.text('CORE & ELECTIVE SUBJECTS', colX.sub + 2, tblY + 3.5);
  doc.text('1st', colX.cat1 + colW.cat1 / 2, tblY + 3, { align: 'center' });
  doc.text('2nd', colX.cat2 + colW.cat2 / 2, tblY + 3, { align: 'center' });
  doc.text('3rd', colX.cat3 + colW.cat3 / 2, tblY + 3, { align: 'center' });
  doc.text('4th', colX.cat4 + colW.cat4 / 2, tblY + 3, { align: 'center' });
  doc.text('CAT', colX.catTot + colW.catTot / 2, tblY + 3, { align: 'center' });
  doc.text('Exam', colX.exam + colW.exam / 2, tblY + 3, { align: 'center' });
  doc.text('Term', colX.termTot + colW.termTot / 2, tblY + 3, { align: 'center' });
  doc.text('Cls', colX.clsAvg + colW.clsAvg / 2, tblY + 3, { align: 'center' });
  doc.text('Frm', colX.frmAvg + colW.frmAvg / 2, tblY + 3, { align: 'center' });
  doc.text('Grd', colX.grade + colW.grade / 2, tblY + 3.5, { align: 'center' });
  doc.text('Pos', colX.posCls + colW.posCls / 2, tblY + 3, { align: 'center' });
  doc.text('Pos', colX.posFrm + colW.posFrm / 2, tblY + 3, { align: 'center' });
  doc.text('REMARK', colX.rem + colW.rem / 2, tblY + 3.5, { align: 'center' });

  // Header Row 2 marks subtext
  doc.setFontSize(5.5);
  doc.setTextColor(80, 80, 80);
  doc.text('(10)', colX.cat1 + colW.cat1 / 2, tblY + 6.8, { align: 'center' });
  doc.text('(10)', colX.cat2 + colW.cat2 / 2, tblY + 6.8, { align: 'center' });
  doc.text('(10)', colX.cat3 + colW.cat3 / 2, tblY + 6.8, { align: 'center' });
  doc.text('(10)', colX.cat4 + colW.cat4 / 2, tblY + 6.8, { align: 'center' });
  doc.text('(40)', colX.catTot + colW.catTot / 2, tblY + 6.8, { align: 'center' });
  doc.text('(60)', colX.exam + colW.exam / 2, tblY + 6.8, { align: 'center' });
  doc.text('(100)', colX.termTot + colW.termTot / 2, tblY + 6.8, { align: 'center' });
  doc.text('Avg', colX.clsAvg + colW.clsAvg / 2, tblY + 6.8, { align: 'center' });
  doc.text('Avg', colX.frmAvg + colW.frmAvg / 2, tblY + 6.8, { align: 'center' });
  doc.text('Cls', colX.posCls + colW.posCls / 2, tblY + 6.8, { align: 'center' });
  doc.text('Frm', colX.posFrm + colW.posFrm / 2, tblY + 6.8, { align: 'center' });

  // Draw vertical grid lines for header
  Object.values(colX).forEach(x => {
    doc.line(x, tblY, x, tblY + 8);
  });
  doc.line(startX + contentWidth, tblY, startX + contentWidth, tblY + 8);

  // Subject Rows
  let curRowY = tblY + 8;
  const rowH = 4.8;
  subjects.forEach((s, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(249, 250, 252);
      doc.rect(startX, curRowY, contentWidth, rowH, 'F');
    }
    // Highlight Term Total background
    doc.setFillColor(238, 245, 255);
    doc.rect(colX.termTot, curRowY, colW.termTot, rowH, 'F');

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.rect(startX, curRowY, contentWidth, rowH);

    // Grid vertical lines
    Object.values(colX).forEach(x => {
      doc.line(x, curRowY, x, curRowY + rowH);
    });
    doc.line(startX + contentWidth, curRowY, startX + contentWidth, curRowY + rowH);

    // Row Data
    const textBaseY = curRowY + 3.4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(60, 60, 60);

    doc.text(String(idx + 1), colX.sn + colW.sn / 2, textBaseY, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(s.subject.toUpperCase(), colX.sub + 1.5, textBaseY);

    doc.setFont('helvetica', 'normal');
    doc.text(String(s.cat1), colX.cat1 + colW.cat1 / 2, textBaseY, { align: 'center' });
    doc.text(String(s.cat2), colX.cat2 + colW.cat2 / 2, textBaseY, { align: 'center' });
    doc.text(String(s.cat3), colX.cat3 + colW.cat3 / 2, textBaseY, { align: 'center' });
    doc.text(String(s.cat4), colX.cat4 + colW.cat4 / 2, textBaseY, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.text(String(s.catTotal), colX.catTot + colW.catTot / 2, textBaseY, { align: 'center' });
    doc.text(String(s.examMarks), colX.exam + colW.exam / 2, textBaseY, { align: 'center' });

    // Term Total
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 34, 102);
    doc.text(String(s.termTotal), colX.termTot + colW.termTot / 2, textBaseY, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(String(s.classAverage), colX.clsAvg + colW.clsAvg / 2, textBaseY, { align: 'center' });
    doc.text(String(s.formAverage), colX.frmAvg + colW.frmAvg / 2, textBaseY, { align: 'center' });

    // Grade
    doc.setFont('helvetica', 'bold');
    if (s.grade.startsWith('A')) doc.setTextColor(0, 120, 0);
    else if (s.grade.startsWith('B')) doc.setTextColor(0, 70, 180);
    else doc.setTextColor(0, 0, 0);
    doc.text(s.grade, colX.grade + colW.grade / 2, textBaseY, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(String(s.posInClass), colX.posCls + colW.posCls / 2, textBaseY, { align: 'center' });
    doc.text(String(s.posInForm), colX.posFrm + colW.posFrm / 2, textBaseY, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.text(s.remark.toUpperCase(), colX.rem + colW.rem / 2, textBaseY, { align: 'center' });

    curRowY += rowH;
  });

  // Table Summary Footer Row
  const footerH = 5.2;
  doc.setFillColor(235, 238, 242);
  doc.rect(startX, curRowY, contentWidth, footerH, 'F');
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(startX, curRowY, contentWidth, footerH);

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text(`Total Marks: ${totalMarks}`, startX + 3, curRowY + 3.6);
  doc.text(`Scores Average: ${averagePercentage}%`, startX + 50, curRowY + 3.6);
  doc.text(`Class Highest Avg: 85.00%`, startX + 105, curRowY + 3.6);
  doc.text(`Form Highest Avg: 85.00%`, startX + 152, curRowY + 3.6);

  curRowY += footerH + 2.5;

  // 4. CHARACTER DEVELOPMENT / PSYCHOMOTOR & BEHAVIOURAL RATING (y: ~124 to ~175)
  const traitBoxW = 126;
  const traitBoxH = 46;
  const traitX = startX;
  const traitY = curRowY;

  // Psychomotor Table
  doc.setFillColor(235, 238, 242);
  doc.rect(traitX, traitY, traitBoxW, 5, 'F');
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(traitX, traitY, traitBoxW, traitBoxH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(0, 0, 0);
  doc.text('CHARACTER DEVELOPMENT / PSYCHOMOTOR DOMAIN', traitX + 2, traitY + 3.5);

  const colTraitA = traitX + 94;
  const colTraitB = traitX + 102;
  const colTraitC = traitX + 110;
  const colTraitD = traitX + 118;

  doc.text('A', colTraitA + 3, traitY + 3.5, { align: 'center' });
  doc.text('B', colTraitB + 3, traitY + 3.5, { align: 'center' });
  doc.text('C', colTraitC + 3, traitY + 3.5, { align: 'center' });
  doc.text('D', colTraitD + 3, traitY + 3.5, { align: 'center' });

  [colTraitA, colTraitB, colTraitC, colTraitD].forEach(x => {
    doc.line(x, traitY, x, traitY + traitBoxH);
  });

  const traits = [
    { name: 'Punctuality', grade: 'B' },
    { name: 'Carrying out Assignment', grade: 'A' },
    { name: 'Participation in Social Activities', grade: 'B' },
    { name: 'Neatness', grade: 'A' },
    { name: 'Honesty', grade: 'A' },
    { name: 'Self Control', grade: 'B' },
    { name: 'Relationship with Others', grade: 'A' },
    { name: 'Games, Sports', grade: 'B' },
    { name: 'Attitude to Study', grade: 'A' }
  ];

  let curTraitY = traitY + 5;
  const tRowH = 4.5;
  traits.forEach((tr, i) => {
    doc.setDrawColor(210, 210, 210);
    doc.line(traitX, curTraitY, traitX + traitBoxW, curTraitY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(0, 0, 0);
    doc.text(tr.name, traitX + 2, curTraitY + 3.2);

    doc.setFont('helvetica', 'bold');
    if (tr.grade === 'A') doc.text('X', colTraitA + 3, curTraitY + 3.2, { align: 'center' });
    if (tr.grade === 'B') doc.text('X', colTraitB + 3, curTraitY + 3.2, { align: 'center' });
    if (tr.grade === 'C') doc.text('X', colTraitC + 3, curTraitY + 3.2, { align: 'center' });
    if (tr.grade === 'D') doc.text('X', colTraitD + 3, curTraitY + 3.2, { align: 'center' });

    curTraitY += tRowH;
  });

  // Right Side: Key to Behavioural Rating Box
  const keyX = traitX + traitBoxW + 2.5;
  const keyW = contentWidth - traitBoxW - 2.5;
  doc.setDrawColor(0, 0, 0);
  doc.setFillColor(252, 252, 252);
  doc.rect(keyX, traitY, keyW, traitBoxH, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  doc.text('KEY TO BEHAVIOURAL RATING', keyX + keyW / 2, traitY + 5, { align: 'center' });
  doc.setDrawColor(180, 180, 180);
  doc.line(keyX + 3, traitY + 7, keyX + keyW - 3, traitY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('A - Excellent', keyX + 5, traitY + 12);
  doc.text('B - Good', keyX + 5, traitY + 17);
  doc.text('C - Fair', keyX + 5, traitY + 22);
  doc.text('D - Poor', keyX + 5, traitY + 27);

  doc.setDrawColor(180, 180, 180);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(keyX + 3, traitY + 32, keyX + keyW - 3, traitY + 32);
  doc.setLineDashPattern([], 0);

  doc.setFont('helvetica', 'bold');
  doc.text('Fee Account Status:', keyX + 4, traitY + 37);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 120, 0);
  doc.text('Nil (Fully Settled)', keyX + 4, traitY + 41.5);

  curRowY = traitY + traitBoxH + 3;

  // 5. REMARKS & SIGNATURES SECTION (y: ~174 to ~202)
  const remH = 25;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(startX, curRowY, contentWidth, remH);

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text("FORM MASTER'S REMARK:", startX + 3, curRowY + 5);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.8);
  doc.text('A dedicated, hardworking, and exceptionally intelligent student.', startX + 40, curRowY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text('SIGNATURE:', startX + 140, curRowY + 5);
  doc.setFont('helvetica', 'italic');
  doc.text('H. Danjuma', startX + 162, curRowY + 5);

  doc.line(startX, curRowY + 8, startX + contentWidth, curRowY + 8);

  doc.setFont('helvetica', 'bold');
  doc.text("PRINCIPAL'S REMARK:", startX + 3, curRowY + 13);
  doc.setFont('helvetica', 'italic');
  doc.text('Outstanding performance and character. Recommended for promotion.', startX + 36, curRowY + 13);
  doc.setFont('helvetica', 'bold');
  doc.text('SIGNATURE:', startX + 140, curRowY + 13);
  doc.setFont('helvetica', 'italic');
  doc.text('Col. M. A. Principal', startX + 162, curRowY + 13);

  doc.line(startX, curRowY + 16.5, startX + contentWidth, curRowY + 16.5);

  doc.setFont('helvetica', 'bold');
  doc.text('NEXT TERM BEGINS ON:', startX + 3, curRowY + 21);
  doc.text('Monday 26 July, 2021', startX + 38, curRowY + 21);

  doc.setTextColor(0, 100, 0);
  doc.setFontSize(7.5);
  doc.text('[OFFICIALLY SEALED & VERIFIED]', startX + contentWidth - 4, curRowY + 21, { align: 'right' });

  curRowY += remH + 3;

  // 6. KEYS TO GRADES FOOTER (y: ~202 to ~216)
  doc.setDrawColor(0, 0, 0);
  doc.setFillColor(252, 252, 252);
  doc.rect(startX, curRowY, contentWidth, 10, 'FD');

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('KEYS TO GRADES:', startX + 2, curRowY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text(
    '75-100: A1 EXCELLENT   |   70-74: B2 VERY GOOD   |   65-69: B3 GOOD   |   60-64: C4 CREDIT   |   55-59: C5 CREDIT',
    startX + 26,
    curRowY + 4
  );
  doc.text(
    '50-54: C6 CREDIT   |   45-49: D7 PASS   |   40-44: D8 PASS   |   0-39: F9 FAIL',
    startX + 26,
    curRowY + 7.5
  );

  // Security Watermark / Footer line
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(5.5);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Official NDA Staff Secondary School Terminal Assessment Dossier • Candidate Adm No: ${student.studentNo} • Verified: ${new Date().toLocaleDateString('en-GB')}`,
    startX + contentWidth / 2,
    289,
    { align: 'center' }
  );
};

// Generate single student PDF Blob
export const generateStudentPdfBlob = (student: Student, subjects?: SubjectMark[]): Blob => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const marks = subjects || getStudentSubjectsData(student);
  renderStudentPdfPage(doc, student, marks, true);
  return doc.output('blob');
};

// Download single student PDF
export const downloadStudentPdf = (student: Student, subjects?: SubjectMark[]) => {
  const blob = generateStudentPdfBlob(student, subjects);
  const fileName = `NDASSS_Terminal_Report_${student.studentNo}_${student.lastName}_${student.firstName}.pdf`;
  triggerBrowserDownload(blob, fileName);
};

// Download selected students as a continuous multi-page PDF document
export const downloadSelectedCombinedPdf = (
  selectedStudents: Student[],
  className: string = 'SSS 1B',
  term: string = 'Second Term',
  getSubjects?: (student: Student) => SubjectMark[]
) => {
  if (!selectedStudents.length) return;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  selectedStudents.forEach((student, index) => {
    const marks = getSubjects ? getSubjects(student) : getStudentSubjectsData(student);
    renderStudentPdfPage(doc, student, marks, index === 0);
  });

  const fileName = `NDASSS_${className.replace(/\s+/g, '_')}_Selected_${selectedStudents.length}_Reports_${term.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
};

// Download all students in class as a continuous multi-page PDF document
export const downloadBulkCombinedPdf = (
  students: Student[],
  className: string = 'SSS 1B',
  term: string = 'Second Term',
  getSubjects?: (student: Student) => SubjectMark[]
) => {
  if (!students.length) return;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  students.forEach((student, index) => {
    const marks = getSubjects ? getSubjects(student) : getStudentSubjectsData(student);
    renderStudentPdfPage(doc, student, marks, index === 0);
  });

  const fileName = `NDASSS_${className.replace(/\s+/g, '_')}_Bulk_Class_Reports_${term.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
};

// ============================================================================
// BULK ZIP EXPORT ENGINES (PDF Reports & Word Reports)
// ============================================================================

// Download SELECTED students bundled into a single ZIP file containing individual PDF reports
export const downloadSelectedPdfZipArchive = async (
  selectedStudents: Student[],
  className: string = 'SSS 1B',
  term: string = 'Second Term',
  options: { includeCsv?: boolean; includeManifest?: boolean } = { includeCsv: true, includeManifest: true },
  getSubjects?: (student: Student) => SubjectMark[]
) => {
  if (!selectedStudents.length) return;
  const zip = new JSZip();
  const folderName = `NDASSS_${className.replace(/\s+/g, '_')}_Selected_${selectedStudents.length}_Reports_PDF`;
  const folder = zip.folder(folderName) || zip;

  // Add individual student PDF files
  for (const st of selectedStudents) {
    const marks = getSubjects ? getSubjects(st) : getStudentSubjectsData(st);
    const pdfDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    renderStudentPdfPage(pdfDoc, st, marks, true);
    const pdfArrayBuffer = pdfDoc.output('arraybuffer');
    const fileName = `Report_Sheet_${st.studentNo}_${st.lastName}_${st.firstName}.pdf`;
    folder.file(fileName, pdfArrayBuffer);
  }

  // Optional Class Broadsheet Summary CSV
  if (options.includeCsv !== false) {
    const headers = ['Adm No', 'Student Name', 'Class', 'Total Marks', 'Average %', 'Position in Class', 'Status'];
    const csvRows = selectedStudents.map((st) => {
      const marks = getSubjects ? getSubjects(st) : getStudentSubjectsData(st);
      const total = marks.reduce((acc, curr) => acc + curr.termTotal, 0);
      const avg = (total / Math.max(1, marks.length)).toFixed(2);
      return [st.studentNo, `"${st.lastName}, ${st.firstName}"`, st.formClass, total, `${avg}%`, st.positionInClass || 1, 'PASSED'];
    });
    const csvContent = [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\n');
    folder.file('Selected_Candidates_Summary.csv', csvContent);
  }

  // Optional Manifest
  if (options.includeManifest !== false) {
    const manifest = `NIGERIAN DEFENCE ACADEMY STAFF SECONDARY SCHOOL
P.M.B. 2109, KADUNA • NIGERIA
BULK TERMINAL EXAMINATION REPORT SHEETS PACKAGE (PDF FORMAT)

Class: ${className}
Term: ${term}
Session: 2020/21
Package Type: Individual Official PDF Dossiers in ZIP Archive
Total Selected Candidates: ${selectedStudents.length}
Candidate Adm Numbers: ${selectedStudents.map(s => s.studentNo).join(', ')}
Generated By: Examination Department (Dr. A. S. Danjuma)
Export Timestamp: ${new Date().toISOString()}
Date: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}

Contains:
- Individual authentic PDF continuous assessment dossiers with full WAEC/NECO grading
- Character development / psychomotor domain ratings
- Official Examination Officer verification seal
- Summary broadsheet CSV
`;
    folder.file('MANIFEST.txt', manifest);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  triggerBrowserDownload(content, `${folderName}.zip`);
};

// Download ALL class students bundled into a single ZIP file containing individual PDF reports
export const downloadBulkPdfZipArchive = async (
  students: Student[],
  className: string = 'SSS 1B',
  term: string = 'Second Term',
  getSubjects?: (student: Student) => SubjectMark[]
) => {
  return downloadSelectedPdfZipArchive(students, className, term, { includeCsv: true, includeManifest: true }, getSubjects);
};

// ============================================================================
// MICROSOFT WORD (.DOC) EXPORT ENGINE
// ============================================================================

// Download single student Microsoft Word document
export const downloadStudentWordDoc = (student: Student, subjects?: SubjectMark[]) => {
  const markList = subjects || getStudentSubjectsData(student);
  const htmlBody = generateReportSheetHtmlBody(student, markList);
  const title = `NDASSS_Terminal_Report_${student.studentNo}_${student.lastName}_${student.firstName}`;
  const docContent = createWordDocContent([htmlBody], title);

  const blob = new Blob(['\ufeff', docContent], {
    type: 'application/msword;charset=utf-8'
  });
  triggerBrowserDownload(blob, `${title}.doc`);
};

// Download SELECTED students in ONE continuous combined Microsoft Word document
export const downloadSelectedCombinedWordDoc = (
  selectedStudents: Student[],
  className: string = 'SSS 1B',
  term: string = 'Second Term',
  getSubjects?: (student: Student) => SubjectMark[]
) => {
  if (!selectedStudents.length) return;
  const bodies = selectedStudents.map((st) => {
    const marks = getSubjects ? getSubjects(st) : getStudentSubjectsData(st);
    return generateReportSheetHtmlBody(st, marks);
  });

  const title = `NDASSS_${className.replace(/\s+/g, '_')}_Selected_${selectedStudents.length}_Reports_${term.replace(/\s+/g, '_')}`;
  const docContent = createWordDocContent(bodies, `Selected Terminal Reports (${selectedStudents.length} Candidates) - ${className}`);

  const blob = new Blob(['\ufeff', docContent], {
    type: 'application/msword;charset=utf-8'
  });
  triggerBrowserDownload(blob, `${title}.doc`);
};

// Download all students in ONE bulk combined Microsoft Word document
export const downloadBulkCombinedWordDoc = (
  students: Student[],
  className: string = 'SSS 1B',
  term: string = 'Second Term',
  getSubjects?: (student: Student) => SubjectMark[]
) => {
  return downloadSelectedCombinedWordDoc(students, className, term, getSubjects);
};

// Download SELECTED students as individual Word documents inside a single ZIP archive
export const downloadSelectedZipArchive = async (
  selectedStudents: Student[],
  className: string = 'SSS 1B',
  term: string = 'Second Term',
  options: { includeCsv?: boolean; includeManifest?: boolean } = { includeCsv: true, includeManifest: true },
  getSubjects?: (student: Student) => SubjectMark[]
) => {
  if (!selectedStudents.length) return;
  const zip = new JSZip();
  const folderName = `NDASSS_${className.replace(/\s+/g, '_')}_Selected_${selectedStudents.length}_Reports_Word`;
  const folder = zip.folder(folderName) || zip;

  // Add individual student doc files
  selectedStudents.forEach((st) => {
    const marks = getSubjects ? getSubjects(st) : getStudentSubjectsData(st);
    const body = generateReportSheetHtmlBody(st, marks);
    const fileName = `Report_Sheet_${st.studentNo}_${st.lastName}_${st.firstName}.doc`;
    const docContent = createWordDocContent([body], `Terminal Report - ${st.firstName} ${st.lastName}`);
    folder.file(fileName, '\ufeff' + docContent);
  });

  // Include Selected Students CSV Summary
  if (options.includeCsv !== false) {
    const headers = ['Adm No', 'Student Name', 'Class', 'Total Marks', 'Average %', 'Position in Class', 'Status'];
    const csvRows = selectedStudents.map((st) => {
      const marks = getSubjects ? getSubjects(st) : getStudentSubjectsData(st);
      const total = marks.reduce((acc, curr) => acc + curr.termTotal, 0);
      const avg = (total / Math.max(1, marks.length)).toFixed(2);
      return [st.studentNo, `"${st.lastName}, ${st.firstName}"`, st.formClass, total, `${avg}%`, st.positionInClass || 1, 'PASSED'];
    });
    const csvContent = [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\n');
    folder.file('Selected_Candidates_Summary.csv', csvContent);
  }

  // Manifest
  if (options.includeManifest !== false) {
    const manifest = `NIGERIAN DEFENCE ACADEMY STAFF SECONDARY SCHOOL
P.M.B. 2109, KADUNA • NIGERIA
SELECTED TERMINAL EXAMINATION REPORT SHEETS PACKAGE (WORD FORMAT)

Class: ${className}
Term: ${term}
Session: 2020/21
Total Selected Candidates: ${selectedStudents.length}
Candidate Adm Numbers: ${selectedStudents.map(s => s.studentNo).join(', ')}
Generated By: Examination Department (Dr. A. S. Danjuma)
Export Timestamp: ${new Date().toISOString()}
Date: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}

Format: Microsoft Word (.doc) with complete continuous assessment dossiers, psychomotor domain evaluations, and official verification.
Compatible with: Microsoft Word (Desktop, 365, Mobile), Google Docs, LibreOffice Writer.
`;
    folder.file('MANIFEST.txt', manifest);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  triggerBrowserDownload(content, `${folderName}.zip`);
};

// Download all students as individual Word documents inside a ZIP archive
export const downloadBulkZipArchive = async (
  students: Student[],
  className: string = 'SSS 1B',
  term: string = 'Second Term',
  getSubjects?: (student: Student) => SubjectMark[]
) => {
  return downloadSelectedZipArchive(students, className, term, { includeCsv: true, includeManifest: true }, getSubjects);
};

// ============================================================================
// PRINT FUNCTIONALITY (High-Quality Print Preview with Page Breaks)
// ============================================================================

// Helper function to print report sheet HTML reliably using a hidden iframe
const printReportHtmlViaIframe = (htmlBody: string, title: string = 'Terminal Report') => {
  const printIframe = document.createElement('iframe');
  printIframe.style.position = 'fixed';
  printIframe.style.right = '0';
  printIframe.style.bottom = '0';
  printIframe.style.width = '0';
  printIframe.style.height = '0';
  printIframe.style.border = '0';
  document.body.appendChild(printIframe);

  const doc = printIframe.contentDocument || printIframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <meta charset="utf-8" />
      <base href="${window.location.origin}/" />
      <style>
        @page {
          size: A4 portrait;
          margin: 6mm 6mm 6mm 6mm;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          margin: 0;
          padding: 6px;
          background: #fff;
          color: #000;
          font-family: Arial, Helvetica, sans-serif;
        }
        img {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          display: block;
        }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      ${htmlBody}
    </body>
    </html>
  `);
  doc.close();

  const win = printIframe.contentWindow;
  if (!win) return;

  const trigger = () => {
    try {
      win.focus();
      win.print();
    } catch {
      // Ignored
    } finally {
      setTimeout(() => {
        if (printIframe.parentNode) {
          document.body.removeChild(printIframe);
        }
      }, 2000);
    }
  };

  const images = Array.from(doc.images);
  const unloaded = images.filter((img) => !img.complete);
  if (unloaded.length === 0) {
    setTimeout(trigger, 120);
  } else {
    let count = 0;
    unloaded.forEach((img) => {
      img.onload = img.onerror = () => {
        count++;
        if (count === unloaded.length) setTimeout(trigger, 120);
      };
    });
    setTimeout(trigger, 700);
  }
};

// Print single student report sheet cleanly
export const printSingleReportSheet = (student: Student, subjects?: SubjectMark[]) => {
  const markList = subjects || getStudentSubjectsData(student);
  const htmlBody = generateReportSheetHtmlBody(student, markList);

  try {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Terminal Report - ${student.firstName} ${student.lastName}</title>
          <meta charset="utf-8" />
          <base href="${window.location.origin}/" />
          <style>
            @page {
              size: A4 portrait;
              margin: 6mm 6mm 6mm 6mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              margin: 0;
              padding: 8px;
              background: #fff;
              color: #000;
              font-family: Arial, Helvetica, sans-serif;
            }
            img {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              display: block;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${htmlBody}
          <script>
            function triggerPrint() {
              const images = Array.from(document.images);
              const unloaded = images.filter(img => !img.complete);
              const doPrint = function() {
                window.focus();
                window.print();
                setTimeout(function() { window.close(); }, 1500);
              };
              if (unloaded.length === 0) {
                setTimeout(doPrint, 100);
              } else {
                let loaded = 0;
                unloaded.forEach(function(img) {
                  img.onload = img.onerror = function() {
                    loaded++;
                    if (loaded === unloaded.length) setTimeout(doPrint, 100);
                  };
                });
                setTimeout(doPrint, 800);
              }
            }
            if (document.readyState === 'complete') {
              triggerPrint();
            } else {
              window.onload = triggerPrint;
            }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      printReportHtmlViaIframe(htmlBody, `Terminal Report - ${student.firstName} ${student.lastName}`);
    }
  } catch {
    printReportHtmlViaIframe(htmlBody, `Terminal Report - ${student.firstName} ${student.lastName}`);
  }
};

// Print selected student report sheets in one continuous batch with clean page breaks
export const printSelectedReportSheets = (
  selectedStudents: Student[],
  getSubjects?: (student: Student) => SubjectMark[]
) => {
  if (!selectedStudents.length) return;
  const studentHtmls = selectedStudents.map(st => {
    const marks = getSubjects ? getSubjects(st) : getStudentSubjectsData(st);
    return `<div style="page-break-after: always; break-after: page;">${generateReportSheetHtmlBody(st, marks)}</div>`;
  }).join('');

  try {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Selected Terminal Reports (${selectedStudents.length} Candidates)</title>
          <meta charset="utf-8" />
          <base href="${window.location.origin}/" />
          <style>
            @page {
              size: A4 portrait;
              margin: 6mm 6mm 6mm 6mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              margin: 0;
              padding: 8px;
              background: #fff;
              color: #000;
              font-family: Arial, Helvetica, sans-serif;
            }
            img {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              display: block;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${studentHtmls}
          <script>
            function triggerPrint() {
              const images = Array.from(document.images);
              const unloaded = images.filter(img => !img.complete);
              const doPrint = function() {
                window.focus();
                window.print();
                setTimeout(function() { window.close(); }, 2000);
              };
              if (unloaded.length === 0) {
                setTimeout(doPrint, 150);
              } else {
                let loaded = 0;
                unloaded.forEach(function(img) {
                  img.onload = img.onerror = function() {
                    loaded++;
                    if (loaded === unloaded.length) setTimeout(doPrint, 150);
                  };
                });
                setTimeout(doPrint, 1000);
              }
            }
            if (document.readyState === 'complete') {
              triggerPrint();
            } else {
              window.onload = triggerPrint;
            }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      printReportHtmlViaIframe(studentHtmls, `Selected Terminal Reports (${selectedStudents.length} Candidates)`);
    }
  } catch {
    printReportHtmlViaIframe(studentHtmls, `Selected Terminal Reports (${selectedStudents.length} Candidates)`);
  }
};

// Print all class report sheets in one continuous batch with clean page breaks
export const printBulkReportSheets = (
  students: Student[],
  getSubjects?: (student: Student) => SubjectMark[]
) => {
  return printSelectedReportSheets(students, getSubjects);
};

/**
 * Generates raw CSV formatted string for all student records
 */
export const generateStudentsRecordsCsvString = (
  students: Student[],
  includeBom: boolean = false
): string => {
  const headers = [
    'Admission No',
    'First Name',
    'Last Name',
    'Full Name',
    'Gender',
    'Class',
    'Arm',
    'Stream',
    'House',
    'Academic Session',
    'Term',
    'Age',
    'Position in Class',
    'Total in Class',
    'Attendance Rate',
    'Fee Balance (NGN)',
    'Total Term Fees (NGN)',
    'Fee Payment Status',
    'Guardian Name',
    'Guardian Phone',
    'Guardian Email',
    'Enrollment Status',
    'Registered Subjects Count',
    'Registered Subjects List'
  ];

  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = students.map((st) => {
    const subjects = getSubjectsForClass(st.formClass, st.arm);
    const feeStatus = (st.feeBalance || 0) <= 0 ? 'Fully Paid' : 'Outstanding Balance';

    return [
      escapeCsv(st.studentNo),
      escapeCsv(st.firstName),
      escapeCsv(st.lastName),
      escapeCsv(`${st.firstName} ${st.lastName}`),
      escapeCsv(st.gender),
      escapeCsv(st.formClass),
      escapeCsv(st.arm || 'General'),
      escapeCsv(st.stream || `${st.arm || 'General'} Stream`),
      escapeCsv(st.house || 'Dalet'),
      escapeCsv(st.session || '2026/2027'),
      escapeCsv(st.term || 'Second Term'),
      escapeCsv(st.age || 15),
      escapeCsv(st.positionInClass || '-'),
      escapeCsv(st.noInClass || 45),
      escapeCsv(st.attendanceRate ? `${st.attendanceRate}%` : '100%'),
      escapeCsv(st.feeBalance ?? 0),
      escapeCsv(st.totalFees ?? 380000),
      escapeCsv(feeStatus),
      escapeCsv(st.guardianName || ''),
      escapeCsv(st.guardianPhone || ''),
      escapeCsv(st.guardianEmail || ''),
      escapeCsv(st.status || 'Active'),
      escapeCsv(subjects.length),
      escapeCsv(subjects.join('; '))
    ].join(',');
  });

  const body = [headers.join(','), ...rows].join('\r\n');
  return includeBom ? '\uFEFF' + body : body;
};

/**
 * Downloads comprehensive records of all students in CSV format
 * including admission numbers, names, classes, arms, guardians, financial status, and registered subjects.
 */
export const downloadAllStudentsRecordsCsv = (
  students: Student[],
  customFileName?: string
): void => {
  const csvContent = generateStudentsRecordsCsvString(students, true);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = customFileName || `NDASSS_All_Students_Records_${new Date().toISOString().split('T')[0]}.csv`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Prints the entire student records roster in an official, high-resolution tabular document
 * using an invisible print iframe that works reliably across all browsers and iframe contexts.
 */
export const printAllStudentsRecordsTable = (
  students: Student[],
  title: string = 'NDASSS All Students Roster & Academic Registry'
): void => {
  const printIframe = document.createElement('iframe');
  printIframe.style.position = 'fixed';
  printIframe.style.right = '0';
  printIframe.style.bottom = '0';
  printIframe.style.width = '0';
  printIframe.style.height = '0';
  printIframe.style.border = '0';
  document.body.appendChild(printIframe);

  const rowsHtml = students.map((st, idx) => {
    const subjects = getSubjectsForClass(st.formClass, st.arm);
    const feeStatus = (st.feeBalance || 0) <= 0 ? 'Fully Paid' : 'Outstanding Balance';
    const feeStatusColor = (st.feeBalance || 0) <= 0 ? '#166534' : '#991b1b';

    return `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 6px 8px; text-align: center; font-weight: bold; color: #64748b;">${idx + 1}</td>
        <td style="padding: 6px 8px; font-weight: bold; font-family: monospace; color: #0f172a;">${st.studentNo}</td>
        <td style="padding: 6px 8px; font-weight: 600; color: #1e293b;">${st.firstName} ${st.lastName}</td>
        <td style="padding: 6px 8px; text-align: center;">${st.gender || 'M'}</td>
        <td style="padding: 6px 8px; font-weight: bold; color: #0369a1;">${st.formClass} ${st.arm ? `(${st.arm})` : ''}</td>
        <td style="padding: 6px 8px; color: #475569;">${st.stream || 'Standard'}</td>
        <td style="padding: 6px 8px; color: #334155;">
          <strong>${subjects.length} Subjects:</strong><br/>
          <span style="color: #64748b; font-size: 10px;">${subjects.slice(0, 5).join(', ')}${subjects.length > 5 ? ` +${subjects.length - 5} more` : ''}</span>
        </td>
        <td style="padding: 6px 8px; color: #475569;">
          <div>${st.guardianName || 'Parent / Guardian'}</div>
          <div style="font-size: 10px; color: #64748b;">${st.guardianPhone || '-'}</div>
        </td>
        <td style="padding: 6px 8px; text-align: right; font-weight: bold; color: ${feeStatusColor};">
          <div>${feeStatus}</div>
          <div style="font-size: 10px; color: #64748b;">Bal: ₦${(st.feeBalance || 0).toLocaleString()}</div>
        </td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <meta charset="utf-8" />
      <style>
        @page {
          size: A4 landscape;
          margin: 10mm 10mm 10mm 10mm;
        }
        body {
          margin: 0;
          padding: 16px;
          background: #ffffff;
          color: #0f172a;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
        }
        th {
          background-color: #0f172a;
          color: #ffffff;
          padding: 8px;
          font-size: 11px;
          text-align: left;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        tr:nth-child(even) {
          background-color: #f8fafc;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 12px;">
        <div>
          <div style="font-size: 18px; font-weight: 900; letter-spacing: 0.05em; color: #0f172a; text-transform: uppercase;">
            Nigerian Defence Academy Secondary School
          </div>
          <div style="font-size: 12px; font-weight: bold; color: #0284c7; text-transform: uppercase; margin-top: 2px;">
            Official Comprehensive Student Registry & Curriculum Subject Allocation
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
            Permanent Site, Ribadu Campus, Kaduna, Nigeria • Verified Academic Roster
          </div>
        </div>
        <div style="text-align: right; font-size: 11px; color: #475569;">
          <div><strong>Total Enrolled Students:</strong> ${students.length}</div>
          <div><strong>Academic Session:</strong> 2026/2027 • Second Term</div>
          <div><strong>Export Date:</strong> ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="text-align: center; width: 30px;">#</th>
            <th style="width: 130px;">Admission No</th>
            <th style="width: 160px;">Full Name</th>
            <th style="text-align: center; width: 40px;">Sex</th>
            <th style="width: 80px;">Class</th>
            <th style="width: 100px;">Stream</th>
            <th>Registered Subjects</th>
            <th style="width: 160px;">Guardian Info</th>
            <th style="text-align: right; width: 130px;">Financial Status</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div style="margin-top: 18px; display: flex; justify-content: space-between; font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 8px;">
        <div>NDASSS Management System • Confidential Student Records</div>
        <div>Page 1 of 1 • System Generated Registry</div>
      </div>
    </body>
    </html>
  `;

  if (printIframe.contentDocument) {
    printIframe.contentDocument.open();
    printIframe.contentDocument.write(htmlContent);
    printIframe.contentDocument.close();

    setTimeout(() => {
      printIframe.contentWindow?.focus();
      printIframe.contentWindow?.print();
      setTimeout(() => {
        if (printIframe.parentNode) {
          document.body.removeChild(printIframe);
        }
      }, 2000);
    }, 400);
  }
};

/**
 * Prints raw CSV content of all students records with monospaced tabular styling
 */
export const printAllStudentsRecordsCsvText = (
  students: Student[],
  title: string = 'NDASSS Student Records Raw CSV Export'
): void => {
  const csvText = generateStudentsRecordsCsvString(students, false);
  const printIframe = document.createElement('iframe');
  printIframe.style.position = 'fixed';
  printIframe.style.right = '0';
  printIframe.style.bottom = '0';
  printIframe.style.width = '0';
  printIframe.style.height = '0';
  printIframe.style.border = '0';
  document.body.appendChild(printIframe);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <meta charset="utf-8" />
      <style>
        @page {
          size: A4 landscape;
          margin: 8mm 8mm 8mm 8mm;
        }
        body {
          margin: 0;
          padding: 16px;
          background: #ffffff;
          color: #0f172a;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 9px;
          line-height: 1.4;
        }
        pre {
          white-space: pre-wrap;
          word-break: break-all;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          padding: 12px;
          border-radius: 4px;
        }
        .header {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          margin-bottom: 12px;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 8px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div style="font-size: 16px; font-weight: bold;">NIGERIAN DEFENCE ACADEMY SECONDARY SCHOOL (NDASSS)</div>
        <div style="font-size: 12px; color: #475569;">CSV RECORDS EXPORT • ${students.length} Total Student Profiles • Printed on ${new Date().toLocaleString()}</div>
      </div>
      <pre>${csvText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
    </body>
    </html>
  `;

  if (printIframe.contentDocument) {
    printIframe.contentDocument.open();
    printIframe.contentDocument.write(htmlContent);
    printIframe.contentDocument.close();

    setTimeout(() => {
      printIframe.contentWindow?.focus();
      printIframe.contentWindow?.print();
      setTimeout(() => {
        if (printIframe.parentNode) {
          document.body.removeChild(printIframe);
        }
      }, 2000);
    }, 400);
  }
};


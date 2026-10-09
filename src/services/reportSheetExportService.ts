import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { Student, SubjectMark } from '../types';
import { FATIMA_SUBJECTS } from '../data/mockData';

// Generate mock/authentic subject marks for any student based on their class position
export const getStudentSubjectsData = (student: Student, baseSubjects: SubjectMark[] = FATIMA_SUBJECTS): SubjectMark[] => {
  if (student.studentNo === '2413') {
    return baseSubjects;
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

// Generates the inner HTML for one student's report sheet
export const generateReportSheetHtmlBody = (student: Student, subjects: SubjectMark[]): string => {
  const totalMarks = subjects.reduce((acc, curr) => acc + curr.termTotal, 0);
  const averagePercentage = (totalMarks / subjects.length).toFixed(2);
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
    <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; font-size: 11px; color: #111; line-height: 1.35; padding: 12px; border: 2px solid #000; margin-bottom: 24px; background: #ffffff;">
      <!-- HEADER -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
        <tr>
          <td style="width: 80px; text-align: center; vertical-align: middle;">
            <div style="width: 70px; height: 70px; border: 1.5pt solid #003366; background: #002244; color: #fff; font-size: 18px; font-weight: bold; line-height: 70px; text-align: center; border-radius: 4px;">
              NDA
            </div>
          </td>
          <td style="text-align: center; vertical-align: middle; padding: 0 10px;">
            <h1 style="font-size: 19px; font-weight: 900; margin: 0; color: #000; text-transform: uppercase; letter-spacing: 0.5px;">
              NIGERIAN DEFENCE ACADEMY
            </h1>
            <h2 style="font-size: 14px; font-weight: bold; margin: 2px 0; color: #111; text-transform: uppercase; letter-spacing: 1px;">
              STAFF SECONDARY SCHOOL
            </h2>
            <p style="font-size: 10px; font-weight: bold; margin: 1px 0; color: #333; text-transform: uppercase;">
              P.M.B. 2109, KADUNA &bull; NIGERIA
            </p>
            <div style="background: #000; color: #fff; font-size: 13px; font-weight: 900; padding: 2px 0; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">
              TERMINAL REPORT
            </div>
          </td>
          <td style="width: 80px; text-align: center; vertical-align: middle;">
            <div style="width: 70px; height: 85px; border: 1.5pt solid #555; background: #f8f9fa; font-size: 9px; font-weight: bold; text-align: center; padding-top: 30px; box-sizing: border-box; color: #444;">
              AFFIX PASSPORT
            </div>
          </td>
        </tr>
      </table>

      <div style="text-align: center; font-size: 12px; font-weight: 900; text-transform: uppercase; margin: 4px 0 8px 0; text-decoration: underline; letter-spacing: 0.5px;">
        CONTINUOUS ASSESSMENT DOSSIER
      </div>

      <!-- BIO DATA GRID -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 10px; font-weight: bold; text-transform: uppercase;">
        <tr>
          <td style="padding: 2px 4px; width: 33%;">NAME: <span style="font-weight: 900; color: #000;">${student.lastName}, ${student.firstName}</span></td>
          <td style="padding: 2px 4px; width: 33%;">ADM NO: <span style="font-weight: 900; color: #000;">${student.studentNo}</span></td>
          <td style="padding: 2px 4px; width: 34%;">CLASS: <span style="font-weight: 900; color: #000;">${student.formClass}</span></td>
        </tr>
        <tr>
          <td style="padding: 2px 4px;">SPONSOR: <span style="font-weight: normal;">${student.sponsor || student.guardianName || 'Alhaji M. Abdullahi'}</span></td>
          <td style="padding: 2px 4px;">HOUSE: <span style="font-weight: normal;">${student.house || 'Dalet'}</span></td>
          <td style="padding: 2px 4px;">SESSION: <span style="font-weight: normal;">${student.session || '2020/21'}</span></td>
        </tr>
        <tr>
          <td style="padding: 2px 4px;">TERM: <span style="font-weight: normal;">${student.term || 'SECOND'}</span></td>
          <td style="padding: 2px 4px;">AGE: <span style="font-weight: normal;">${student.age || 16}</span></td>
          <td style="padding: 2px 4px;">CLASS AVERAGE AGE: <span style="font-weight: normal;">${student.classAverageAge || 15}</span></td>
        </tr>
        <tr>
          <td style="padding: 2px 4px;">TIMES SCHOOL OPENED: <span style="font-weight: normal;">${student.timesOpened || 94}</span></td>
          <td style="padding: 2px 4px;">TIMES PRESENT: <span style="font-weight: normal;">${student.timesPresent || 94}</span></td>
          <td style="padding: 2px 4px;">TIMES ABSENT: <span style="font-weight: normal;">${student.timesAbsent || 0}</span></td>
        </tr>
        <tr>
          <td style="padding: 2px 4px;">NO IN CLASS: <span style="font-weight: normal;">${student.noInClass || 68}</span></td>
          <td style="padding: 2px 4px;">POSITION IN CLASS: <span style="font-weight: 900; color: #000;">${student.positionInClass || 1}</span></td>
          <td style="padding: 2px 4px;">NO IN FORM: <span style="font-weight: normal;">${student.noInForm || 170}</span></td>
        </tr>
        <tr>
          <td style="padding: 2px 4px;">POSITION IN FORM: <span style="font-weight: 900; color: #000;">${student.positionInForm || 1}</span></td>
          <td style="padding: 2px 4px;">CREDITS & ABOVE: <span style="font-weight: 900; color: #006600;">${creditsAndAbove}</span></td>
          <td style="padding: 2px 4px;">PASSES: <span style="font-weight: normal;">${passes}</span> &bull; FAILURES: <span style="font-weight: normal;">${failures}</span></td>
        </tr>
      </table>

      <!-- SUBJECT ASSESSMENT TABLE -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 9.5px;" border="1" cellpadding="2" cellspacing="0">
        <thead>
          <tr style="background: #f0f0f0; font-weight: bold; text-align: center;">
            <th rowspan="2" style="border: 1pt solid #000; width: 22px;">S/N</th>
            <th rowspan="2" style="border: 1pt solid #000; text-align: left; padding-left: 4px;">CORE & ELECTIVE SUBJECTS</th>
            <th style="border: 1pt solid #000; width: 32px;">1st CAT</th>
            <th style="border: 1pt solid #000; width: 32px;">2nd CAT</th>
            <th style="border: 1pt solid #000; width: 32px;">3rd CAT</th>
            <th style="border: 1pt solid #000; width: 32px;">4th CAT</th>
            <th style="border: 1pt solid #000; width: 36px;">CAT Total</th>
            <th style="border: 1pt solid #000; width: 36px;">Exam Marks</th>
            <th style="border: 1pt solid #000; width: 36px;">Term Total</th>
            <th style="border: 1pt solid #000; width: 36px;">Class Avg</th>
            <th style="border: 1pt solid #000; width: 36px;">Form Avg</th>
            <th style="border: 1pt solid #000; width: 32px;">Grade</th>
            <th style="border: 1pt solid #000; width: 32px;">Pos Class</th>
            <th style="border: 1pt solid #000; width: 32px;">Pos Form</th>
            <th style="border: 1pt solid #000; width: 68px;">REMARK</th>
          </tr>
          <tr style="background: #f7f7f7; font-weight: bold; text-align: center; font-size: 8.5px;">
            <th style="border: 1pt solid #000;">10</th>
            <th style="border: 1pt solid #000;">10</th>
            <th style="border: 1pt solid #000;">10</th>
            <th style="border: 1pt solid #000;">10</th>
            <th style="border: 1pt solid #000;">40</th>
            <th style="border: 1pt solid #000;">60</th>
            <th style="border: 1pt solid #000;">100</th>
            <th style="border: 1pt solid #000;">100</th>
            <th style="border: 1pt solid #000;">100</th>
            <th style="border: 1pt solid #000;"></th>
            <th style="border: 1pt solid #000;"></th>
            <th style="border: 1pt solid #000;"></th>
            <th style="border: 1pt solid #000;"></th>
          </tr>
        </thead>
        <tbody>
          ${subjects.map((s, idx) => `
            <tr style="text-align: center; ${idx % 2 === 1 ? 'background: #fafafa;' : ''}">
              <td style="border: 1pt solid #000; font-family: monospace;">${idx + 1}</td>
              <td style="border: 1pt solid #000; text-align: left; padding-left: 4px; font-weight: bold; text-transform: uppercase;">${s.subject}</td>
              <td style="border: 1pt solid #000; font-family: monospace;">${s.cat1}</td>
              <td style="border: 1pt solid #000; font-family: monospace;">${s.cat2}</td>
              <td style="border: 1pt solid #000; font-family: monospace;">${s.cat3}</td>
              <td style="border: 1pt solid #000; font-family: monospace;">${s.cat4}</td>
              <td style="border: 1pt solid #000; font-family: monospace; font-weight: bold;">${s.catTotal}</td>
              <td style="border: 1pt solid #000; font-family: monospace; font-weight: bold;">${s.examMarks}</td>
              <td style="border: 1pt solid #000; font-family: monospace; font-weight: 900; background: #f0f7ff;">${s.termTotal}</td>
              <td style="border: 1pt solid #000; font-family: monospace;">${s.classAverage}</td>
              <td style="border: 1pt solid #000; font-family: monospace;">${s.formAverage}</td>
              <td style="border: 1pt solid #000; font-weight: 900; color: ${s.grade.startsWith('A') ? '#006600' : s.grade.startsWith('B') ? '#0044bb' : '#333'};">${s.grade}</td>
              <td style="border: 1pt solid #000; font-family: monospace;">${s.posInClass}</td>
              <td style="border: 1pt solid #000; font-family: monospace;">${s.posInForm}</td>
              <td style="border: 1pt solid #000; font-weight: bold; font-size: 8.5px; text-transform: uppercase;">${s.remark}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr style="background: #f0f0f0; font-weight: bold; font-size: 9.5px;">
            <td colspan="2" style="border: 1pt solid #000; padding: 3px 4px;">
              Total Marks: <strong style="font-size: 11px;">${totalMarks}</strong>
            </td>
            <td colspan="4" style="border: 1pt solid #000; padding: 3px 4px; text-align: center;">
              Scores Average: <strong style="font-size: 11px;">${averagePercentage}%</strong>
            </td>
            <td colspan="4" style="border: 1pt solid #000; padding: 3px 4px; text-align: center;">
              Class Highest Avg: <strong>85.00%</strong>
            </td>
            <td colspan="5" style="border: 1pt solid #000; padding: 3px 4px; text-align: center;">
              Form Highest Avg: <strong>85.00%</strong>
            </td>
          </tr>
        </tfoot>
      </table>

      <!-- CHARACTER DEVELOPMENT & BEHAVIOURAL ASSESSMENT -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;" border="0">
        <tr>
          <td style="width: 68%; vertical-align: top; padding-right: 6px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 9px;" border="1" cellpadding="2" cellspacing="0">
              <thead>
                <tr style="background: #f0f0f0; font-weight: bold; text-align: center;">
                  <th style="border: 1pt solid #000; text-align: left; padding-left: 4px;">CHARACTER DEVELOPMENT / PSYCHOMOTOR DOMAIN</th>
                  <th style="border: 1pt solid #000; width: 24px;">A</th>
                  <th style="border: 1pt solid #000; width: 24px;">B</th>
                  <th style="border: 1pt solid #000; width: 24px;">C</th>
                  <th style="border: 1pt solid #000; width: 24px;">D</th>
                </tr>
              </thead>
              <tbody>
                ${characterTraits.map(item => `
                  <tr>
                    <td style="border: 1pt solid #000; padding: 1.5px 4px; font-weight: 600;">${item.trait}</td>
                    <td style="border: 1pt solid #000; text-align: center; font-weight: bold;">${item.grade === 'A' ? 'X' : ''}</td>
                    <td style="border: 1pt solid #000; text-align: center; font-weight: bold;">${item.grade === 'B' ? 'X' : ''}</td>
                    <td style="border: 1pt solid #000; text-align: center; font-weight: bold;">${item.grade === 'C' ? 'X' : ''}</td>
                    <td style="border: 1pt solid #000; text-align: center; font-weight: bold;">${item.grade === 'D' ? 'X' : ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </td>
          <td style="width: 32%; vertical-align: top; padding-left: 6px;">
            <div style="border: 1pt solid #000; padding: 6px; font-size: 9px; background: #fafafa; height: 100%; box-sizing: border-box;">
              <strong style="display: block; font-size: 9.5px; border-bottom: 1pt solid #000; padding-bottom: 2px; margin-bottom: 4px; text-transform: uppercase;">
                KEY TO BEHAVIOURAL RATING
              </strong>
              <div style="margin: 2px 0;"><strong>A</strong> - Excellent</div>
              <div style="margin: 2px 0;"><strong>B</strong> - Good</div>
              <div style="margin: 2px 0;"><strong>C</strong> - Fair</div>
              <div style="margin: 2px 0;"><strong>D</strong> - Poor</div>
              <div style="margin-top: 8px; padding-top: 4px; border-top: 1pt dashed #888;">
                <strong>Fee Account Status:</strong> Nil (Fully Settled)
              </div>
            </div>
          </td>
        </tr>
      </table>

      <!-- REMARKS & SIGNATURES -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 10.5px; font-weight: bold;" border="0">
        <tr>
          <td style="padding: 3px 0; width: 70%;">
            FORM MASTER'S REMARK: <span style="font-weight: normal; font-style: italic;">A dedicated, hardworking, and exceptionally intelligent student.</span>
          </td>
          <td style="padding: 3px 0; width: 30%; text-align: right;">
            SIGNATURE: <span style="font-family: 'Brush Script MT', cursive; font-size: 14px; font-weight: normal;">H. Danjuma</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 3px 0;">
            PRINCIPAL'S REMARK: <span style="font-weight: normal; font-style: italic;">Outstanding performance and character. Recommended for promotion.</span>
          </td>
          <td style="padding: 3px 0; text-align: right;">
            SIGNATURE: <span style="font-family: 'Brush Script MT', cursive; font-size: 14px; font-weight: normal;">Col. M. A. Principal</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0 2px 0; border-top: 1pt solid #000; font-size: 10px;">
            NEXT TERM BEGINS ON: <strong style="text-decoration: underline;">Monday 26 July, 2021</strong>
          </td>
          <td style="padding: 6px 0 2px 0; border-top: 1pt solid #000; text-align: right; color: #004400; font-size: 9.5px;">
            [OFFICIALLY SEALED & VERIFIED]
          </td>
        </tr>
      </table>

      <!-- KEYS TO GRADES -->
      <div style="margin-top: 6px; padding-top: 4px; border-top: 1pt solid #000; font-size: 8.5px;">
        <strong style="text-transform: uppercase; margin-right: 4px;">KEYS TO GRADES:</strong>
        <span style="margin-right: 8px;">75-100: A1 EXCELLENT</span>
        <span style="margin-right: 8px;">70-74: B2 VERY GOOD</span>
        <span style="margin-right: 8px;">65-69: B3 GOOD</span>
        <span style="margin-right: 8px;">60-64: C4 CREDIT</span>
        <span style="margin-right: 8px;">55-59: C5 CREDIT</span>
        <span style="margin-right: 8px;">50-54: C6 CREDIT</span>
        <span style="margin-right: 8px;">45-49: D7 PASS</span>
        <span style="margin-right: 8px;">40-44: D8 PASS</span>
        <span>0-39: F9 FAIL</span>
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
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page Section1 {
          size: 8.5in 11.0in;
          margin: 0.35in 0.4in 0.35in 0.4in;
          mso-header-margin: 0.2in;
          mso-footer-margin: 0.2in;
        }
        div.Section1 { 
          page: Section1; 
        }
        .page-break { 
          page-break-before: always; 
          mso-break-type: section-break; 
        }
        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 11px;
          color: #000000;
          background: #ffffff;
        }
        table {
          border-collapse: collapse;
          mso-table-lspace: 0pt;
          mso-table-rspace: 0pt;
        }
        td, th {
          border-color: #000000;
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
  // Crest / NDA Logo Badge Box
  doc.setFillColor(0, 34, 68);
  doc.setDrawColor(0, 34, 68);
  doc.roundedRect(11, 9, 20, 22, 1, 1, 'FD');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('NDA', 21, 20, { align: 'center' });
  doc.setFontSize(6.5);
  doc.text('SSS', 21, 26, { align: 'center' });

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
  term: string = 'Second Term'
) => {
  if (!selectedStudents.length) return;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  selectedStudents.forEach((student, index) => {
    const marks = getStudentSubjectsData(student);
    renderStudentPdfPage(doc, student, marks, index === 0);
  });

  const fileName = `NDASSS_${className.replace(/\s+/g, '_')}_Selected_${selectedStudents.length}_Reports_${term.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
};

// Download all students in class as a continuous multi-page PDF document
export const downloadBulkCombinedPdf = (
  students: Student[],
  className: string = 'SSS 1B',
  term: string = 'Second Term'
) => {
  if (!students.length) return;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  students.forEach((student, index) => {
    const marks = getStudentSubjectsData(student);
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
  options: { includeCsv?: boolean; includeManifest?: boolean } = { includeCsv: true, includeManifest: true }
) => {
  if (!selectedStudents.length) return;
  const zip = new JSZip();
  const folderName = `NDASSS_${className.replace(/\s+/g, '_')}_Selected_${selectedStudents.length}_Reports_PDF`;
  const folder = zip.folder(folderName) || zip;

  // Add individual student PDF files
  for (const st of selectedStudents) {
    const marks = getStudentSubjectsData(st);
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
      const marks = getStudentSubjectsData(st);
      const total = marks.reduce((acc, curr) => acc + curr.termTotal, 0);
      const avg = (total / marks.length).toFixed(2);
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
  term: string = 'Second Term'
) => {
  return downloadSelectedPdfZipArchive(students, className, term, { includeCsv: true, includeManifest: true });
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
  term: string = 'Second Term'
) => {
  if (!selectedStudents.length) return;
  const bodies = selectedStudents.map((st) => {
    const marks = getStudentSubjectsData(st);
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
  term: string = 'Second Term'
) => {
  return downloadSelectedCombinedWordDoc(students, className, term);
};

// Download SELECTED students as individual Word documents inside a single ZIP archive
export const downloadSelectedZipArchive = async (
  selectedStudents: Student[],
  className: string = 'SSS 1B',
  term: string = 'Second Term',
  options: { includeCsv?: boolean; includeManifest?: boolean } = { includeCsv: true, includeManifest: true }
) => {
  if (!selectedStudents.length) return;
  const zip = new JSZip();
  const folderName = `NDASSS_${className.replace(/\s+/g, '_')}_Selected_${selectedStudents.length}_Reports_Word`;
  const folder = zip.folder(folderName) || zip;

  // Add individual student doc files
  selectedStudents.forEach((st) => {
    const marks = getStudentSubjectsData(st);
    const body = generateReportSheetHtmlBody(st, marks);
    const fileName = `Report_Sheet_${st.studentNo}_${st.lastName}_${st.firstName}.doc`;
    const docContent = createWordDocContent([body], `Terminal Report - ${st.firstName} ${st.lastName}`);
    folder.file(fileName, '\ufeff' + docContent);
  });

  // Include Selected Students CSV Summary
  if (options.includeCsv !== false) {
    const headers = ['Adm No', 'Student Name', 'Class', 'Total Marks', 'Average %', 'Position in Class', 'Status'];
    const csvRows = selectedStudents.map((st) => {
      const marks = getStudentSubjectsData(st);
      const total = marks.reduce((acc, curr) => acc + curr.termTotal, 0);
      const avg = (total / marks.length).toFixed(2);
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
  term: string = 'Second Term'
) => {
  return downloadSelectedZipArchive(students, className, term, { includeCsv: true, includeManifest: true });
};

// ============================================================================
// PRINT FUNCTIONALITY (High-Quality Print Preview with Page Breaks)
// ============================================================================

// Print single student report sheet cleanly
export const printSingleReportSheet = (student: Student, subjects?: SubjectMark[]) => {
  const markList = subjects || getStudentSubjectsData(student);
  const htmlBody = generateReportSheetHtmlBody(student, markList);

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Terminal Report - ${student.firstName} ${student.lastName}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm 8mm 8mm 8mm;
          }
          body {
            margin: 0;
            padding: 10px;
            background: #fff;
            color: #000;
            font-family: Arial, Helvetica, sans-serif;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        ${htmlBody}
        <script>
          window.onload = function() {
            window.focus();
            window.print();
            setTimeout(function() { window.close(); }, 1500);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  } else {
    window.print();
  }
};

// Print selected student report sheets in one continuous batch with clean page breaks
export const printSelectedReportSheets = (selectedStudents: Student[]) => {
  if (!selectedStudents.length) return;
  const printWindow = window.open('', '_blank');
  const studentHtmls = selectedStudents.map(st => {
    const marks = getStudentSubjectsData(st);
    return `<div style="page-break-after: always; break-after: page;">${generateReportSheetHtmlBody(st, marks)}</div>`;
  }).join('');

  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Selected Terminal Reports (${selectedStudents.length} Candidates)</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm 8mm 8mm 8mm;
          }
          body {
            margin: 0;
            padding: 10px;
            background: #fff;
            color: #000;
            font-family: Arial, Helvetica, sans-serif;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        ${studentHtmls}
        <script>
          window.onload = function() {
            window.focus();
            window.print();
            setTimeout(function() { window.close(); }, 2000);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  } else {
    window.print();
  }
};

// Print all class report sheets in one continuous batch with clean page breaks
export const printBulkReportSheets = (students: Student[]) => {
  return printSelectedReportSheets(students);
};

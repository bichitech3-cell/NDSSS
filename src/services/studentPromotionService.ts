import { Student, SubjectMark } from '../types';
import { computeSubjectGrade } from './reportSheetExportService';

/**
 * Subject definitions for each educational level and stream at NDASSS.
 * Derived from official third term curriculum rosters.
 */

export const JUNIOR_SECONDARY_SUBJECTS = [
  'Mathematics',
  'English Language',
  'Basic Science',
  'Basic Technology',
  'Civic Education',
  'Social Studies',
  'Business Studies',
  'Computer Studies',
  'Digital Technologies',
  'Computer Hardware & GSM Repairs',
  'Creative Arts',
  'Physical Health Education',
  'Home Economics',
  'C.R.K.',
  'I.R.K.',
  'Hausa',
  'French',
  'Horticulture & Crop Production',
  'Nigerian History',
  'Fashion and Garment Making',
  'Intermediate Science',
  'Social and Citizenship Studies',
];

export const SENIOR_SCIENCE_SUBJECTS = [
  'Mathematics',
  'English Language',
  'Civic Education',
  'Biology',
  'Chemistry',
  'Physics',
  'Further Mathematics',
  'Computer Studies',
  'Agric Science',
  'Technical Drawing',
  'Catering Craft Practice',
  'Horticulture and Crop Production',
  'Digital Technologies',
];

export const SENIOR_COMMERCIAL_SUBJECTS = [
  'Mathematics',
  'English Language',
  'Civic Education',
  'Economics',
  'Commerce',
  'Book Keeping & Accounts',
  'Marketing',
  'Computer Studies',
  'Digital Technologies',
  'Government',
  'Computer Hardware and GSM Repairs',
];

export const SENIOR_ARTS_SUBJECTS = [
  'Mathematics',
  'English Language',
  'Civic Education',
  'Literature in English',
  'Government',
  'History',
  'Christian Religion Studies',
  'Islamic Religion Studies',
  'Hausa',
  'French',
  'Dying and Bleaching',
  'Fashion and Garment Making',
  'Computer Studies',
];

/**
 * Returns the exact list of subjects matching a student's class and arm.
 */
export function getSubjectsForClass(formClass: string, arm?: string): string[] {
  const normClass = formClass.toUpperCase().replace(/\s+/g, '');

  // Junior classes: JSS 1, JSS 2, JSS 3
  if (normClass.startsWith('JSS') || normClass.startsWith('FORM1') || normClass.startsWith('FORM2') || normClass.startsWith('FORM3')) {
    return [...JUNIOR_SECONDARY_SUBJECTS];
  }

  // Senior classes: SSS 1, SSS 2, SSS 3
  const effectiveArm = (arm || '').toUpperCase();
  const classArmLetter = normClass.slice(-1);

  // Arm A & B are Science Stream
  if (effectiveArm.includes('SCIENCE') || classArmLetter === 'A' || classArmLetter === 'B') {
    return [...SENIOR_SCIENCE_SUBJECTS];
  }

  // Arm C is Commercial / Business Stream
  if (effectiveArm.includes('COMMERCE') || effectiveArm.includes('BUSINESS') || classArmLetter === 'C') {
    return [...SENIOR_COMMERCIAL_SUBJECTS];
  }

  // Arm D & E are Arts & Humanities Stream
  if (effectiveArm.includes('ART') || effectiveArm.includes('HUMANIT') || classArmLetter === 'D' || classArmLetter === 'E') {
    return [...SENIOR_ARTS_SUBJECTS];
  }

  // Fallback to Senior Science
  return [...SENIOR_SCIENCE_SUBJECTS];
}

/**
 * Generates SubjectMark items for a student with appropriate scores and grades.
 */
export function generateSubjectMarksForStudent(student: Student): SubjectMark[] {
  const subjectNames = getSubjectsForClass(student.formClass, student.arm);
  const posOffset = (student.positionInClass || 2) - 1;

  return subjectNames.map((subject, index) => {
    // Deterministic realistic scores based on student position and subject index
    const baseScore = 78 - Math.min(25, posOffset * 3) + ((index * 7) % 15);
    const cat1 = Math.min(10, Math.max(5, Math.round(baseScore * 0.1)));
    const cat2 = Math.min(10, Math.max(5, Math.round(baseScore * 0.1 + ((index % 2) ? 1 : 0))));
    const cat3 = Math.min(10, Math.max(5, Math.round(baseScore * 0.1 - ((index % 3) ? 1 : 0))));
    const cat4 = Math.min(10, Math.max(4, Math.round(baseScore * 0.1)));
    const catTotal = cat1 + cat2 + cat3 + cat4;
    const examMarks = Math.min(60, Math.max(20, Math.round(baseScore * 0.6)));
    const termTotal = catTotal + examMarks;
    const { grade, remark } = computeSubjectGrade(termTotal);

    return {
      sNo: index + 1,
      subject,
      cat1,
      cat2,
      cat3,
      cat4,
      catTotal,
      examMarks,
      termTotal,
      classAverage: 58,
      formAverage: 52,
      grade,
      posInClass: Math.min(student.noInClass || 65, (student.positionInClass || 1) + (index % 2)),
      posInForm: Math.min(student.noInForm || 170, (student.positionInForm || 1) + (index % 3)),
      remark,
    };
  });
}

/**
 * Formats a student's admission number according to the required specification:
 * NDASSS/<PROMOTED_CLASS_AND_ARM>/<3_DIGIT_SERIAL>
 * Example: NDASSS/JSS2A/001
 */
export function formatAdmissionNo(classCode: string, armLetter: string, serialNum: number): string {
  const cleanClass = classCode.toUpperCase().replace(/\s+/g, '');
  const cleanArm = armLetter.toUpperCase().trim();
  const serialPadded = String(serialNum).padStart(3, '0');
  return `NDASSS/${cleanClass}${cleanArm}/${serialPadded}`;
}

/**
 * Determines the next promoted class based on the school's progression policy:
 * - JSS 1 -> JSS 2
 * - JSS 2 -> JSS 3
 * - JSS 3 -> SSS 1
 * - SSS 1 -> SSS 2
 * - SSS 2 -> SSS 3
 */
export function getPromotedClass(currentClass: string): {
  promotedClass: string;
  targetClassCode: string; // e.g. "JSS2", "SSS1"
  canPromote: boolean;
  stageName: string;
} {
  const norm = currentClass.toUpperCase().trim();

  if (norm.includes('JSS 1') || norm.includes('JSS1') || norm.includes('FORM 1')) {
    return { promotedClass: 'JSS 2', targetClassCode: 'JSS2', canPromote: true, stageName: 'Junior Secondary 2' };
  }
  if (norm.includes('JSS 2') || norm.includes('JSS2') || norm.includes('FORM 2')) {
    return { promotedClass: 'JSS 3', targetClassCode: 'JSS3', canPromote: true, stageName: 'Junior Secondary 3' };
  }
  if (norm.includes('JSS 3') || norm.includes('JSS3') || norm.includes('FORM 3')) {
    return { promotedClass: 'SSS 1', targetClassCode: 'SSS1', canPromote: true, stageName: 'Senior Secondary 1' };
  }
  if (norm.includes('SSS 1') || norm.includes('SSS1') || norm.includes('FORM 4')) {
    return { promotedClass: 'SSS 2', targetClassCode: 'SSS2', canPromote: true, stageName: 'Senior Secondary 2' };
  }
  if (norm.includes('SSS 2') || norm.includes('SSS2')) {
    return { promotedClass: 'SSS 3', targetClassCode: 'SSS3', canPromote: true, stageName: 'Senior Secondary 3 (Final Year)' };
  }

  return { promotedClass: currentClass, targetClassCode: norm, canPromote: false, stageName: currentClass };
}

/**
 * Extracts the arm letter (A, B, C, D, E) from a class string or arm property.
 */
export function extractArmLetter(formClass: string, arm?: string): string {
  const norm = formClass.toUpperCase();
  // Check for trailing letter like "JSS 1A", "SSS1 B", "JSS2 C"
  const match = norm.match(/([A-E])\b/);
  if (match) return match[1];

  if (arm) {
    const armNorm = arm.toUpperCase();
    if (armNorm.includes('A') || armNorm.includes('SCIENCE A')) return 'A';
    if (armNorm.includes('B') || armNorm.includes('SCIENCE B')) return 'B';
    if (armNorm.includes('C') || armNorm.includes('COMMERCE')) return 'C';
    if (armNorm.includes('D') || armNorm.includes('ART')) return 'D';
    if (armNorm.includes('E') || armNorm.includes('HUMANIT')) return 'E';
  }

  return 'A'; // Default to Arm A
}

export interface PromotionResult {
  student: Student;
  oldClass: string;
  newClass: string;
  oldAdmissionNo: string;
  newAdmissionNo: string;
  joinedSubjectsCount: number;
  subjects: string[];
}

/**
 * Executes promotion for a list of students, pushing each student forward in their cohort
 * and formatting their admission number as NDASSS/<CLASS_ARM>/<SERIAL>.
 */
export function promoteStudentCohort(
  students: Student[],
  options: {
    targetClasses?: string[]; // If specified, only promote students currently in these classes
    newSession?: string;
    newTerm?: string;
  } = {}
): {
  promotedStudents: Student[];
  results: PromotionResult[];
  summary: {
    total: number;
    promoted: number;
    unchanged: number;
    classesSummary: Record<string, number>;
  };
} {
  const { newSession = '2026/2027', newTerm = 'First Term' } = options;

  // Track serial counter per new class & arm (e.g. "JSS2A" -> counter)
  const serialCounters: Record<string, number> = {};

  const results: PromotionResult[] = [];
  const promotedStudents: Student[] = [];
  const classesSummary: Record<string, number> = {};

  let promotedCount = 0;
  let unchangedCount = 0;

  students.forEach((student) => {
    const promotionInfo = getPromotedClass(student.formClass);

    // If options.targetClasses is provided, filter
    const shouldPromote = promotionInfo.canPromote && (!options.targetClasses || options.targetClasses.includes(student.formClass));

    if (!shouldPromote) {
      unchangedCount++;
      promotedStudents.push(student);
      return;
    }

    const armLetter = extractArmLetter(student.formClass, student.arm);
    const newClassArmKey = `${promotionInfo.targetClassCode}${armLetter}`;
    serialCounters[newClassArmKey] = (serialCounters[newClassArmKey] || 0) + 1;
    const serialNum = serialCounters[newClassArmKey];

    const newAdmissionNo = formatAdmissionNo(promotionInfo.targetClassCode, armLetter, serialNum);
    const newFormClass = `${promotionInfo.promotedClass} ${armLetter}`;

    // Infer track arm description
    let newArmDesc = student.arm || 'General';
    if (promotionInfo.targetClassCode.startsWith('SSS')) {
      if (['A', 'B'].includes(armLetter)) newArmDesc = 'Science';
      else if (armLetter === 'C') newArmDesc = 'Commerce';
      else newArmDesc = 'Humanities';
    }

    const joinedSubjects = getSubjectsForClass(newFormClass, newArmDesc);

    const promotedStudent: Student = {
      ...student,
      id: `stu-promoted-${newAdmissionNo.replace(/\//g, '-')}-${Date.now().toString(36)}`,
      studentNo: newAdmissionNo,
      formClass: newFormClass,
      arm: newArmDesc,
      stream: `${newArmDesc} Stream ${armLetter}`,
      session: newSession,
      term: newTerm,
      age: student.age ? student.age + 1 : 16,
    };

    promotedCount++;
    classesSummary[newFormClass] = (classesSummary[newFormClass] || 0) + 1;

    results.push({
      student: promotedStudent,
      oldClass: student.formClass,
      newClass: newFormClass,
      oldAdmissionNo: student.studentNo,
      newAdmissionNo,
      joinedSubjectsCount: joinedSubjects.length,
      subjects: joinedSubjects,
    });

    promotedStudents.push(promotedStudent);
  });

  return {
    promotedStudents,
    results,
    summary: {
      total: students.length,
      promoted: promotedCount,
      unchanged: unchangedCount,
      classesSummary,
    },
  };
}

/**
 * Pre-builds an authentic sample cohort representing the promoted classes at NDASSS
 * with the exact required admission number formats and matched subjects!
 */
export function generateComprehensivePromotedRoster(): Student[] {
  const classesToGenerate = [
    // Entry Cohort JSS 1
    { formClass: 'JSS 1A', arm: 'General', count: 6 },
    { formClass: 'JSS 1B', arm: 'General', count: 6 },
    { formClass: 'JSS 1C', arm: 'General', count: 5 },
    { formClass: 'JSS 1D', arm: 'General', count: 5 },
    { formClass: 'JSS 1E', arm: 'General', count: 5 },

    // Promoted from JSS 1 -> JSS 2
    { formClass: 'JSS 2A', arm: 'General', count: 6 },
    { formClass: 'JSS 2B', arm: 'General', count: 6 },
    { formClass: 'JSS 2C', arm: 'General', count: 5 },
    { formClass: 'JSS 2D', arm: 'General', count: 5 },
    { formClass: 'JSS 2E', arm: 'General', count: 5 },

    // Promoted from JSS 2 -> JSS 3
    { formClass: 'JSS 3A', arm: 'General', count: 6 },
    { formClass: 'JSS 3B', arm: 'General', count: 6 },
    { formClass: 'JSS 3C', arm: 'General', count: 5 },
    { formClass: 'JSS 3D', arm: 'General', count: 5 },
    { formClass: 'JSS 3E', arm: 'General', count: 5 },

    // Promoted from JSS 3 -> SSS 1
    { formClass: 'SSS 1A', arm: 'Science', count: 6 },
    { formClass: 'SSS 1B', arm: 'Science', count: 6 },
    { formClass: 'SSS 1C', arm: 'Commerce', count: 5 },
    { formClass: 'SSS 1D', arm: 'Humanities', count: 5 },
    { formClass: 'SSS 1E', arm: 'Humanities', count: 5 },

    // Promoted from SSS 1 -> SSS 2
    { formClass: 'SSS 2A', arm: 'Science', count: 6 },
    { formClass: 'SSS 2B', arm: 'Science', count: 6 },
    { formClass: 'SSS 2C', arm: 'Commerce', count: 5 },
    { formClass: 'SSS 2D', arm: 'Humanities', count: 5 },
    { formClass: 'SSS 2E', arm: 'Humanities', count: 5 },

    // Promoted from SSS 2 -> SSS 3
    { formClass: 'SSS 3A', arm: 'Science', count: 6 },
    { formClass: 'SSS 3B', arm: 'Science', count: 6 },
    { formClass: 'SSS 3C', arm: 'Commerce', count: 5 },
    { formClass: 'SSS 3D', arm: 'Humanities', count: 5 },
    { formClass: 'SSS 3E', arm: 'Humanities', count: 5 },
  ];

  const firstNames = [
    'Fatima', 'Ibrahim', 'Zainab', 'Chukwuma', 'Emmanuel', 'Amina', 'Musa', 'Bilikisu',
    'Yusuf', 'Halima', 'Usman', 'Chidiebere', 'Khadijah', 'Aliyu', 'Grace', 'David',
    'Maryam', 'Yakubu', 'Oluwaseun', 'Aisha', 'Mohammed', 'Blessing', 'Suleiman', 'Daniel',
    'Hassana', 'Ahmad', 'Victor', 'Ngozi', 'Kabir', 'Ruth', 'Bello', 'John'
  ];

  const lastNames = [
    'Abdullahi', 'Mohammed', 'Bello', 'Obi', 'Adebayo', 'Sani', 'Danjuma', 'Okafor',
    'Garba', 'Aliyu', 'Musa', 'Lawal', 'Eze', 'Balogun', 'Yakubu', 'Dikko',
    'Abubakar', 'Audu', 'Chukwu', 'Olatunji', 'Shehu', 'Gwandu', 'Katsina', 'Zaria'
  ];

  let studentIdx = 0;
  const roster: Student[] = [];

  classesToGenerate.forEach((cls) => {
    const classCode = cls.formClass.replace(/\s+/g, ''); // e.g. "JSS2A"
    const armLetter = cls.formClass.slice(-1); // "A", "B", etc.
    const baseCode = classCode.slice(0, -1); // "JSS2"

    for (let i = 1; i <= cls.count; i++) {
      const fn = firstNames[studentIdx % firstNames.length];
      const ln = lastNames[(studentIdx + 3) % lastNames.length];
      studentIdx++;

      const admissionNo = `NDASSS/${baseCode}${armLetter}/${String(i).padStart(3, '0')}`;
      const isFemale = studentIdx % 2 === 0;

      roster.push({
        id: `stu-${baseCode.toLowerCase()}-${armLetter.toLowerCase()}-${String(i).padStart(3, '0')}`,
        studentNo: admissionNo,
        schoolCode: 'NDASSS',
        firstName: fn,
        lastName: ln,
        gender: isFemale ? 'Female' : 'Male',
        formClass: cls.formClass,
        arm: armLetter,
        stream: `${cls.arm} Stream ${armLetter}`,
        house: ['Dalet', 'Bet', 'Gimel', 'Aleph'][i % 4],
        session: '2026/2027',
        term: 'Second Term',
        age: baseCode.startsWith('JSS2') ? 12 : baseCode.startsWith('JSS3') ? 13 : baseCode.startsWith('SSS1') ? 14 : baseCode.startsWith('SSS2') ? 15 : 16,
        classAverageAge: 14,
        timesOpened: 94,
        timesPresent: 90 + (i % 5),
        timesAbsent: Math.max(0, 4 - (i % 5)),
        noInClass: 45,
        positionInClass: i,
        noInForm: 170,
        positionInForm: i * 3,
        creditsAbove: 10,
        passes: 1,
        failures: 0,
        sponsor: `Alhaji ${ln}`,
        guardianName: `Mallam ${fn[0]}. ${ln}`,
        guardianPhone: `+234 80${(3 + (i % 7))} ${Math.floor(100 + Math.random() * 899)} ${Math.floor(1000 + Math.random() * 8999)}`,
        guardianEmail: `${fn.toLowerCase()}.${ln.toLowerCase()}@parents.nda.edu.ng`,
        status: 'Active',
        feeBalance: (i % 3 === 0) ? 25000 : 0,
        totalFees: 380000,
        attendanceRate: 97.5,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fn + ' ' + ln)}&backgroundColor=0f172a,1e293b,334155`,
        securityQuestion1: 'What primary school did you attend?',
        securityAnswer1: 'Command Children School Kaduna',
        securityQuestion2: "What is your mother's maiden name?",
        securityAnswer2: 'Bello',
        pin: `${1000 + (studentIdx % 9000)}`,
      });
    }
  });

  return roster;
}

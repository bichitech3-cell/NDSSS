import { Student } from '../types';

export interface ClassArmOption {
  key: string;            // e.g. "2A", "2B", "2C", "2D"
  displayName: string;    // e.g. "JSS 2A (2A)"
  level: string;          // e.g. "JSS 2"
  arm: string;            // e.g. "A"
  group: 'Junior Secondary' | 'Senior Secondary';
}

export const CLASS_LEVELS = [
  'All',
  'JSS 1',
  'JSS 2',
  'JSS 3',
  'SSS 1',
  'SSS 2',
  'SSS 3'
] as const;

export const ARM_OPTIONS = [
  'All',
  'A',
  'B',
  'C',
  'D',
  'E'
] as const;

export const POPULAR_CLASS_ARMS: ClassArmOption[] = [
  // JSS 1
  { key: '1A', displayName: 'JSS 1A (1A)', level: 'JSS 1', arm: 'A', group: 'Junior Secondary' },
  { key: '1B', displayName: 'JSS 1B (1B)', level: 'JSS 1', arm: 'B', group: 'Junior Secondary' },
  { key: '1C', displayName: 'JSS 1C (1C)', level: 'JSS 1', arm: 'C', group: 'Junior Secondary' },
  { key: '1D', displayName: 'JSS 1D (1D)', level: 'JSS 1', arm: 'D', group: 'Junior Secondary' },

  // JSS 2 - Specifically highlighted for "2A differently 2B differently"
  { key: '2A', displayName: 'JSS 2A (2A)', level: 'JSS 2', arm: 'A', group: 'Junior Secondary' },
  { key: '2B', displayName: 'JSS 2B (2B)', level: 'JSS 2', arm: 'B', group: 'Junior Secondary' },
  { key: '2C', displayName: 'JSS 2C (2C)', level: 'JSS 2', arm: 'C', group: 'Junior Secondary' },
  { key: '2D', displayName: 'JSS 2D (2D)', level: 'JSS 2', arm: 'D', group: 'Junior Secondary' },

  // JSS 3
  { key: '3A', displayName: 'JSS 3A (3A)', level: 'JSS 3', arm: 'A', group: 'Junior Secondary' },
  { key: '3B', displayName: 'JSS 3B (3B)', level: 'JSS 3', arm: 'B', group: 'Junior Secondary' },
  { key: '3C', displayName: 'JSS 3C (3C)', level: 'JSS 3', arm: 'C', group: 'Junior Secondary' },
  { key: '3D', displayName: 'JSS 3D (3D)', level: 'JSS 3', arm: 'D', group: 'Junior Secondary' },

  // SSS 1
  { key: 'SSS 1A', displayName: 'SSS 1A', level: 'SSS 1', arm: 'A', group: 'Senior Secondary' },
  { key: 'SSS 1B', displayName: 'SSS 1B', level: 'SSS 1', arm: 'B', group: 'Senior Secondary' },
  { key: 'SSS 1C', displayName: 'SSS 1C', level: 'SSS 1', arm: 'C', group: 'Senior Secondary' },
  { key: 'SSS 1D', displayName: 'SSS 1D', level: 'SSS 1', arm: 'D', group: 'Senior Secondary' },

  // SSS 2
  { key: 'SSS 2A', displayName: 'SSS 2A', level: 'SSS 2', arm: 'A', group: 'Senior Secondary' },
  { key: 'SSS 2B', displayName: 'SSS 2B', level: 'SSS 2', arm: 'B', group: 'Senior Secondary' },
  { key: 'SSS 2C', displayName: 'SSS 2C', level: 'SSS 2', arm: 'C', group: 'Senior Secondary' },
  { key: 'SSS 2D', displayName: 'SSS 2D', level: 'SSS 2', arm: 'D', group: 'Senior Secondary' },

  // SSS 3
  { key: 'SSS 3A', displayName: 'SSS 3A', level: 'SSS 3', arm: 'A', group: 'Senior Secondary' },
  { key: 'SSS 3B', displayName: 'SSS 3B', level: 'SSS 3', arm: 'B', group: 'Senior Secondary' },
  { key: 'SSS 3C', displayName: 'SSS 3C', level: 'SSS 3', arm: 'C', group: 'Senior Secondary' },
  { key: 'SSS 3D', displayName: 'SSS 3D', level: 'SSS 3', arm: 'D', group: 'Senior Secondary' },
];

/**
 * Extracts normalized Class Level (e.g. "JSS 2", "SSS 1") from student record
 */
export function extractClassLevel(formClass?: string): string {
  if (!formClass) return 'JSS 1';
  const clean = formClass.trim().toUpperCase();

  if (clean.includes('JSS 1') || clean.includes('JSS1') || clean.includes('FORM 1') || clean.startsWith('1')) return 'JSS 1';
  if (clean.includes('JSS 2') || clean.includes('JSS2') || clean.includes('FORM 2') || clean.startsWith('2')) return 'JSS 2';
  if (clean.includes('JSS 3') || clean.includes('JSS3') || clean.includes('FORM 3') || clean.startsWith('3')) return 'JSS 3';

  if (clean.includes('SSS 1') || clean.includes('SSS1')) return 'SSS 1';
  if (clean.includes('SSS 2') || clean.includes('SSS2')) return 'SSS 2';
  if (clean.includes('SSS 3') || clean.includes('SSS3')) return 'SSS 3';

  return formClass;
}

/**
 * Extracts normalized Arm letter (A, B, C, D, E) from student record
 */
export function extractArmLetter(student: Student): string {
  // Check direct arm field first
  if (student.arm) {
    const armClean = student.arm.trim().toUpperCase();
    if (['A', 'B', 'C', 'D', 'E'].includes(armClean)) return armClean;
    if (armClean.startsWith('ARM ')) return armClean.replace('ARM ', '').trim();
  }

  // Check formClass (e.g. "JSS 2A", "SSS1 B", "2A")
  const formClean = (student.formClass || '').trim().toUpperCase();
  const lastChar = formClean.slice(-1);
  if (['A', 'B', 'C', 'D', 'E'].includes(lastChar)) return lastChar;

  // Check stream (e.g. "Science Stream B")
  const streamClean = (student.stream || '').trim().toUpperCase();
  const streamLast = streamClean.slice(-1);
  if (['A', 'B', 'C', 'D', 'E'].includes(streamLast)) return streamLast;

  // Check admission number (e.g. "NDASSS/JSS2A/001")
  const admClean = (student.studentNo || '').trim().toUpperCase();
  const match = admClean.match(/(?:JSS|SSS)[1-3]([A-E])/);
  if (match && match[1]) return match[1];

  return 'A'; // Default fallback
}

/**
 * Normalizes combined Class & Arm label for quick selection (e.g. "2A", "2B", "SSS 1A")
 */
export function getStudentClassArmTag(student: Student): string {
  const level = extractClassLevel(student.formClass);
  const arm = extractArmLetter(student);

  if (level === 'JSS 1') return `1${arm}`;
  if (level === 'JSS 2') return `2${arm}`;
  if (level === 'JSS 3') return `3${arm}`;
  return `${level}${arm}`; // e.g. "SSS 1A", "SSS 2B"
}

/**
 * Checks whether a student matches the selected class and arm criteria
 */
export function matchesClassAndArmFilter(
  student: Student,
  classFilter: string, // "All", "2A", "2B", "2C", "2D", "JSS 2", "SSS 1", etc.
  armFilter: string = 'All' // "All", "A", "B", "C", "D", "E"
): boolean {
  const studentLevel = extractClassLevel(student.formClass);
  const studentArm = extractArmLetter(student);
  const studentTag = getStudentClassArmTag(student); // e.g. "2A", "2B"

  // Check specific class-arm tag filters (e.g. "2A", "2B", "2C", "2D", "1A", "3B", "SSS 1A")
  const cleanClassFilter = classFilter.trim().toUpperCase();

  // If specific combined selector is active (e.g. "2A", "2B", "2C", "2D")
  if (cleanClassFilter === '2A' || cleanClassFilter === 'JSS 2A') {
    return studentLevel === 'JSS 2' && studentArm === 'A';
  }
  if (cleanClassFilter === '2B' || cleanClassFilter === 'JSS 2B') {
    return studentLevel === 'JSS 2' && studentArm === 'B';
  }
  if (cleanClassFilter === '2C' || cleanClassFilter === 'JSS 2C') {
    return studentLevel === 'JSS 2' && studentArm === 'C';
  }
  if (cleanClassFilter === '2D' || cleanClassFilter === 'JSS 2D') {
    return studentLevel === 'JSS 2' && studentArm === 'D';
  }

  // JSS 1 streams
  if (cleanClassFilter === '1A' || cleanClassFilter === 'JSS 1A') return studentLevel === 'JSS 1' && studentArm === 'A';
  if (cleanClassFilter === '1B' || cleanClassFilter === 'JSS 1B') return studentLevel === 'JSS 1' && studentArm === 'B';
  if (cleanClassFilter === '1C' || cleanClassFilter === 'JSS 1C') return studentLevel === 'JSS 1' && studentArm === 'C';
  if (cleanClassFilter === '1D' || cleanClassFilter === 'JSS 1D') return studentLevel === 'JSS 1' && studentArm === 'D';

  // JSS 3 streams
  if (cleanClassFilter === '3A' || cleanClassFilter === 'JSS 3A') return studentLevel === 'JSS 3' && studentArm === 'A';
  if (cleanClassFilter === '3B' || cleanClassFilter === 'JSS 3B') return studentLevel === 'JSS 3' && studentArm === 'B';
  if (cleanClassFilter === '3C' || cleanClassFilter === 'JSS 3C') return studentLevel === 'JSS 3' && studentArm === 'C';
  if (cleanClassFilter === '3D' || cleanClassFilter === 'JSS 3D') return studentLevel === 'JSS 3' && studentArm === 'D';

  // Senior secondary streams
  if (cleanClassFilter.startsWith('SSS 1') && ['A', 'B', 'C', 'D'].includes(cleanClassFilter.slice(-1))) {
    return studentLevel === 'SSS 1' && studentArm === cleanClassFilter.slice(-1);
  }
  if (cleanClassFilter.startsWith('SSS 2') && ['A', 'B', 'C', 'D'].includes(cleanClassFilter.slice(-1))) {
    return studentLevel === 'SSS 2' && studentArm === cleanClassFilter.slice(-1);
  }
  if (cleanClassFilter.startsWith('SSS 3') && ['A', 'B', 'C', 'D'].includes(cleanClassFilter.slice(-1))) {
    return studentLevel === 'SSS 3' && studentArm === cleanClassFilter.slice(-1);
  }

  // Level matching if not a specific stream key
  let levelMatches = true;
  if (classFilter !== 'All' && classFilter !== '') {
    levelMatches =
      studentLevel.toUpperCase() === cleanClassFilter ||
      student.formClass.toUpperCase().includes(cleanClassFilter) ||
      cleanClassFilter.includes(studentLevel.toUpperCase());
  }

  // Arm matching
  let armMatches = true;
  const cleanArmFilter = armFilter.replace('Arm ', '').trim().toUpperCase();
  if (cleanArmFilter !== 'ALL' && cleanArmFilter !== '') {
    armMatches = studentArm === cleanArmFilter;
  }

  return levelMatches && armMatches;
}

// Mock Financial Data for Bursary (School Accounts) and PTA Financial Secretary

export interface SchoolFeeItem {
  id: string;
  name: string;
  code: string;
  amount: number;
  category: 'Tuition' | 'Science Laboratory' | 'ICT & Digital Literacy' | 'Library & Learning' | 'Medical/Infirmary' | 'Boarding';
  term: 'First Term' | 'Second Term' | 'Third Term' | 'Annual';
  applicableClass: 'All SSS' | 'SSS 1' | 'SSS 2' | 'SSS 3' | 'All JSS' | 'All Classes';
  compulsory: boolean;
}

export interface BursaryPayment {
  id: string;
  receiptNumber: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  class: string;
  arm: string;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: 'Bank Transfer (CBN NIBSS)' | 'POS Terminal' | 'Direct Teller (National Bank)' | 'Remita RRR';
  bankReference: string;
  feeItem: string;
  term: string;
  session: string;
  receivedBy: string; // Bursar or cashier
  status: 'VERIFIED' | 'PENDING' | 'RECONCILED';
}

export interface PtaLevy {
  id: string;
  title: string;
  code: string;
  amount: number;
  purpose: 'Solar Inverter Power Project' | 'PTA Teacher Stipend Support' | 'Science Equipment Enhancement' | 'Security Perimeter Fence' | 'Annual General Meeting (AGM) Fund';
  term: string;
  session: string;
  dueDate: string;
  targetAmount: number;
  collectedAmount: number;
  status: 'ACTIVE' | 'CLOSED' | 'PROPOSED';
}

export interface PtaPaymentRecord {
  id: string;
  ptaReceiptNo: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  parentName: string;
  parentPhone: string;
  class: string;
  levyTitle: string;
  amountPaid: number;
  paymentDate: string;
  channel: 'Bank Transfer (PTA Dedicated Account)' | 'Direct Cash to Fin Sec' | 'POS Receipt';
  bankRef: string;
  ptaAccount: 'First Bank of Nigeria (PTA Acct: 2038471920)';
  receivedBy: string; // PTA Financial Secretary
  reconciliationStatus: 'RECONCILED' | 'PENDING_AUDIT';
}

export interface PtaExpense {
  id: string;
  voucherNo: string;
  title: string;
  category: 'Infrastructure & Projects' | 'Teacher Subsidy' | 'Sports & Student Welfare' | 'AGM Logistics';
  amount: number;
  date: string;
  beneficiary: string;
  approvedBy: string; // PTA Chairman & PTA Fin Sec
  status: 'APPROVED' | 'DISBURSED' | 'PENDING_CHAIRMAN_SIGNATURE';
}

export const INITIAL_SCHOOL_FEES: SchoolFeeItem[] = [
  { id: 'FEE-01', name: 'Standard Senior Tuition Fee', code: 'TUI-SSS', amount: 150000, category: 'Tuition', term: 'Second Term', applicableClass: 'All SSS', compulsory: true },
  { id: 'FEE-02', name: 'Science Laboratory Consumables & Reagents', code: 'SCI-LAB', amount: 45000, category: 'Science Laboratory', term: 'Second Term', applicableClass: 'SSS 1', compulsory: true },
  { id: 'FEE-03', name: 'ICT / Computer CBT Examination Facility', code: 'ICT-CBT', amount: 25000, category: 'ICT & Digital Literacy', term: 'Second Term', applicableClass: 'All Classes', compulsory: true },
  { id: 'FEE-04', name: 'Library & e-Learning Digital Access', code: 'LIB-DIG', amount: 15000, category: 'Library & Learning', term: 'Second Term', applicableClass: 'All Classes', compulsory: true },
  { id: 'FEE-05', name: 'Medical Clinic & First Aid Capitation', code: 'MED-CAP', amount: 12000, category: 'Medical/Infirmary', term: 'Second Term', applicableClass: 'All Classes', compulsory: true }
];

export const INITIAL_BURSARY_PAYMENTS: BursaryPayment[] = [
  {
    id: 'BURS-REC-001',
    receiptNumber: 'NDA-BURS-2026-0481',
    studentId: 'stu-fatima',
    studentName: 'Fatima Abdullahi',
    admissionNo: '2413',
    class: 'SSS1 B',
    arm: 'Science',
    amountPaid: 190000,
    paymentDate: '2026-10-02 11:20:00',
    paymentMethod: 'Bank Transfer (CBN NIBSS)',
    bankReference: 'NIP/20261002/0948218471',
    feeItem: 'Tuition + Science Laboratory + ICT',
    term: 'Second Term',
    session: '2020/21',
    receivedBy: 'Hajiya Maryam B. Al-Hassan (Bursar)',
    status: 'VERIFIED'
  },
  {
    id: 'BURS-REC-002',
    receiptNumber: 'NDA-BURS-2026-0482',
    studentId: 'stu-fatima',
    studentName: 'Fatima Abdullahi',
    admissionNo: '2413',
    class: 'SSS1 B',
    arm: 'Science',
    amountPaid: 57000,
    paymentDate: '2026-10-05 14:15:00',
    paymentMethod: 'Direct Teller (National Bank)',
    bankReference: 'TEL-KAD-8842109',
    feeItem: 'Library + Medical Capitation',
    term: 'Second Term',
    session: '2020/21',
    receivedBy: 'Hajiya Maryam B. Al-Hassan (Bursar)',
    status: 'VERIFIED'
  },
  {
    id: 'BURS-REC-003',
    receiptNumber: 'NDA-BURS-2026-0483',
    studentId: 'stu-ibrahim',
    studentName: 'Ibrahim Mohammed',
    admissionNo: '2418',
    class: 'SSS1 B',
    arm: 'Science',
    amountPaid: 340000,
    paymentDate: '2026-09-28 09:30:00',
    paymentMethod: 'Remita RRR',
    bankReference: 'RRR-2490-1120-4921',
    feeItem: 'Full Term Tuition + All Science Practical Fees',
    term: 'Second Term',
    session: '2020/21',
    receivedBy: 'Hajiya Maryam B. Al-Hassan (Bursar)',
    status: 'VERIFIED'
  },
  {
    id: 'BURS-REC-004',
    receiptNumber: 'NDA-BURS-2026-0484',
    studentId: 'stu-zainab',
    studentName: 'Zainab Bello',
    admissionNo: '2422',
    class: 'SSS1 B',
    arm: 'Science',
    amountPaid: 380000,
    paymentDate: '2026-09-29 10:11:00',
    paymentMethod: 'Bank Transfer (CBN NIBSS)',
    bankReference: 'NIP/20260929/7740192',
    feeItem: 'Full Comprehensive Term Clearance',
    term: 'Second Term',
    session: '2020/21',
    receivedBy: 'Hajiya Maryam B. Al-Hassan (Bursar)',
    status: 'VERIFIED'
  },
  {
    id: 'BURS-REC-005',
    receiptNumber: 'NDA-BURS-2026-0485',
    studentId: 'stu-chukwuma',
    studentName: 'Chukwuma Obi',
    admissionNo: '2430',
    class: 'SSS1 B',
    arm: 'Science',
    amountPaid: 295000,
    paymentDate: '2026-10-01 16:45:00',
    paymentMethod: 'POS Terminal',
    bankReference: 'POS-TERM-0982-STANBIC',
    feeItem: 'Part Payment (Balance: ₦85,000)',
    term: 'Second Term',
    session: '2020/21',
    receivedBy: 'Hajiya Maryam B. Al-Hassan (Bursar)',
    status: 'VERIFIED'
  }
];

export const INITIAL_PTA_LEVIES: PtaLevy[] = [
  {
    id: 'PTA-LEV-01',
    title: 'School Solar Power Inverter & Battery Bank Project',
    code: 'PTA-SOLAR-2026',
    amount: 25000,
    purpose: 'Solar Inverter Power Project',
    term: 'Second Term',
    session: '2020/21',
    dueDate: '2026-11-15',
    targetAmount: 35500000,
    collectedAmount: 28450000,
    status: 'ACTIVE'
  },
  {
    id: 'PTA-LEV-02',
    title: 'PTA-Employed Specialist Subject Teachers Monthly Support',
    code: 'PTA-TEACH-STIP',
    amount: 10000,
    purpose: 'PTA Teacher Stipend Support',
    term: 'Second Term',
    session: '2020/21',
    dueDate: '2026-10-31',
    targetAmount: 14200000,
    collectedAmount: 13800000,
    status: 'ACTIVE'
  },
  {
    id: 'PTA-LEV-03',
    title: 'Perimeter Security Sensor Lighting & Guard Post Modernization',
    code: 'PTA-SEC-FENCE',
    amount: 15000,
    purpose: 'Security Perimeter Fence',
    term: 'First Term',
    session: '2020/21',
    dueDate: '2026-09-30',
    targetAmount: 21300000,
    collectedAmount: 21100000,
    status: 'CLOSED'
  }
];

export const INITIAL_PTA_PAYMENTS: PtaPaymentRecord[] = [
  {
    id: 'PTA-PAY-001',
    ptaReceiptNo: 'PTA-REC-2026-0101',
    studentId: 'stu-fatima',
    studentName: 'Fatima Abdullahi',
    admissionNo: '2413',
    parentName: 'Alhaji M. Abdullahi',
    parentPhone: '+234 803 123 4567',
    class: 'SSS1 B',
    levyTitle: 'School Solar Power Inverter & Battery Bank Project',
    amountPaid: 25000,
    paymentDate: '2026-10-03 10:15:00',
    channel: 'Bank Transfer (PTA Dedicated Account)',
    bankRef: 'FBN-PTA-TX-9901827',
    ptaAccount: 'First Bank of Nigeria (PTA Acct: 2038471920)',
    receivedBy: 'Engr. Kenneth C. Eze (PTA Fin Sec)',
    reconciliationStatus: 'RECONCILED'
  },
  {
    id: 'PTA-PAY-002',
    ptaReceiptNo: 'PTA-REC-2026-0102',
    studentId: 'stu-fatima',
    studentName: 'Fatima Abdullahi',
    admissionNo: '2413',
    parentName: 'Alhaji M. Abdullahi',
    parentPhone: '+234 803 123 4567',
    class: 'SSS1 B',
    levyTitle: 'PTA-Employed Specialist Subject Teachers Monthly Support',
    amountPaid: 10000,
    paymentDate: '2026-10-03 10:16:00',
    channel: 'Bank Transfer (PTA Dedicated Account)',
    bankRef: 'FBN-PTA-TX-9901828',
    ptaAccount: 'First Bank of Nigeria (PTA Acct: 2038471920)',
    receivedBy: 'Engr. Kenneth C. Eze (PTA Fin Sec)',
    reconciliationStatus: 'RECONCILED'
  },
  {
    id: 'PTA-PAY-003',
    ptaReceiptNo: 'PTA-REC-2026-0103',
    studentId: 'stu-ibrahim',
    studentName: 'Ibrahim Mohammed',
    admissionNo: '2418',
    parentName: 'Col. K. Mohammed',
    parentPhone: '+234 802 987 6543',
    class: 'SSS1 B',
    levyTitle: 'School Solar Power Inverter & Battery Bank Project',
    amountPaid: 25000,
    paymentDate: '2026-10-04 11:40:00',
    channel: 'Direct Cash to Fin Sec',
    bankRef: 'CSH-VERIFIED-RECEIPT-402',
    ptaAccount: 'First Bank of Nigeria (PTA Acct: 2038471920)',
    receivedBy: 'Engr. Kenneth C. Eze (PTA Fin Sec)',
    reconciliationStatus: 'RECONCILED'
  },
  {
    id: 'PTA-PAY-004',
    ptaReceiptNo: 'PTA-REC-2026-0104',
    studentId: 'stu-zainab',
    studentName: 'Zainab Bello',
    admissionNo: '2422',
    parentName: 'Barrister U. Bello',
    parentPhone: '+234 809 333 4455',
    class: 'SSS1 B',
    levyTitle: 'School Solar Power Inverter & Battery Bank Project',
    amountPaid: 25000,
    paymentDate: '2026-10-05 09:20:00',
    channel: 'Bank Transfer (PTA Dedicated Account)',
    bankRef: 'FBN-PTA-TX-9902041',
    ptaAccount: 'First Bank of Nigeria (PTA Acct: 2038471920)',
    receivedBy: 'Engr. Kenneth C. Eze (PTA Fin Sec)',
    reconciliationStatus: 'RECONCILED'
  }
];

export const INITIAL_PTA_EXPENSES: PtaExpense[] = [
  {
    id: 'PTA-EXP-01',
    voucherNo: 'PTA-VOUCH-2026-018',
    title: 'Phase 1 Solar Hybrid 15kVA Inverter Procurement & Lithium Battery Rack',
    category: 'Infrastructure & Projects',
    amount: 14500000,
    date: '2026-09-25',
    beneficiary: 'GreenWatt Renewable Energy Nig Ltd',
    approvedBy: 'Col. T. Aliyu (PTA Chairman) & Engr. K. Eze (PTA Fin Sec)',
    status: 'DISBURSED'
  },
  {
    id: 'PTA-EXP-02',
    voucherNo: 'PTA-VOUCH-2026-019',
    title: 'September 2026 PTA Auxiliary Teacher Stipends (8 Specialist Teachers)',
    category: 'Teacher Subsidy',
    amount: 1200000,
    date: '2026-09-30',
    beneficiary: 'PTA Subsidized Teaching Cadre',
    approvedBy: 'Col. T. Aliyu (PTA Chairman) & Engr. K. Eze (PTA Fin Sec)',
    status: 'DISBURSED'
  },
  {
    id: 'PTA-EXP-03',
    voucherNo: 'PTA-VOUCH-2026-020',
    title: 'Installation of Solar Cables, Protection Panels & Lightning Arresters',
    category: 'Infrastructure & Projects',
    amount: 3200000,
    date: '2026-10-04',
    beneficiary: 'Arewa Electrical Engineering Services',
    approvedBy: 'Col. T. Aliyu (PTA Chairman) & Engr. K. Eze (PTA Fin Sec)',
    status: 'APPROVED'
  }
];

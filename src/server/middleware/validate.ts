import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

/**
 * Middleware factory for strict body validation.
 * Any request payload with extra or unauthorized keys will be rejected with 400 Bad Request.
 */
export const validateBody = (schema: z.ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed: Invalid or unrecognized fields provided.',
          details: err.issues.map(e => ({
            field: e.path.join('.'),
            message: e.message,
            code: e.code,
          }))
        });
      }
      return res.status(400).json({ error: 'Malformed request payload.' });
    }
  };
};

/**
 * -----------------------------------------------------------------------------
 * STRICT SCHEMAS PER ROUTE
 * Protected fields that users MUST NEVER set via request body:
 * - id / _id (Server-generated UUID)
 * - school_id (Derived exclusively from req.user.school_id)
 * - department_id (Derived exclusively from req.user.department_id)
 * - role (Managed only by Super Admin)
 * - is_admin / is_superuser (Privileged escalation vector)
 * - recorded_by / created_by (Derived exclusively from req.user.id)
 * - approved_by / status (Controlled by server workflow state machine)
 * - created_at / updated_at (Server timestamped)
 * - amount / price (Looked up on server from canonical fee_types table)
 * -----------------------------------------------------------------------------
 */

// 1. Auth Schemas
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
}).strict();

export const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  first_name: z.string().min(1).max(50),
  last_name: z.string().min(1).max(50),
}).strict();

export const PasswordResetSchema = z.object({
  email: z.string().email(),
}).strict();

// 2. Student Management Schemas
export const CreateStudentSchema = z.object({
  admission_no: z.string().min(3).max(30),
  first_name: z.string().min(1).max(60),
  last_name: z.string().min(1).max(60),
}).strict();

export const UpdateStudentSchema = z.object({
  first_name: z.string().min(1).max(60).optional(),
  last_name: z.string().min(1).max(60).optional(),
}).strict();

// 3. Finance & Payments Schemas
// CRITICAL: Notice that 'amount' is FORBIDDEN here.
// The server retrieves the canonical price by looking up fee_type_id in the database.
export const RecordPaymentSchema = z.object({
  student_id: z.string().min(1),
  fee_type_id: z.string().min(1),
  payment_method: z.enum(['Cash', 'Bank Transfer', 'POS', 'Online/Card']),
  receipt_no: z.string().min(3),
}).strict();

export const CreateCheckoutSessionSchema = z.object({
  fee_type_id: z.string().min(1),
  student_id: z.string().min(1),
  success_url: z.string().url(),
  cancel_url: z.string().url(),
}).strict();

// 4. Examination Results Schema
export const EnterMarksSchema = z.object({
  exam_id: z.string().min(1),
  student_id: z.string().min(1),
  ca_score: z.number().min(0).max(40),
  exam_score: z.number().min(0).max(60),
}).strict();

// 5. PTA Expense Schema
export const RecordPtaExpenseSchema = z.object({
  pta_account_id: z.string().min(1),
  description: z.string().min(3).max(255),
  amount: z.number().positive(),
}).strict();

// 6. Attendance Schema
export const RecordAttendanceSchema = z.object({
  student_id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted YYYY-MM-DD'),
  status: z.enum(['Present', 'Late', 'Absent']),
}).strict();

// 7. Admin Manage Users Schema
export const CreateUserSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  department_id: z.string().min(1),
  role: z.enum(['teacher', 'class_teacher', 'exam_officer', 'bursar', 'pta_secretary', 'vice_principal', 'principal']),
}).strict();

// 8. AI Proxy Request Schema
export const GenerateAiContentSchema = z.object({
  prompt: z.string().min(1).max(4000),
  context: z.string().max(2000).optional(),
}).strict();

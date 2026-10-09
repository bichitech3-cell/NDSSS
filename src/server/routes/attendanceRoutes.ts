import { Router, Response } from 'express';
import db from '../db';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';
import { validateBody, RecordAttendanceSchema } from '../middleware/validate';
import { logAction } from '../utils/audit';

const router = Router();

// Academic: Record Attendance
router.post(
  '/record',
  authenticate,
  authorize('RECORD_ATTENDANCE', 'department'),
  validateBody(RecordAttendanceSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    const { student_id, date, status } = req.body;
    const { user, scopeFilter } = req;

    try {
      // 1. Ownership check: verify student belongs to caller's school
      const studentRes = await db.query(
        'SELECT id FROM students WHERE id = $1 AND school_id = $2',
        [student_id, user!.school_id]
      );

      if (studentRes.rowCount === 0) {
        return res.status(404).json({ error: 'Student record not found in your school.' });
      }

      const result = await db.query(
        `INSERT INTO attendance (student_id, date, status, recorded_by, department_id, school_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [student_id, date, status, user!.id, scopeFilter?.department_id, user!.school_id]
      );

      await logAction(user!.id, 'CREATE', 'attendance', result.rows[0].id, 'Record attendance');
      return res.status(201).json(result.rows[0]);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;

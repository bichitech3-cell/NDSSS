import { Router, Response } from 'express';
import pool from '../../db';
import { authenticate, authorize, AuthenticatedRequest } from '../../middleware/auth';
import { logAction } from '../../utils/audit';

const router = Router();

// Academic: Record Attendance
router.post('/record', authenticate, authorize('RECORD_ATTENDANCE', 'department'), async (req: AuthenticatedRequest, res: Response) => {
  const { student_id, date, status } = req.body;
  const { user, scopeFilter } = req;

  try {
    const result = await pool.query(
      `INSERT INTO attendance (student_id, date, status, recorded_by, department_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [student_id, date, status, user?.id, scopeFilter?.department_id]
    );

    await logAction(user!.id, 'CREATE', 'attendance', result.rows[0].id, 'Record attendance');
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

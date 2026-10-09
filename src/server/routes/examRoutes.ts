import { Router, Response } from 'express';
import db from '../db';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';
import { validateBody, EnterMarksSchema } from '../middleware/validate';
import { logAction } from '../utils/audit';

const router = Router();

// Secure API endpoint to enter marks
router.post(
  '/results',
  authenticate,
  authorize('ENTER_RESULTS', 'department'),
  validateBody(EnterMarksSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    const { exam_id, student_id, ca_score, exam_score } = req.body;
    const { user, scopeFilter } = req;

    try {
      // 1. Verify student exists in caller's school
      const studentRes = await db.query(
        'SELECT id FROM students WHERE id = $1 AND school_id = $2',
        [student_id, user!.school_id]
      );
      if (studentRes.rowCount === 0) {
        return res.status(404).json({ error: 'Student record not found in your institution.' });
      }

      // 2. Insert examination marks with school and department scoping
      const result = await db.query(
        `INSERT INTO examination_results (exam_id, student_id, ca_score, exam_score, department_id, school_id, recorded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          exam_id,
          student_id,
          ca_score,
          exam_score,
          scopeFilter?.department_id,
          user!.school_id,
          user!.id,
        ]
      );

      if (result.rowCount === 0) {
        return res.status(403).json({ error: 'Unauthorized or invalid examination record for your department.' });
      }

      await logAction(user!.id, 'CREATE', 'examination_results', result.rows[0].id, 'Enter examination marks');
      return res.status(201).json(result.rows[0]);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;

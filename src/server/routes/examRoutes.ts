import { Router, Response } from 'express';
import pool from '../../db';
import { authenticate, authorize, AuthenticatedRequest } from '../../middleware/auth';
import { logAction } from '../../utils/audit';

const router = Router();

// Secure API endpoint to enter marks
router.post('/results', authenticate, authorize('ENTER_RESULTS', 'department'), async (req: AuthenticatedRequest, res: Response) => {
  const { exam_id, student_id, ca_score, exam_score } = req.body;
  const { user, scopeFilter } = req;

  try {
    // Enforce department isolation by including scopeFilter in the query
    const result = await pool.query(
      `INSERT INTO examination_results (exam_id, student_id, ca_score, exam_score, department_id, school_id)
       SELECT $1, $2, $3, $4, $5, $6
       FROM examinations e
       WHERE e.id = $1 AND e.department_id = $5 AND e.school_id = $6
       RETURNING *`,
      [exam_id, student_id, ca_score, exam_score, scopeFilter?.department_id, user?.school_id]
    );

    if (result.rowCount === 0) {
      return res.status(403).json({ error: 'Unauthorized or invalid examination record.' });
    }

    await logAction(user!.id, 'CREATE', 'examination_results', result.rows[0].id, 'Enter examination marks');
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

import { Router, Response } from 'express';
import pool from '../../db';
import { authenticate, authorize, AuthenticatedRequest } from '../../middleware/auth';
import { logAction } from '../../utils/audit';

const router = Router();

// Bursar: Record School Payment
router.post('/payments', authenticate, authorize('RECORD_SCHOOL_PAYMENT', 'department'), async (req: AuthenticatedRequest, res: Response) => {
  const { student_id, fee_type_id, amount, method, receipt_no } = req.body;
  const { user, scopeFilter } = req;

  try {
    const result = await pool.query(
      `INSERT INTO payments (school_id, department_id, student_id, fee_type_id, amount_paid, payment_method, receipt_no, recorded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [user?.school_id, scopeFilter?.department_id, student_id, fee_type_id, amount, method, receipt_no, user?.id]
    );

    await logAction(user!.id, 'CREATE', 'payments', result.rows[0].id, 'Record school payment');
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

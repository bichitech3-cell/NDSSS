import { Router, Response } from 'express';
import pool from '../../db';
import { authenticate, authorize, AuthenticatedRequest } from '../../middleware/auth';
import { logAction } from '../../utils/audit';

const router = Router();

// PTA Financial Secretary: Record PTA Expense
router.post('/pta-expenses', authenticate, authorize('RECORD_PTA_EXPENSE', 'department'), async (req: AuthenticatedRequest, res: Response) => {
  const { pta_account_id, description, amount } = req.body;
  const { user } = req;

  try {
    const result = await pool.query(
      `INSERT INTO pta_expenses (pta_account_id, description, amount, recorded_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [pta_account_id, description, amount, user?.id]
    );

    await logAction(user!.id, 'CREATE', 'pta_expenses', result.rows[0].id, 'Record PTA expense');
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

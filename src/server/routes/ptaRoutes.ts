import { Router, Response } from 'express';
import db from '../db';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';
import { validateBody, RecordPtaExpenseSchema } from '../middleware/validate';
import { logAction } from '../utils/audit';

const router = Router();

// PTA Financial Secretary: Record PTA Expense
router.post(
  '/pta-expenses',
  authenticate,
  authorize('RECORD_PTA_EXPENSE', 'department'),
  validateBody(RecordPtaExpenseSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    const { pta_account_id, description, amount } = req.body;
    const { user } = req;

    try {
      // 1. Verify PTA account belongs to caller's school
      const accRes = await db.query(
        'SELECT id FROM pta_accounts WHERE id = $1 AND school_id = $2',
        [pta_account_id, user!.school_id]
      );

      if (accRes.rowCount === 0) {
        return res.status(404).json({ error: 'PTA account not found or unauthorized for your school.' });
      }

      const result = await db.query(
        `INSERT INTO pta_expenses (pta_account_id, description, amount, recorded_by)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [pta_account_id, description, amount, user!.id]
      );

      await logAction(user!.id, 'CREATE', 'pta_expenses', result.rows[0].id, 'Record PTA expense');
      return res.status(201).json(result.rows[0]);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;

import { Router, Response } from 'express';
import db from '../db';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';
import { validateBody, RecordPaymentSchema } from '../middleware/validate';
import { logAction } from '../utils/audit';

const router = Router();

/**
 * Bursar: Record School Payment (Direct / Counter Payment)
 * Records offline, cash, bank transfer, or point-of-sale terminal transactions.
 */
router.post(
  '/payments',
  authenticate,
  authorize('RECORD_SCHOOL_PAYMENT', 'department'),
  validateBody(RecordPaymentSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    const { student_id, fee_type_id, payment_method, receipt_no } = req.body;
    const { user, scopeFilter } = req;

    try {
      // 1. Verify that the student belongs to caller's school
      const studentRes = await db.query(
        'SELECT id, first_name, last_name FROM students WHERE id = $1 AND school_id = $2',
        [student_id, user!.school_id]
      );
      if (studentRes.rowCount === 0) {
        return res.status(404).json({ error: 'Student record not found in your institution.' });
      }

      // 2. Server price lookup: Lookup fee product from database by product ID
      const feeRes = await db.query(
        'SELECT id, name, amount FROM fee_types WHERE id = $1 AND school_id = $2',
        [fee_type_id, user!.school_id]
      );
      if (feeRes.rowCount === 0) {
        return res.status(404).json({ error: 'Fee schedule item not found or unauthorized.' });
      }

      const feeItem = feeRes.rows[0];
      const verifiedCanonicalAmount = Number(feeItem.amount);

      // 3. Insert payment
      const result = await db.query(
        `INSERT INTO payments (school_id, department_id, student_id, fee_type_id, amount_paid, payment_method, receipt_no, recorded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          user!.school_id,
          scopeFilter?.department_id,
          student_id,
          fee_type_id,
          verifiedCanonicalAmount,
          payment_method,
          receipt_no,
          user!.id,
        ]
      );

      await logAction(
        user!.id,
        'CREATE',
        'payments',
        result.rows[0].id,
        `Record payment of ₦${verifiedCanonicalAmount} for fee item '${feeItem.name}'`
      );

      return res.status(201).json({
        ...result.rows[0],
        verified_amount: verifiedCanonicalAmount,
        fee_name: feeItem.name,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;


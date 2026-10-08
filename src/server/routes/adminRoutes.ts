import { Router, Response } from 'express';
import pool from '../../db';
import { authenticate, authorize, AuthenticatedRequest } from '../../middleware/auth';

const router = Router();

// Principal/Admin: School-wide reporting
router.get('/dashboard-metrics', authenticate, authorize('VIEW_SCHOOL_METRICS', 'school'), async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;

  try {
    const result = await pool.query(
      'SELECT * FROM school_wide_metrics WHERE school_id = $1',
      [user?.school_id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Manage users
router.post('/users', authenticate, authorize('MANAGE_USERS', 'school'), async (req: AuthenticatedRequest, res: Response) => {
  // Logic for creating users would go here
  res.status(201).json({ message: 'User created' });
});

export default router;

import { Router, Response } from 'express';
import db from '../db';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';
import { validateBody, CreateUserSchema } from '../middleware/validate';
import { logAction } from '../utils/audit';

const router = Router();

// Principal/Admin: School-wide reporting
router.get(
  '/dashboard-metrics',
  authenticate,
  authorize('VIEW_SCHOOL_METRICS', 'school'),
  async (req: AuthenticatedRequest, res: Response) => {
    const { user } = req;

    try {
      const result = await db.query(
        'SELECT * FROM school_wide_metrics WHERE school_id = $1',
        [user!.school_id]
      );

      return res.json(result.rows[0] || { total_students: 0, total_revenue: 0, present_today: 0 });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Admin: Manage users
// Rejects unknown fields; injects school_id from admin token; prevents cross-school creation
router.post(
  '/users',
  authenticate,
  authorize('MANAGE_USERS', 'school'),
  validateBody(CreateUserSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    const { email, first_name, last_name, department_id, role } = req.body;
    const { user } = req;

    try {
      const newUser = {
        id: `user-${Date.now()}`,
        school_id: user!.school_id,
        department_id,
        role,
        email,
        password_hash: 'hashed_temp_pass',
      };

      db.getStore().users.push(newUser);

      await logAction(
        user!.id,
        'CREATE',
        'users',
        newUser.id,
        `Admin created user account for ${email} with role ${role}`
      );

      return res.status(201).json({
        message: 'User created successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          school_id: newUser.school_id,
          department_id: newUser.department_id,
        }
      });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;

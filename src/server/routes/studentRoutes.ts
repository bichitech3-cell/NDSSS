import { Router, Response } from 'express';
import pool from '../../db';
import { authenticate, authorize, AuthenticatedRequest } from '../../middleware/auth';
import { logAction } from '../../utils/audit';

const router = Router();

// Student Affairs: Search/List Students
router.get('/', authenticate, authorize('VIEW_STUDENTS', 'department'), async (req: AuthenticatedRequest, res: Response) => {
  const { name } = req.query;
  const { user } = req;

  try {
    let query = 'SELECT * FROM students WHERE school_id = $1';
    const params = [user?.school_id];

    if (name) {
      query += ' AND (first_name ILIKE $2 OR last_name ILIKE $2)';
      params.push(`%${name}%`);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Student Affairs: Add Student
router.post('/', authenticate, authorize('MANAGE_STUDENTS', 'department'), async (req: AuthenticatedRequest, res: Response) => {
  const { admission_no, first_name, last_name } = req.body;
  const { user } = req;

  try {
    const result = await pool.query(
      `INSERT INTO students (school_id, admission_no, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user?.school_id, admission_no, first_name, last_name]
    );

    await logAction(user!.id, 'CREATE', 'students', result.rows[0].id, 'Add new student');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

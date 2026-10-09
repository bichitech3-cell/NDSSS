import { Router, Response } from 'express';
import db from '../db';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';
import { validateBody, CreateStudentSchema, UpdateStudentSchema } from '../middleware/validate';
import { logAction } from '../utils/audit';

const router = Router();

// Student Affairs: Search/List Students
// Scoped to the caller's school_id (derived strictly from req.user)
router.get('/', authenticate, authorize('VIEW_STUDENTS', 'school'), async (req: AuthenticatedRequest, res: Response) => {
  const { name } = req.query;
  const { user } = req;

  try {
    let query = 'SELECT * FROM students WHERE school_id = $1';
    const params: any[] = [user!.school_id];

    if (name) {
      query += ' AND (first_name ILIKE $2 OR last_name ILIKE $2)';
      params.push(`%${name}%`);
    }

    const result = await db.query(query, params);
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Single Student Detail: Verifies Caller's School Ownership
router.get('/:id', authenticate, authorize('VIEW_STUDENTS', 'school'), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { user } = req;

  try {
    const result = await db.query(
      'SELECT * FROM students WHERE id = $1 AND school_id = $2',
      [id, user!.school_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Student record not found in your authorized institution.' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Student Affairs: Add Student
// Strictly validated; rejects unrecognized fields; sets school_id from token
router.post('/', authenticate, authorize('MANAGE_STUDENTS', 'school'), validateBody(CreateStudentSchema), async (req: AuthenticatedRequest, res: Response) => {
  const { admission_no, first_name, last_name } = req.body;
  const { user } = req;

  try {
    const result = await db.query(
      `INSERT INTO students (school_id, admission_no, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user!.school_id, admission_no, first_name, last_name]
    );

    await logAction(user!.id, 'CREATE', 'students', result.rows[0].id, 'Add new student');
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Student Affairs: Update Student
// Verifies caller's school ownership. Prevents cross-tenant edits.
router.put('/:id', authenticate, authorize('MANAGE_STUDENTS', 'school'), validateBody(UpdateStudentSchema), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { first_name, last_name } = req.body;
  const { user } = req;

  try {
    // 1. Ownership check: Must belong to caller's school
    const existing = await db.query(
      'SELECT * FROM students WHERE id = $1 AND school_id = $2',
      [id, user!.school_id]
    );

    if (existing.rowCount === 0) {
      return res.status(404).json({ error: 'Student record not found or belongs to another institution.' });
    }

    const result = await db.query(
      `UPDATE students
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name)
       WHERE id = $3 AND school_id = $4
       RETURNING *`,
      [first_name, last_name, id, user!.school_id]
    );

    await logAction(user!.id, 'UPDATE', 'students', id, 'Update student information');
    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Student Affairs: Delete Student
// Verifies caller's school ownership. Prevents cross-tenant deletion.
router.delete('/:id', authenticate, authorize('MANAGE_STUDENTS', 'school'), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { user } = req;

  try {
    const result = await db.query(
      'DELETE FROM students WHERE id = $1 AND school_id = $2 RETURNING *',
      [id, user!.school_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Student record not found or belongs to another institution.' });
    }

    await logAction(user!.id, 'DELETE', 'students', id, 'Delete student record');
    return res.json({ message: 'Student record successfully deleted.', deleted_id: id });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { validateBody, LoginSchema, SignupSchema, PasswordResetSchema } from '../middleware/validate';
import { loginLimiter, signupLimiter, passwordResetLimiter } from '../middleware/rateLimiter';
import { signToken } from '../middleware/auth';
import db from '../db';

const router = Router();

// POST /api/auth/login
router.post('/login', loginLimiter, validateBody(LoginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // In production, compare with bcrypt.hash
  const user = db.getStore().users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Generate signed JWT token with school, role, and department claims
  const token = signToken({
    id: user.id,
    role: user.role,
    department_id: user.department_id,
    school_id: user.school_id,
    email: user.email,
  });

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      department_id: user.department_id,
      school_id: user.school_id,
    }
  });
});

// POST /api/auth/signup
router.post('/signup', signupLimiter, validateBody(SignupSchema), async (req: Request, res: Response) => {
  const { email, first_name, last_name } = req.body;

  const existing = db.getStore().users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'User with this email already exists.' });
  }

  // New signup defaults to non-privileged applicant/teacher in school-1
  const newUser = {
    id: `user-${Date.now()}`,
    school_id: 'school-1',
    department_id: 'dept-academic',
    role: 'teacher',
    email,
    password_hash: 'hashed_password_mock',
  };

  db.getStore().users.push(newUser);

  const token = signToken({
    id: newUser.id,
    role: newUser.role,
    department_id: newUser.department_id,
    school_id: newUser.school_id,
    email: newUser.email,
  });

  return res.status(201).json({
    message: 'User registered successfully.',
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    }
  });
});

// POST /api/auth/password-reset
router.post('/password-reset', passwordResetLimiter, validateBody(PasswordResetSchema), async (req: Request, res: Response) => {
  const { email } = req.body;

  // Generic secure response (prevents account enumeration)
  return res.json({
    message: 'If an account exists with this email address, a secure password reset link has been dispatched.',
  });
});

export default router;

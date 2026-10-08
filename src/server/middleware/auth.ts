import { Request, Response, NextFunction } from 'express';
import pool from '../db';

// Enhanced Request type to include user and scope
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    department_id: string;
    school_id: string;
  };
  scopeFilter?: {
    department_id?: string;
    school_id?: string;
  };
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Authentication logic (e.g., verifying JWT)
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Verify token and set req.user...
    // Mock user for now
    req.user = { id: 'user-1', role: 'admin', department_id: 'dept-1', school_id: 'school-1' };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorize = (requiredPermission: string, scope: 'department' | 'school') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { user } = req;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // 1. Check if user has permission
    const result = await pool.query(
      `SELECT 1 FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = $1 AND p.name = $2`,
      [user.role, requiredPermission]
    );

    if (result.rowCount === 0) {
      return res.status(403).json({ error: 'You do not have permission to access this information.' });
    }

    // 2. Set scope for query filtering
    if (scope === 'department') {
      req.scopeFilter = { department_id: user.department_id };
    } else if (scope === 'school') {
      req.scopeFilter = { school_id: user.school_id };
    }
    
    next();
  };
};

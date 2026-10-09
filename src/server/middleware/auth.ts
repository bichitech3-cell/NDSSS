import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'sms_super_secret_jwt_hmac256_key_rotate_2026';

export interface UserPayload {
  id: string;
  role: string;
  department_id: string;
  school_id: string;
  email?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
  scopeFilter?: {
    department_id?: string;
    school_id?: string;
  };
}

export const signToken = (payload: UserPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
};

export const verifyToken = (token: string): UserPayload => {
  return jwt.verify(token, JWT_SECRET) as UserPayload;
};

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or malformed Bearer token.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    // Enforce that decoded user object contains mandatory multi-tenant and identity claims
    if (!decoded.id || !decoded.school_id || !decoded.role) {
      return res.status(401).json({ error: 'Unauthorized: Incomplete token claims.' });
    }

    req.user = decoded;
    next();
  } catch (error: any) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token.' });
  }
};

export const authorize = (requiredPermission: string, scope: 'department' | 'school') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Caller identity is missing.' });
    }

    // Check permission in the database for the user's role
    const result = await db.query(
      `SELECT 1 FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = $1 AND p.name = $2`,
      [user.role, requiredPermission]
    );

    if (result.rowCount === 0) {
      return res.status(403).json({
        error: `Forbidden: Role '${user.role}' lacks permission '${requiredPermission}'.`
      });
    }

    // Set scope for strict server-side tenant & department isolation
    if (scope === 'department') {
      req.scopeFilter = { department_id: user.department_id, school_id: user.school_id };
    } else if (scope === 'school') {
      req.scopeFilter = { school_id: user.school_id };
    }

    next();
  };
};

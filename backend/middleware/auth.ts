import { Request, Response, NextFunction } from 'express';
import { db } from '../database/db.ts';

export type UserRole = 'student' | 'faculty' | 'admin';

export interface AuthenticatedUser {
  id: number;
  username: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string | null;
  student_id?: number;
  roll_number?: string;
  faculty_id?: number;
  faculty_code?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  authToken?: string;
}

/**
 * Middleware: Verify Bearer token against persistent SQLite sessions table
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }

  const sessionRow = db
    .prepare(`
      SELECT s.token, s.expires_at, u.id, u.username, u.role, u.full_name, u.email, u.phone
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token = ?
    `)
    .get(token) as (AuthenticatedUser & { token: string; expires_at: string }) | undefined;

  if (!sessionRow) {
    res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
    return;
  }

  if (new Date(sessionRow.expires_at).getTime() < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    res.status(401).json({ error: 'Your session has expired. Please log in again.' });
    return;
  }

  const user: AuthenticatedUser = {
    id: sessionRow.id,
    username: sessionRow.username,
    role: sessionRow.role,
    full_name: sessionRow.full_name,
    email: sessionRow.email,
    phone: sessionRow.phone,
  };

  if (user.role === 'student') {
    const stu = db.prepare('SELECT id, roll_number FROM students WHERE user_id = ?').get(user.id) as
      | { id: number; roll_number: string }
      | undefined;
    if (stu) {
      user.student_id = stu.id;
      user.roll_number = stu.roll_number;
    }
  } else if (user.role === 'faculty') {
    const fac = db.prepare('SELECT id, faculty_code FROM faculty WHERE user_id = ?').get(user.id) as
      | { id: number; faculty_code: string }
      | undefined;
    if (fac) {
      user.faculty_id = fac.id;
      user.faculty_code = fac.faculty_code;
    }
  }

  req.user = user;
  req.authToken = token;
  next();
}

/**
 * Middleware: Restrict route access strictly to specified user roles
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. This section is restricted to ${allowedRoles.join(' or ')} accounts.`,
      });
      return;
    }
    next();
  };
}

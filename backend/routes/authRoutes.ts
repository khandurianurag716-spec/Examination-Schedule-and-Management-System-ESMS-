import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '../database/db.ts';
import { requireAuth, AuthenticatedRequest, UserRole } from '../middleware/auth.ts';

const router = Router();

/**
 * POST /api/auth/login
 * Validates user role, identifier (username / roll_number / faculty_code), and bcrypt password hash
 */
router.post('/login', (req: Request, res: Response) => {
  try {
    const { role, identifier, password } = req.body as {
      role?: UserRole;
      identifier?: string;
      password?: string;
    };

    if (!role || !['student', 'faculty', 'admin'].includes(role)) {
      res.status(400).json({ error: 'Please select a valid user role (Student, Faculty, or Admin).' });
      return;
    }

    if (!identifier || !identifier.trim() || !password) {
      res.status(400).json({ error: 'User ID / Roll Number and password are required.' });
      return;
    }

    const cleanId = identifier.trim();

    let userRow:
      | {
          id: number;
          username: string;
          password_hash: string;
          role: UserRole;
          full_name: string;
          email: string;
          phone: string | null;
        }
      | undefined;

    if (role === 'student') {
      userRow = db
        .prepare(`
          SELECT u.id, u.username, u.password_hash, u.role, u.full_name, u.email, u.phone
          FROM users u
          LEFT JOIN students s ON s.user_id = u.id
          WHERE u.role = 'student' AND (LOWER(u.username) = LOWER(?) OR LOWER(s.roll_number) = LOWER(?))
        `)
        .get(cleanId, cleanId) as typeof userRow;
    } else if (role === 'faculty') {
      userRow = db
        .prepare(`
          SELECT u.id, u.username, u.password_hash, u.role, u.full_name, u.email, u.phone
          FROM users u
          LEFT JOIN faculty f ON f.user_id = u.id
          WHERE u.role = 'faculty' AND (LOWER(u.username) = LOWER(?) OR LOWER(f.faculty_code) = LOWER(?))
        `)
        .get(cleanId, cleanId) as typeof userRow;
    } else {
      userRow = db
        .prepare(`
          SELECT id, username, password_hash, role, full_name, email, phone
          FROM users
          WHERE role = 'admin' AND LOWER(username) = LOWER(?)
        `)
        .get(cleanId) as typeof userRow;
    }

    if (!userRow || !bcrypt.compareSync(password, userRow.password_hash)) {
      res.status(401).json({ error: 'Invalid ID or password for the selected role.' });
      return;
    }

    const ttlHours = Number(process.env.SESSION_TTL_HOURS) || 24;
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();

    db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(
      token,
      userRow.id,
      expiresAt
    );

    const responseUser: Record<string, unknown> = {
      id: userRow.id,
      username: userRow.username,
      role: userRow.role,
      full_name: userRow.full_name,
      email: userRow.email,
      phone: userRow.phone,
    };

    if (userRow.role === 'student') {
      const stu = db.prepare('SELECT id, roll_number FROM students WHERE user_id = ?').get(userRow.id) as
        | { id: number; roll_number: string }
        | undefined;
      if (stu) {
        responseUser.student_id = stu.id;
        responseUser.roll_number = stu.roll_number;
      }
    } else if (userRow.role === 'faculty') {
      const fac = db.prepare('SELECT id, faculty_code FROM faculty WHERE user_id = ?').get(userRow.id) as
        | { id: number; faculty_code: string }
        | undefined;
      if (fac) {
        responseUser.faculty_id = fac.id;
        responseUser.faculty_code = fac.faculty_code;
      }
    }

    res.json({ token, user: responseUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Unable to complete login right now.' });
  }
});

/**
 * POST /api/auth/logout
 * Removes active session token from SQLite
 */
router.post('/logout', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (req.authToken) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(req.authToken);
  }
  res.json({ message: 'Logged out successfully.' });
});

/**
 * GET /api/auth/me
 * Returns currently authenticated user profile
 */
router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

export default router;

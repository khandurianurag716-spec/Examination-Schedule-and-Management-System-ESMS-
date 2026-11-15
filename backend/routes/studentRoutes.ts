import { Router, Response } from 'express';
import { db } from '../database/db.ts';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// All Student routes require authenticated 'student' role
router.use(requireAuth, requireRole('student'));

function getStudentRecord(userId: number) {
  return db
    .prepare(`
      SELECT s.id AS student_id, s.roll_number, s.batch_year, s.section, s.admission_date,
             u.full_name, u.email, u.phone, u.username,
             c.id AS course_id, c.course_code, c.course_name, c.department,
             sem.id AS semester_id, sem.semester_number, sem.academic_year, sem.label AS semester_label
      FROM students s
      JOIN users u ON u.id = s.user_id
      JOIN courses c ON c.id = s.course_id
      JOIN semesters sem ON sem.id = s.semester_id
      WHERE s.user_id = ?
    `)
    .get(userId) as Record<string, unknown> | undefined;
}

/**
 * GET /api/student/dashboard
 */
router.get('/dashboard', (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = getStudentRecord(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: 'Student profile not found.' });
      return;
    }

    const studentId = profile.student_id as number;
    const today = new Date().toISOString().slice(0, 10);

    const subjectCount = (
      db.prepare('SELECT COUNT(*) AS count FROM student_subjects WHERE student_id = ?').get(studentId) as {
        count: number;
      }
    ).count;

    const upcomingExams = db
      .prepare(`
        SELECT e.id, e.exam_title, e.exam_type, e.exam_date, e.exam_time, e.room_number,
               sub.subject_code, sub.subject_name
        FROM examinations e
        JOIN subjects sub ON sub.id = e.subject_id
        JOIN student_subjects ss ON ss.subject_id = sub.id
        WHERE ss.student_id = ? AND e.exam_date >= ?
        ORDER BY e.exam_date ASC
      `)
      .all(studentId, today);

    const latestResult = db
      .prepare(`
        SELECT r.id, r.obtained_marks, r.max_marks, r.grade, r.result_status, r.published_at,
               sub.subject_code, sub.subject_name, e.exam_type
        FROM results r
        JOIN subjects sub ON sub.id = r.subject_id
        JOIN examinations e ON e.id = r.examination_id
        WHERE r.student_id = ? AND r.is_published = 1
        ORDER BY r.published_at DESC, r.id DESC
        LIMIT 1
      `)
      .get(studentId);

    const revaluationStats = db
      .prepare(`
        SELECT COUNT(*) AS total,
               SUM(CASE WHEN status IN ('Pending', 'Under Review', 'Approved') THEN 1 ELSE 0 END) AS active_count
        FROM revaluation_requests
        WHERE student_id = ?
      `)
      .get(studentId) as { total: number; active_count: number | null };

    const latestRevaluation = db
      .prepare(`
        SELECT rr.id, rr.status, rr.submitted_at, sub.subject_code, sub.subject_name
        FROM revaluation_requests rr
        JOIN subjects sub ON sub.id = rr.subject_id
        WHERE rr.student_id = ?
        ORDER BY rr.submitted_at DESC, rr.id DESC
        LIMIT 1
      `)
      .get(studentId);

    res.json({
      profile,
      summary: {
        total_subjects: subjectCount,
        upcoming_exams_count: upcomingExams.length,
        active_revaluations: revaluationStats.active_count || 0,
        total_revaluations: revaluationStats.total || 0,
      },
      upcoming_exams: upcomingExams,
      latest_result: latestResult || null,
      latest_revaluation: latestRevaluation || null,
    });
  } catch (err) {
    console.error('Student dashboard error:', err);
    res.status(500).json({ error: 'Failed to load student dashboard.' });
  }
});

/**
 * GET /api/student/profile
 */
router.get('/profile', (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = getStudentRecord(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: 'Student profile not found.' });
      return;
    }

    const subjects = db
      .prepare(`
        SELECT sub.id, sub.subject_code, sub.subject_name, sub.credits, sem.label AS semester_label
        FROM student_subjects ss
        JOIN subjects sub ON sub.id = ss.subject_id
        JOIN semesters sem ON sem.id = sub.semester_id
        WHERE ss.student_id = ?
        ORDER BY sub.subject_code ASC
      `)
      .all(profile.student_id);

    res.json({ profile, registered_subjects: subjects });
  } catch (err) {
    console.error('Student profile error:', err);
    res.status(500).json({ error: 'Failed to load student profile.' });
  }
});

/**
 * GET /api/student/subjects
 */
router.get('/subjects', (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = getStudentRecord(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: 'Student record not found.' });
      return;
    }

    const subjects = db
      .prepare(`
        SELECT sub.id, sub.subject_code, sub.subject_name, sub.credits, sub.max_marks, sub.passing_marks,
               sem.semester_number, sem.label AS semester_label, c.course_code,
               GROUP_CONCAT(u.full_name, ', ') AS faculty_names
        FROM student_subjects ss
        JOIN subjects sub ON sub.id = ss.subject_id
        JOIN semesters sem ON sem.id = sub.semester_id
        JOIN courses c ON c.id = sub.course_id
        LEFT JOIN faculty_subjects fs ON fs.subject_id = sub.id
        LEFT JOIN faculty f ON f.id = fs.faculty_id
        LEFT JOIN users u ON u.id = f.user_id
        WHERE ss.student_id = ?
        GROUP BY sub.id
        ORDER BY sem.semester_number ASC, sub.subject_code ASC
      `)
      .all(profile.student_id);

    res.json({ subjects });
  } catch (err) {
    console.error('Student subjects error:', err);
    res.status(500).json({ error: 'Failed to load enrolled subjects.' });
  }
});

/**
 * GET /api/student/schedules
 */
router.get('/schedules', (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = getStudentRecord(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: 'Student record not found.' });
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const schedules = db
      .prepare(`
        SELECT e.id, e.exam_title, e.exam_type, e.exam_date, e.exam_time, e.room_number, e.max_marks,
               sub.id AS subject_id, sub.subject_code, sub.subject_name,
               sem.semester_number, sem.label AS semester_label,
               CASE WHEN e.exam_date >= ? THEN 'Upcoming' ELSE 'Completed' END AS schedule_status
        FROM examinations e
        JOIN subjects sub ON sub.id = e.subject_id
        JOIN semesters sem ON sem.id = sub.semester_id
        JOIN student_subjects ss ON ss.subject_id = sub.id
        WHERE ss.student_id = ?
        ORDER BY e.exam_date ASC, e.exam_time ASC
      `)
      .all(today, profile.student_id);

    res.json({ schedules });
  } catch (err) {
    console.error('Student schedules error:', err);
    res.status(500).json({ error: 'Failed to load examination timetable.' });
  }
});

/**
 * GET /api/student/results
 * Returns ONLY published results (is_published = 1)
 */
router.get('/results', (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = getStudentRecord(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: 'Student record not found.' });
      return;
    }

    const results = db
      .prepare(`
        SELECT r.id AS result_id, r.subject_id, r.examination_id,
               r.obtained_marks, r.max_marks, r.grade, r.result_status, r.published_at,
               sub.subject_code, sub.subject_name, sub.credits,
               sem.semester_number, sem.label AS semester_label,
               e.exam_title, e.exam_type, e.exam_date,
               (
                 SELECT rr.status
                 FROM revaluation_requests rr
                 WHERE rr.result_id = r.id
                 ORDER BY rr.id DESC
                 LIMIT 1
               ) AS revaluation_status
        FROM results r
        JOIN subjects sub ON sub.id = r.subject_id
        JOIN semesters sem ON sem.id = sub.semester_id
        JOIN examinations e ON e.id = r.examination_id
        WHERE r.student_id = ? AND r.is_published = 1
        ORDER BY sem.semester_number DESC, e.exam_date DESC, sub.subject_code ASC
      `)
      .all(profile.student_id);

    res.json({ results });
  } catch (err) {
    console.error('Student results error:', err);
    res.status(500).json({ error: 'Failed to load published results.' });
  }
});

/**
 * GET /api/student/revaluations
 */
router.get('/revaluations', (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = getStudentRecord(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: 'Student record not found.' });
      return;
    }

    const requests = db
      .prepare(`
        SELECT rr.id, rr.result_id, rr.subject_id, rr.examination_id,
               rr.original_marks,
               CASE WHEN rr.status = 'Completed' THEN rr.revised_marks ELSE NULL END AS revised_marks,
               rr.reason, rr.status, rr.admin_remarks, rr.submitted_at, rr.updated_at,
               sub.subject_code, sub.subject_name,
               e.exam_title, e.exam_type,
               r.max_marks, r.grade AS current_grade, r.result_status AS current_result_status
        FROM revaluation_requests rr
        JOIN subjects sub ON sub.id = rr.subject_id
        JOIN examinations e ON e.id = rr.examination_id
        JOIN results r ON r.id = rr.result_id
        WHERE rr.student_id = ?
        ORDER BY rr.submitted_at DESC, rr.id DESC
      `)
      .all(profile.student_id);

    res.json({ revaluations: requests });
  } catch (err) {
    console.error('Student revaluations error:', err);
    res.status(500).json({ error: 'Failed to load revaluation requests.' });
  }
});

/**
 * POST /api/student/revaluations
 * Submit a revaluation request for a published result
 */
router.post('/revaluations', (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = getStudentRecord(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: 'Student record not found.' });
      return;
    }

    const { result_id, reason } = req.body as { result_id?: number; reason?: string };

    if (!result_id) {
      res.status(400).json({ error: 'Please select a published subject result for revaluation.' });
      return;
    }

    if (!reason || reason.trim().length < 10) {
      res.status(400).json({ error: 'Please provide a clear reason (at least 10 characters).' });
      return;
    }

    const studentId = profile.student_id as number;

    const resultRow = db
      .prepare(`
        SELECT id, student_id, subject_id, examination_id, obtained_marks, is_published
        FROM results
        WHERE id = ? AND student_id = ?
      `)
      .get(result_id, studentId) as
      | {
          id: number;
          student_id: number;
          subject_id: number;
          examination_id: number;
          obtained_marks: number;
          is_published: number;
        }
      | undefined;

    if (!resultRow) {
      res.status(404).json({ error: 'Result record not found for your account.' });
      return;
    }

    if (resultRow.is_published !== 1) {
      res.status(400).json({ error: 'Revaluation can only be requested for published results.' });
      return;
    }

    // Prevent duplicate active requests for the same subject and examination
    const existingActive = db
      .prepare(`
        SELECT id, status
        FROM revaluation_requests
        WHERE student_id = ? AND subject_id = ? AND examination_id = ?
          AND status IN ('Pending', 'Under Review', 'Approved')
      `)
      .get(studentId, resultRow.subject_id, resultRow.examination_id) as
      | { id: number; status: string }
      | undefined;

    if (existingActive) {
      res.status(409).json({
        error: `An active revaluation request (#${existingActive.id}, status: ${existingActive.status}) already exists for this subject and examination.`,
      });
      return;
    }

    const insertResult = db
      .prepare(`
        INSERT INTO revaluation_requests (
          student_id, result_id, subject_id, examination_id, original_marks, reason, status
        ) VALUES (?, ?, ?, ?, ?, ?, 'Pending')
      `)
      .run(
        studentId,
        resultRow.id,
        resultRow.subject_id,
        resultRow.examination_id,
        resultRow.obtained_marks,
        reason.trim()
      );

    res.status(201).json({
      message: 'Revaluation request submitted successfully.',
      request_id: insertResult.lastInsertRowid,
    });
  } catch (err) {
    console.error('Submit revaluation error:', err);
    res.status(500).json({ error: 'Failed to submit revaluation request.' });
  }
});

export default router;

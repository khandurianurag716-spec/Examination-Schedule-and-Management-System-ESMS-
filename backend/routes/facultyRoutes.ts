import { Router, Response } from 'express';
import { db, calculateGradeAndStatus } from '../database/db.ts';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// All Faculty routes require authenticated 'faculty' role
router.use(requireAuth, requireRole('faculty'));

function getFacultyProfile(userId: number) {
  return db
    .prepare(`
      SELECT f.id AS faculty_id, f.faculty_code, f.department, f.designation, f.joining_date,
             u.full_name, u.email, u.phone, u.username
      FROM faculty f
      JOIN users u ON u.id = f.user_id
      WHERE f.user_id = ?
    `)
    .get(userId) as Record<string, unknown> | undefined;
}

/**
 * GET /api/faculty/dashboard
 */
router.get('/dashboard', (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = getFacultyProfile(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: 'Faculty profile not found.' });
      return;
    }

    const facultyId = profile.faculty_id as number;
    const today = new Date().toISOString().slice(0, 10);

    const assignedSubjectsCount = (
      db.prepare('SELECT COUNT(*) AS count FROM faculty_subjects WHERE faculty_id = ?').get(facultyId) as {
        count: number;
      }
    ).count;

    const totalStudentsCount = (
      db
        .prepare(`
          SELECT COUNT(DISTINCT ss.student_id) AS count
          FROM student_subjects ss
          JOIN faculty_subjects fs ON fs.subject_id = ss.subject_id
          WHERE fs.faculty_id = ?
        `)
        .get(facultyId) as { count: number }
    ).count;

    const upcomingExams = db
      .prepare(`
        SELECT e.id, e.exam_title, e.exam_type, e.exam_date, e.exam_time, e.room_number,
               sub.subject_code, sub.subject_name
        FROM examinations e
        JOIN subjects sub ON sub.id = e.subject_id
        JOIN faculty_subjects fs ON fs.subject_id = sub.id
        WHERE fs.faculty_id = ? AND e.exam_date >= ?
        ORDER BY e.exam_date ASC
      `)
      .all(facultyId, today);

    const assignedRevaluationsCount = (
      db
        .prepare(`
          SELECT COUNT(*) AS count
          FROM revaluation_requests
          WHERE assigned_faculty_id = ? AND status IN ('Pending', 'Under Review')
        `)
        .get(facultyId) as { count: number }
    ).count;

    res.json({
      profile,
      summary: {
        assigned_subjects: assignedSubjectsCount,
        total_students: totalStudentsCount,
        upcoming_exams: upcomingExams.length,
        pending_revaluations: assignedRevaluationsCount,
      },
      upcoming_exams: upcomingExams,
    });
  } catch (err) {
    console.error('Faculty dashboard error:', err);
    res.status(500).json({ error: 'Failed to load faculty dashboard.' });
  }
});

/**
 * GET /api/faculty/subjects
 */
router.get('/subjects', (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = getFacultyProfile(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: 'Faculty profile not found.' });
      return;
    }

    const subjects = db
      .prepare(`
        SELECT sub.id, sub.subject_code, sub.subject_name, sub.credits, sub.max_marks, sub.passing_marks,
               c.course_code, c.course_name, sem.semester_number, sem.label AS semester_label,
               COUNT(DISTINCT ss.student_id) AS enrolled_students_count
        FROM faculty_subjects fs
        JOIN subjects sub ON sub.id = fs.subject_id
        JOIN courses c ON c.id = sub.course_id
        JOIN semesters sem ON sem.id = sub.semester_id
        LEFT JOIN student_subjects ss ON ss.subject_id = sub.id
        WHERE fs.faculty_id = ?
        GROUP BY sub.id
        ORDER BY sem.semester_number ASC, sub.subject_code ASC
      `)
      .all(profile.faculty_id);

    res.json({ subjects });
  } catch (err) {
    console.error('Faculty subjects error:', err);
    res.status(500).json({ error: 'Failed to load assigned subjects.' });
  }
});

/**
 * GET /api/faculty/students
 */
router.get('/students', (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = getFacultyProfile(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: 'Faculty profile not found.' });
      return;
    }

    const students = db
      .prepare(`
        SELECT s.id AS student_id, s.roll_number, s.batch_year, s.section,
               u.full_name, u.email, u.phone,
               c.course_code, c.course_name, sem.semester_number, sem.label AS semester_label,
               GROUP_CONCAT(DISTINCT sub.subject_code) AS subject_codes
        FROM students s
        JOIN users u ON u.id = s.user_id
        JOIN courses c ON c.id = s.course_id
        JOIN semesters sem ON sem.id = s.semester_id
        JOIN student_subjects ss ON ss.student_id = s.id
        JOIN faculty_subjects fs ON fs.subject_id = ss.subject_id
        JOIN subjects sub ON sub.id = ss.subject_id
        WHERE fs.faculty_id = ?
        GROUP BY s.id
        ORDER BY s.roll_number ASC
      `)
      .all(profile.faculty_id);

    res.json({ students });
  } catch (err) {
    console.error('Faculty students error:', err);
    res.status(500).json({ error: 'Failed to load assigned students.' });
  }
});

/**
 * GET /api/faculty/schedules
 */
router.get('/schedules', (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = getFacultyProfile(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: 'Faculty profile not found.' });
      return;
    }

    const schedules = db
      .prepare(`
        SELECT e.id, e.subject_id, e.exam_title, e.exam_type, e.exam_date, e.exam_time, e.room_number, e.max_marks,
               sub.subject_code, sub.subject_name, sem.label AS semester_label
        FROM examinations e
        JOIN subjects sub ON sub.id = e.subject_id
        JOIN semesters sem ON sem.id = sub.semester_id
        JOIN faculty_subjects fs ON fs.subject_id = sub.id
        WHERE fs.faculty_id = ?
        ORDER BY e.exam_date ASC, e.exam_time ASC
      `)
      .all(profile.faculty_id);

    res.json({ schedules });
  } catch (err) {
    console.error('Faculty schedules error:', err);
    res.status(500).json({ error: 'Failed to load examination schedules.' });
  }
});

/**
 * POST /api/faculty/schedules
 */
router.post('/schedules', (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = getFacultyProfile(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: 'Faculty profile not found.' });
      return;
    }

    const { subject_id, exam_title, exam_type, exam_date, exam_time, room_number, max_marks } = req.body as {
      subject_id?: number;
      exam_title?: string;
      exam_type?: string;
      exam_date?: string;
      exam_time?: string;
      room_number?: string;
      max_marks?: number;
    };

    if (!subject_id || !exam_title?.trim() || !exam_type || !exam_date || !exam_time?.trim() || !room_number?.trim()) {
      res.status(400).json({ error: 'All examination schedule fields are required.' });
      return;
    }

    // Verify subject exists and is assigned to this faculty
    const subjectRow = db
      .prepare(`
        SELECT sub.id, sub.max_marks
        FROM subjects sub
        JOIN faculty_subjects fs ON fs.subject_id = sub.id
        WHERE sub.id = ? AND fs.faculty_id = ?
      `)
      .get(subject_id, profile.faculty_id) as { id: number; max_marks: number } | undefined;

    if (!subjectRow) {
      res.status(403).json({ error: 'Subject does not exist or is not assigned to you.' });
      return;
    }

    // Avoid duplicate examination entry
    const duplicate = db
      .prepare('SELECT id FROM examinations WHERE subject_id = ? AND exam_type = ? AND exam_date = ?')
      .get(subject_id, exam_type, exam_date);

    if (duplicate) {
      res.status(409).json({ error: 'An examination of this type already exists for the subject on this date.' });
      return;
    }

    // Room conflict check
    const roomConflict = db
      .prepare('SELECT id, exam_title FROM examinations WHERE exam_date = ? AND exam_time = ? AND LOWER(room_number) = LOWER(?)')
      .get(exam_date, exam_time.trim(), room_number.trim()) as { id: number; exam_title: string } | undefined;

    if (roomConflict) {
      res.status(409).json({
        error: `Room ${room_number.trim()} is already booked on ${exam_date} at ${exam_time.trim()} for "${roomConflict.exam_title}".`,
      });
      return;
    }

    const result = db
      .prepare(`
        INSERT INTO examinations (subject_id, exam_title, exam_type, exam_date, exam_time, room_number, max_marks, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        subject_id,
        exam_title.trim(),
        exam_type,
        exam_date,
        exam_time.trim(),
        room_number.trim(),
        Number(max_marks) > 0 ? Number(max_marks) : subjectRow.max_marks,
        req.user!.id
      );

    res.status(201).json({ message: 'Examination schedule added.', id: result.lastInsertRowid });
  } catch (err) {
    console.error('Add faculty schedule error:', err);
    res.status(500).json({ error: 'Failed to create examination schedule.' });
  }
});

/**
 * PUT /api/faculty/schedules/:id
 */
router.put('/schedules/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = getFacultyProfile(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: 'Faculty profile not found.' });
      return;
    }

    const examId = Number(req.params.id);
    const { exam_title, exam_type, exam_date, exam_time, room_number, max_marks } = req.body as {
      exam_title?: string;
      exam_type?: string;
      exam_date?: string;
      exam_time?: string;
      room_number?: string;
      max_marks?: number;
    };

    const existing = db
      .prepare(`
        SELECT e.id, e.subject_id
        FROM examinations e
        JOIN faculty_subjects fs ON fs.subject_id = e.subject_id
        WHERE e.id = ? AND fs.faculty_id = ?
      `)
      .get(examId, profile.faculty_id) as { id: number; subject_id: number } | undefined;

    if (!existing) {
      res.status(404).json({ error: 'Examination schedule not found for your assigned subjects.' });
      return;
    }

    if (!exam_title?.trim() || !exam_type || !exam_date || !exam_time?.trim() || !room_number?.trim()) {
      res.status(400).json({ error: 'All schedule fields are required.' });
      return;
    }

    db.prepare(`
      UPDATE examinations
      SET exam_title = ?, exam_type = ?, exam_date = ?, exam_time = ?, room_number = ?, max_marks = ?
      WHERE id = ?
    `).run(
      exam_title.trim(),
      exam_type,
      exam_date,
      exam_time.trim(),
      room_number.trim(),
      Number(max_marks) > 0 ? Number(max_marks) : 100,
      examId
    );

    res.json({ message: 'Examination schedule updated.' });
  } catch (err) {
    console.error('Update faculty schedule error:', err);
    res.status(500).json({ error: 'Failed to update examination schedule.' });
  }
});

/**
 * GET /api/faculty/marks
 * Optional query: ?subject_id=...&examination_id=...
 */
router.get('/marks', (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = getFacultyProfile(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: 'Faculty profile not found.' });
      return;
    }

    const subjectId = req.query.subject_id ? Number(req.query.subject_id) : null;
    const examinationId = req.query.examination_id ? Number(req.query.examination_id) : null;

    if (!subjectId || !examinationId) {
      res.json({ students: [] });
      return;
    }

    const assigned = db
      .prepare('SELECT id FROM faculty_subjects WHERE faculty_id = ? AND subject_id = ?')
      .get(profile.faculty_id, subjectId);

    if (!assigned) {
      res.status(403).json({ error: 'You are not assigned to this subject.' });
      return;
    }

    const rows = db
      .prepare(`
        SELECT s.id AS student_id, s.roll_number, u.full_name,
               m.id AS mark_id, m.obtained_marks, m.updated_at,
               e.max_marks,
               r.is_published, r.grade, r.result_status
        FROM student_subjects ss
        JOIN students s ON s.id = ss.student_id
        JOIN users u ON u.id = s.user_id
        JOIN examinations e ON e.id = ? AND e.subject_id = ss.subject_id
        LEFT JOIN marks m ON m.student_id = s.id AND m.subject_id = ss.subject_id AND m.examination_id = e.id
        LEFT JOIN results r ON r.student_id = s.id AND r.subject_id = ss.subject_id AND r.examination_id = e.id
        WHERE ss.subject_id = ?
        ORDER BY s.roll_number ASC
      `)
      .all(examinationId, subjectId);

    res.json({ students: rows });
  } catch (err) {
    console.error('Fetch faculty marks error:', err);
    res.status(500).json({ error: 'Failed to load student marks.' });
  }
});

/**
 * POST /api/faculty/marks
 * Save or update marks for a student in an assigned subject/examination
 */
router.post('/marks', (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = getFacultyProfile(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: 'Faculty profile not found.' });
      return;
    }

    const { student_id, subject_id, examination_id, obtained_marks } = req.body as {
      student_id?: number;
      subject_id?: number;
      examination_id?: number;
      obtained_marks?: number;
    };

    if (!student_id || !subject_id || !examination_id || obtained_marks === undefined || obtained_marks === null) {
      res.status(400).json({ error: 'Student, subject, examination, and marks are required.' });
      return;
    }

    const score = Number(obtained_marks);
    if (Number.isNaN(score) || score < 0) {
      res.status(400).json({ error: 'Obtained marks cannot be negative.' });
      return;
    }

    const assigned = db
      .prepare('SELECT id FROM faculty_subjects WHERE faculty_id = ? AND subject_id = ?')
      .get(profile.faculty_id, subject_id);
    if (!assigned) {
      res.status(403).json({ error: 'You are not authorized to enter marks for this subject.' });
      return;
    }

    const enrolled = db
      .prepare('SELECT id FROM student_subjects WHERE student_id = ? AND subject_id = ?')
      .get(student_id, subject_id);
    if (!enrolled) {
      res.status(400).json({ error: 'Student is not enrolled in this subject.' });
      return;
    }

    const exam = db
      .prepare(`
        SELECT e.id, e.max_marks, sub.passing_marks
        FROM examinations e
        JOIN subjects sub ON sub.id = e.subject_id
        WHERE e.id = ? AND e.subject_id = ?
      `)
      .get(examination_id, subject_id) as { id: number; max_marks: number; passing_marks: number } | undefined;

    if (!exam) {
      res.status(404).json({ error: 'Examination not found for this subject.' });
      return;
    }

    if (score > exam.max_marks) {
      res.status(400).json({ error: `Obtained marks (${score}) cannot exceed maximum marks (${exam.max_marks}).` });
      return;
    }

    const existingResult = db
      .prepare('SELECT id, is_published FROM results WHERE student_id = ? AND subject_id = ? AND examination_id = ?')
      .get(student_id, subject_id, examination_id) as { id: number; is_published: number } | undefined;

    if (existingResult && existingResult.is_published === 1) {
      res.status(403).json({
        error: 'This result is already published by Administration. Changes require the revaluation workflow or Admin authorization.',
      });
      return;
    }

    const { grade, result_status } = calculateGradeAndStatus(score, exam.max_marks, exam.passing_marks);

    const saveTransaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO marks (student_id, subject_id, examination_id, obtained_marks, max_marks, entered_by, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(student_id, subject_id, examination_id) DO UPDATE SET
          obtained_marks = excluded.obtained_marks,
          max_marks = excluded.max_marks,
          entered_by = excluded.entered_by,
          updated_at = datetime('now')
      `).run(student_id, subject_id, examination_id, score, exam.max_marks, req.user!.id);

      db.prepare(`
        INSERT INTO results (student_id, subject_id, examination_id, obtained_marks, max_marks, grade, result_status, is_published)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0)
        ON CONFLICT(student_id, subject_id, examination_id) DO UPDATE SET
          obtained_marks = excluded.obtained_marks,
          max_marks = excluded.max_marks,
          grade = excluded.grade,
          result_status = excluded.result_status
      `).run(student_id, subject_id, examination_id, score, exam.max_marks, grade, result_status);
    });

    saveTransaction();

    res.json({
      message: 'Marks saved successfully (pending Admin result publication).',
      grade,
      result_status,
    });
  } catch (err) {
    console.error('Save marks error:', err);
    res.status(500).json({ error: 'Failed to save marks.' });
  }
});

/**
 * GET /api/faculty/revaluations
 */
router.get('/revaluations', (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = getFacultyProfile(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: 'Faculty profile not found.' });
      return;
    }

    const requests = db
      .prepare(`
        SELECT rr.id, rr.result_id, rr.original_marks, rr.revised_marks, rr.reason, rr.status,
               rr.faculty_remarks, rr.faculty_recommended_marks, rr.admin_remarks, rr.submitted_at, rr.updated_at,
               s.roll_number, stu_user.full_name AS student_name,
               sub.subject_code, sub.subject_name,
               e.exam_title, e.exam_type, e.max_marks
        FROM revaluation_requests rr
        JOIN students s ON s.id = rr.student_id
        JOIN users stu_user ON stu_user.id = s.user_id
        JOIN subjects sub ON sub.id = rr.subject_id
        JOIN examinations e ON e.id = rr.examination_id
        WHERE rr.assigned_faculty_id = ?
        ORDER BY rr.submitted_at DESC, rr.id DESC
      `)
      .all(profile.faculty_id);

    res.json({ revaluations: requests });
  } catch (err) {
    console.error('Faculty revaluations error:', err);
    res.status(500).json({ error: 'Failed to load assigned revaluation requests.' });
  }
});

/**
 * POST /api/faculty/revaluations/:id/recommend
 * Faculty enters recommended revised marks & remarks for Admin approval
 */
router.post('/revaluations/:id/recommend', (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = getFacultyProfile(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: 'Faculty profile not found.' });
      return;
    }

    const requestId = Number(req.params.id);
    const { recommended_marks, remarks } = req.body as {
      recommended_marks?: number;
      remarks?: string;
    };

    const row = db
      .prepare(`
        SELECT rr.id, rr.status, e.max_marks
        FROM revaluation_requests rr
        JOIN examinations e ON e.id = rr.examination_id
        WHERE rr.id = ? AND rr.assigned_faculty_id = ?
      `)
      .get(requestId, profile.faculty_id) as { id: number; status: string; max_marks: number } | undefined;

    if (!row) {
      res.status(404).json({ error: 'Revaluation request not found or not assigned to you.' });
      return;
    }

    if (row.status === 'Completed' || row.status === 'Rejected') {
      res.status(400).json({ error: 'This revaluation request has already been finalized by Admin.' });
      return;
    }

    const score = Number(recommended_marks);
    if (Number.isNaN(score) || score < 0 || score > row.max_marks) {
      res.status(400).json({ error: `Recommended marks must be between 0 and ${row.max_marks}.` });
      return;
    }

    if (!remarks || remarks.trim().length < 5) {
      res.status(400).json({ error: 'Please provide review remarks (at least 5 characters).' });
      return;
    }

    db.prepare(`
      UPDATE revaluation_requests
      SET faculty_recommended_marks = ?,
          faculty_remarks = ?,
          status = 'Under Review',
          updated_at = datetime('now')
      WHERE id = ?
    `).run(score, remarks.trim(), requestId);

    res.json({ message: 'Review recommendation submitted to Administration for final publication.' });
  } catch (err) {
    console.error('Faculty revaluation recommend error:', err);
    res.status(500).json({ error: 'Failed to submit revaluation recommendation.' });
  }
});

export default router;

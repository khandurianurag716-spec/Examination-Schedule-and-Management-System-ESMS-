import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, calculateGradeAndStatus } from '../database/db.ts';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// All Admin routes require authenticated 'admin' role
router.use(requireAuth, requireRole('admin'));

/**
 * GET /api/admin/dashboard
 */
router.get('/dashboard', (_req: AuthenticatedRequest, res: Response) => {
  try {
    const totalStudents = (db.prepare('SELECT COUNT(*) AS count FROM students').get() as { count: number }).count;
    const totalFaculty = (db.prepare('SELECT COUNT(*) AS count FROM faculty').get() as { count: number }).count;
    const totalSubjects = (db.prepare('SELECT COUNT(*) AS count FROM subjects').get() as { count: number }).count;
    const totalExams = (db.prepare('SELECT COUNT(*) AS count FROM examinations').get() as { count: number }).count;
    const publishedResults = (
      db.prepare('SELECT COUNT(*) AS count FROM results WHERE is_published = 1').get() as { count: number }
    ).count;
    const pendingRevaluations = (
      db
        .prepare("SELECT COUNT(*) AS count FROM revaluation_requests WHERE status IN ('Pending', 'Under Review')")
        .get() as { count: number }
    ).count;

    const gradeBreakdown = db
      .prepare(`
        SELECT grade, COUNT(*) AS count
        FROM results
        WHERE is_published = 1
        GROUP BY grade
        ORDER BY count DESC
      `)
      .all();

    const recentRevaluations = db
      .prepare(`
        SELECT rr.id, rr.status, rr.original_marks, rr.revised_marks, rr.submitted_at,
               s.roll_number, u.full_name AS student_name, sub.subject_code
        FROM revaluation_requests rr
        JOIN students s ON s.id = rr.student_id
        JOIN users u ON u.id = s.user_id
        JOIN subjects sub ON sub.id = rr.subject_id
        ORDER BY rr.submitted_at DESC, rr.id DESC
        LIMIT 5
      `)
      .all();

    res.json({
      summary: {
        total_students: totalStudents,
        total_faculty: totalFaculty,
        total_subjects: totalSubjects,
        total_examinations: totalExams,
        published_results: publishedResults,
        pending_revaluations: pendingRevaluations,
      },
      grade_breakdown: gradeBreakdown,
      recent_revaluations: recentRevaluations,
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({ error: 'Failed to load admin dashboard.' });
  }
});

/**
 * GET /api/admin/metadata
 */
router.get('/metadata', (_req: AuthenticatedRequest, res: Response) => {
  try {
    const courses = db.prepare('SELECT * FROM courses ORDER BY course_code ASC').all();
    const semesters = db.prepare('SELECT * FROM semesters ORDER BY semester_number ASC').all();
    res.json({ courses, semesters });
  } catch (err) {
    console.error('Metadata error:', err);
    res.status(500).json({ error: 'Failed to load courses and semesters.' });
  }
});

// ============================================================================
// STUDENT MANAGEMENT
// ============================================================================
router.get('/students', (_req: AuthenticatedRequest, res: Response) => {
  try {
    const students = db
      .prepare(`
        SELECT s.id AS student_id, s.roll_number, s.course_id, s.semester_id, s.batch_year, s.section, s.admission_date,
               u.id AS user_id, u.full_name, u.email, u.phone, u.username,
               c.course_code, c.course_name, sem.semester_number, sem.label AS semester_label,
               GROUP_CONCAT(ss.subject_id) AS subject_ids,
               GROUP_CONCAT(sub.subject_code, ', ') AS subject_codes
        FROM students s
        JOIN users u ON u.id = s.user_id
        JOIN courses c ON c.id = s.course_id
        JOIN semesters sem ON sem.id = s.semester_id
        LEFT JOIN student_subjects ss ON ss.student_id = s.id
        LEFT JOIN subjects sub ON sub.id = ss.subject_id
        GROUP BY s.id
        ORDER BY s.roll_number ASC
      `)
      .all();

    res.json({ students });
  } catch (err) {
    console.error('Admin list students error:', err);
    res.status(500).json({ error: 'Failed to load students.' });
  }
});

router.post('/students', (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      roll_number,
      full_name,
      email,
      phone,
      password,
      course_id,
      semester_id,
      batch_year,
      section,
      subject_ids,
    } = req.body as {
      roll_number?: string;
      full_name?: string;
      email?: string;
      phone?: string;
      password?: string;
      course_id?: number;
      semester_id?: number;
      batch_year?: number;
      section?: string;
      subject_ids?: number[];
    };

    if (!roll_number?.trim() || !full_name?.trim() || !email?.trim() || !course_id || !semester_id) {
      res.status(400).json({ error: 'Roll number, full name, email, course, and semester are required.' });
      return;
    }

    const cleanRoll = roll_number.trim().toUpperCase();
    const existing = db
      .prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)')
      .get(cleanRoll, email.trim());
    if (existing) {
      res.status(409).json({ error: 'A user with this roll number or email already exists.' });
      return;
    }

    const rawPassword = password && password.length >= 6 ? password : 'gehu@2026';
    const hash = bcrypt.hashSync(rawPassword, 10);

    const createTx = db.transaction(() => {
      const userRes = db
        .prepare('INSERT INTO users (username, password_hash, role, full_name, email, phone) VALUES (?, ?, ?, ?, ?, ?)')
        .run(cleanRoll, hash, 'student', full_name.trim(), email.trim(), phone?.trim() || null);

      const stuRes = db
        .prepare(`
          INSERT INTO students (user_id, roll_number, course_id, semester_id, batch_year, section, admission_date)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          userRes.lastInsertRowid,
          cleanRoll,
          course_id,
          semester_id,
          batch_year || new Date().getFullYear(),
          section?.trim() || 'A',
          new Date().toISOString().slice(0, 10)
        );

      if (Array.isArray(subject_ids) && subject_ids.length > 0) {
        const enroll = db.prepare('INSERT OR IGNORE INTO student_subjects (student_id, subject_id) VALUES (?, ?)');
        for (const subId of subject_ids) {
          enroll.run(stuRes.lastInsertRowid, subId);
        }
      }
      return stuRes.lastInsertRowid;
    });

    const studentId = createTx();
    res.status(201).json({ message: 'Student added successfully.', student_id: studentId });
  } catch (err) {
    console.error('Admin add student error:', err);
    res.status(500).json({ error: 'Failed to create student record.' });
  }
});

router.put('/students/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = Number(req.params.id);
    const { full_name, email, phone, course_id, semester_id, batch_year, section, subject_ids } = req.body as {
      full_name?: string;
      email?: string;
      phone?: string;
      course_id?: number;
      semester_id?: number;
      batch_year?: number;
      section?: string;
      subject_ids?: number[];
    };

    const existing = db.prepare('SELECT id, user_id FROM students WHERE id = ?').get(studentId) as
      | { id: number; user_id: number }
      | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Student not found.' });
      return;
    }

    if (!full_name?.trim() || !email?.trim() || !course_id || !semester_id) {
      res.status(400).json({ error: 'Full name, email, course, and semester are required.' });
      return;
    }

    const updateTx = db.transaction(() => {
      db.prepare('UPDATE users SET full_name = ?, email = ?, phone = ? WHERE id = ?').run(
        full_name.trim(),
        email.trim(),
        phone?.trim() || null,
        existing.user_id
      );
      db.prepare('UPDATE students SET course_id = ?, semester_id = ?, batch_year = ?, section = ? WHERE id = ?').run(
        course_id,
        semester_id,
        batch_year || new Date().getFullYear(),
        section?.trim() || 'A',
        studentId
      );

      if (Array.isArray(subject_ids)) {
        db.prepare('DELETE FROM student_subjects WHERE student_id = ?').run(studentId);
        const enroll = db.prepare('INSERT OR IGNORE INTO student_subjects (student_id, subject_id) VALUES (?, ?)');
        for (const subId of subject_ids) {
          enroll.run(studentId, subId);
        }
      }
    });

    updateTx();
    res.json({ message: 'Student updated successfully.' });
  } catch (err) {
    console.error('Admin update student error:', err);
    res.status(500).json({ error: 'Failed to update student record.' });
  }
});

router.delete('/students/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = Number(req.params.id);
    const existing = db.prepare('SELECT user_id FROM students WHERE id = ?').get(studentId) as
      | { user_id: number }
      | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Student not found.' });
      return;
    }

    // Deleting the user cascades to students, student_subjects, marks, results, revaluation_requests
    db.prepare('DELETE FROM users WHERE id = ?').run(existing.user_id);
    res.json({ message: 'Student record deleted.' });
  } catch (err) {
    console.error('Admin delete student error:', err);
    res.status(500).json({ error: 'Failed to delete student record.' });
  }
});

// ============================================================================
// FACULTY MANAGEMENT
// ============================================================================
router.get('/faculty', (_req: AuthenticatedRequest, res: Response) => {
  try {
    const faculty = db
      .prepare(`
        SELECT f.id AS faculty_id, f.faculty_code, f.department, f.designation, f.joining_date,
               u.id AS user_id, u.full_name, u.email, u.phone, u.username,
               GROUP_CONCAT(fs.subject_id) AS subject_ids,
               GROUP_CONCAT(sub.subject_code, ', ') AS subject_codes
        FROM faculty f
        JOIN users u ON u.id = f.user_id
        LEFT JOIN faculty_subjects fs ON fs.faculty_id = f.id
        LEFT JOIN subjects sub ON sub.id = fs.subject_id
        GROUP BY f.id
        ORDER BY f.faculty_code ASC
      `)
      .all();

    res.json({ faculty });
  } catch (err) {
    console.error('Admin list faculty error:', err);
    res.status(500).json({ error: 'Failed to load faculty members.' });
  }
});

router.post('/faculty', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { faculty_code, full_name, email, phone, password, department, designation, subject_ids } = req.body as {
      faculty_code?: string;
      full_name?: string;
      email?: string;
      phone?: string;
      password?: string;
      department?: string;
      designation?: string;
      subject_ids?: number[];
    };

    if (!faculty_code?.trim() || !full_name?.trim() || !email?.trim() || !department?.trim() || !designation?.trim()) {
      res.status(400).json({ error: 'Faculty code, name, email, department, and designation are required.' });
      return;
    }

    const cleanCode = faculty_code.trim().toUpperCase();
    const existing = db
      .prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)')
      .get(cleanCode, email.trim());
    if (existing) {
      res.status(409).json({ error: 'A faculty or user with this code or email already exists.' });
      return;
    }

    const hash = bcrypt.hashSync(password && password.length >= 6 ? password : 'gehu@2026', 10);

    const createTx = db.transaction(() => {
      const userRes = db
        .prepare('INSERT INTO users (username, password_hash, role, full_name, email, phone) VALUES (?, ?, ?, ?, ?, ?)')
        .run(cleanCode, hash, 'faculty', full_name.trim(), email.trim(), phone?.trim() || null);

      const facRes = db
        .prepare(`
          INSERT INTO faculty (user_id, faculty_code, department, designation, joining_date)
          VALUES (?, ?, ?, ?, ?)
        `)
        .run(userRes.lastInsertRowid, cleanCode, department.trim(), designation.trim(), new Date().toISOString().slice(0, 10));

      if (Array.isArray(subject_ids) && subject_ids.length > 0) {
        const assign = db.prepare('INSERT OR IGNORE INTO faculty_subjects (faculty_id, subject_id) VALUES (?, ?)');
        for (const subId of subject_ids) {
          assign.run(facRes.lastInsertRowid, subId);
        }
      }
      return facRes.lastInsertRowid;
    });

    const facultyId = createTx();
    res.status(201).json({ message: 'Faculty member added successfully.', faculty_id: facultyId });
  } catch (err) {
    console.error('Admin add faculty error:', err);
    res.status(500).json({ error: 'Failed to add faculty member.' });
  }
});

router.put('/faculty/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const facultyId = Number(req.params.id);
    const { full_name, email, phone, department, designation, subject_ids } = req.body as {
      full_name?: string;
      email?: string;
      phone?: string;
      department?: string;
      designation?: string;
      subject_ids?: number[];
    };

    const existing = db.prepare('SELECT id, user_id FROM faculty WHERE id = ?').get(facultyId) as
      | { id: number; user_id: number }
      | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Faculty member not found.' });
      return;
    }

    if (!full_name?.trim() || !email?.trim() || !department?.trim() || !designation?.trim()) {
      res.status(400).json({ error: 'Full name, email, department, and designation are required.' });
      return;
    }

    const updateTx = db.transaction(() => {
      db.prepare('UPDATE users SET full_name = ?, email = ?, phone = ? WHERE id = ?').run(
        full_name.trim(),
        email.trim(),
        phone?.trim() || null,
        existing.user_id
      );
      db.prepare('UPDATE faculty SET department = ?, designation = ? WHERE id = ?').run(
        department.trim(),
        designation.trim(),
        facultyId
      );

      if (Array.isArray(subject_ids)) {
        db.prepare('DELETE FROM faculty_subjects WHERE faculty_id = ?').run(facultyId);
        const assign = db.prepare('INSERT OR IGNORE INTO faculty_subjects (faculty_id, subject_id) VALUES (?, ?)');
        for (const subId of subject_ids) {
          assign.run(facultyId, subId);
        }
      }
    });

    updateTx();
    res.json({ message: 'Faculty record updated successfully.' });
  } catch (err) {
    console.error('Admin update faculty error:', err);
    res.status(500).json({ error: 'Failed to update faculty record.' });
  }
});

router.delete('/faculty/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const facultyId = Number(req.params.id);
    const existing = db.prepare('SELECT user_id FROM faculty WHERE id = ?').get(facultyId) as
      | { user_id: number }
      | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Faculty member not found.' });
      return;
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(existing.user_id);
    res.json({ message: 'Faculty record deleted.' });
  } catch (err) {
    console.error('Admin delete faculty error:', err);
    res.status(500).json({ error: 'Failed to delete faculty member.' });
  }
});

// ============================================================================
// SUBJECT MANAGEMENT
// ============================================================================
router.get('/subjects', (_req: AuthenticatedRequest, res: Response) => {
  try {
    const subjects = db
      .prepare(`
        SELECT sub.*, c.course_code, c.course_name, sem.semester_number, sem.label AS semester_label,
               GROUP_CONCAT(DISTINCT u.full_name) AS faculty_names,
               COUNT(DISTINCT ss.student_id) AS enrolled_count
        FROM subjects sub
        JOIN courses c ON c.id = sub.course_id
        JOIN semesters sem ON sem.id = sub.semester_id
        LEFT JOIN faculty_subjects fs ON fs.subject_id = sub.id
        LEFT JOIN faculty f ON f.id = fs.faculty_id
        LEFT JOIN users u ON u.id = f.user_id
        LEFT JOIN student_subjects ss ON ss.subject_id = sub.id
        GROUP BY sub.id
        ORDER BY sem.semester_number ASC, sub.subject_code ASC
      `)
      .all();

    res.json({ subjects });
  } catch (err) {
    console.error('Admin list subjects error:', err);
    res.status(500).json({ error: 'Failed to load subjects.' });
  }
});

router.post('/subjects', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { subject_code, subject_name, course_id, semester_id, credits, max_marks, passing_marks } = req.body as {
      subject_code?: string;
      subject_name?: string;
      course_id?: number;
      semester_id?: number;
      credits?: number;
      max_marks?: number;
      passing_marks?: number;
    };

    if (!subject_code?.trim() || !subject_name?.trim() || !course_id || !semester_id) {
      res.status(400).json({ error: 'Subject code, name, course, and semester are required.' });
      return;
    }

    const cleanCode = subject_code.trim().toUpperCase();
    const existing = db.prepare('SELECT id FROM subjects WHERE LOWER(subject_code) = LOWER(?)').get(cleanCode);
    if (existing) {
      res.status(409).json({ error: `Subject code ${cleanCode} already exists.` });
      return;
    }

    const result = db
      .prepare(`
        INSERT INTO subjects (subject_code, subject_name, course_id, semester_id, credits, max_marks, passing_marks)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        cleanCode,
        subject_name.trim(),
        course_id,
        semester_id,
        Number(credits) > 0 ? Number(credits) : 4,
        Number(max_marks) > 0 ? Number(max_marks) : 100,
        Number(passing_marks) >= 0 ? Number(passing_marks) : 40
      );

    res.status(201).json({ message: 'Subject created successfully.', id: result.lastInsertRowid });
  } catch (err) {
    console.error('Admin create subject error:', err);
    res.status(500).json({ error: 'Failed to create subject.' });
  }
});

router.put('/subjects/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const subjectId = Number(req.params.id);
    const { subject_code, subject_name, course_id, semester_id, credits, max_marks, passing_marks } = req.body as {
      subject_code?: string;
      subject_name?: string;
      course_id?: number;
      semester_id?: number;
      credits?: number;
      max_marks?: number;
      passing_marks?: number;
    };

    if (!subject_code?.trim() || !subject_name?.trim() || !course_id || !semester_id) {
      res.status(400).json({ error: 'Subject code, name, course, and semester are required.' });
      return;
    }

    db.prepare(`
      UPDATE subjects
      SET subject_code = ?, subject_name = ?, course_id = ?, semester_id = ?, credits = ?, max_marks = ?, passing_marks = ?
      WHERE id = ?
    `).run(
      subject_code.trim().toUpperCase(),
      subject_name.trim(),
      course_id,
      semester_id,
      Number(credits) || 4,
      Number(max_marks) || 100,
      Number(passing_marks) ?? 40,
      subjectId
    );

    res.json({ message: 'Subject updated successfully.' });
  } catch (err) {
    console.error('Admin update subject error:', err);
    res.status(500).json({ error: 'Failed to update subject.' });
  }
});

router.delete('/subjects/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const subjectId = Number(req.params.id);
    const result = db.prepare('DELETE FROM subjects WHERE id = ?').run(subjectId);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Subject not found.' });
      return;
    }
    res.json({ message: 'Subject deleted.' });
  } catch (err) {
    console.error('Admin delete subject error:', err);
    res.status(500).json({ error: 'Failed to delete subject.' });
  }
});

// ============================================================================
// EXAMINATION SCHEDULE MANAGEMENT & CONFLICT CHECKING
// ============================================================================
router.get('/schedules', (_req: AuthenticatedRequest, res: Response) => {
  try {
    const schedules = db
      .prepare(`
        SELECT e.*, sub.subject_code, sub.subject_name, sub.course_id, sub.semester_id,
               c.course_code, sem.semester_number, sem.label AS semester_label
        FROM examinations e
        JOIN subjects sub ON sub.id = e.subject_id
        JOIN courses c ON c.id = sub.course_id
        JOIN semesters sem ON sem.id = sub.semester_id
        ORDER BY e.exam_date ASC, e.exam_time ASC
      `)
      .all();

    res.json({ schedules });
  } catch (err) {
    console.error('Admin schedules error:', err);
    res.status(500).json({ error: 'Failed to load examination schedules.' });
  }
});

router.post('/schedules', (req: AuthenticatedRequest, res: Response) => {
  try {
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
      res.status(400).json({ error: 'All examination fields are required.' });
      return;
    }

    const subjectRow = db
      .prepare('SELECT id, course_id, semester_id, max_marks FROM subjects WHERE id = ?')
      .get(subject_id) as { id: number; course_id: number; semester_id: number; max_marks: number } | undefined;

    if (!subjectRow) {
      res.status(404).json({ error: 'Selected subject does not exist.' });
      return;
    }

    // Room conflict check
    const roomConflict = db
      .prepare('SELECT id, exam_title FROM examinations WHERE exam_date = ? AND exam_time = ? AND LOWER(room_number) = LOWER(?)')
      .get(exam_date, exam_time.trim(), room_number.trim()) as { id: number; exam_title: string } | undefined;

    if (roomConflict) {
      res.status(409).json({
        error: `Timetable Conflict: Room ${room_number.trim()} is already reserved for "${roomConflict.exam_title}" on ${exam_date} (${exam_time.trim()}).`,
      });
      return;
    }

    // Same-semester & same-date-time conflict check
    const semesterConflict = db
      .prepare(`
        SELECT e.exam_title, sub.subject_code
        FROM examinations e
        JOIN subjects sub ON sub.id = e.subject_id
        WHERE sub.course_id = ? AND sub.semester_id = ? AND e.exam_date = ? AND e.exam_time = ?
      `)
      .get(subjectRow.course_id, subjectRow.semester_id, exam_date, exam_time.trim()) as
      | { exam_title: string; subject_code: string }
      | undefined;

    if (semesterConflict) {
      res.status(409).json({
        error: `Timetable Conflict: Students in this course & semester already have "${semesterConflict.subject_code}" scheduled on ${exam_date} at ${exam_time.trim()}.`,
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

    res.status(201).json({ message: 'Examination scheduled successfully.', id: result.lastInsertRowid });
  } catch (err) {
    console.error('Admin add schedule error:', err);
    res.status(500).json({ error: 'Failed to create examination schedule.' });
  }
});

router.put('/schedules/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const examId = Number(req.params.id);
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
      res.status(400).json({ error: 'All examination fields are required.' });
      return;
    }

    const roomConflict = db
      .prepare(
        'SELECT id, exam_title FROM examinations WHERE id != ? AND exam_date = ? AND exam_time = ? AND LOWER(room_number) = LOWER(?)'
      )
      .get(examId, exam_date, exam_time.trim(), room_number.trim()) as { id: number; exam_title: string } | undefined;

    if (roomConflict) {
      res.status(409).json({
        error: `Timetable Conflict: Room ${room_number.trim()} is already booked by "${roomConflict.exam_title}".`,
      });
      return;
    }

    db.prepare(`
      UPDATE examinations
      SET subject_id = ?, exam_title = ?, exam_type = ?, exam_date = ?, exam_time = ?, room_number = ?, max_marks = ?
      WHERE id = ?
    `).run(
      subject_id,
      exam_title.trim(),
      exam_type,
      exam_date,
      exam_time.trim(),
      room_number.trim(),
      Number(max_marks) || 100,
      examId
    );

    res.json({ message: 'Examination schedule updated.' });
  } catch (err) {
    console.error('Admin update schedule error:', err);
    res.status(500).json({ error: 'Failed to update schedule.' });
  }
});

router.delete('/schedules/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const examId = Number(req.params.id);
    const result = db.prepare('DELETE FROM examinations WHERE id = ?').run(examId);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Examination schedule not found.' });
      return;
    }
    res.json({ message: 'Examination schedule deleted.' });
  } catch (err) {
    console.error('Admin delete schedule error:', err);
    res.status(500).json({ error: 'Failed to delete schedule.' });
  }
});

// ============================================================================
// MARKS & RESULTS PUBLICATION
// ============================================================================
router.get('/results', (_req: AuthenticatedRequest, res: Response) => {
  try {
    const results = db
      .prepare(`
        SELECT r.id AS result_id, r.student_id, r.subject_id, r.examination_id,
               r.obtained_marks, r.max_marks, r.grade, r.result_status, r.is_published, r.published_at,
               s.roll_number, u.full_name AS student_name,
               sub.subject_code, sub.subject_name, sub.passing_marks,
               sem.semester_number, sem.label AS semester_label,
               e.exam_title, e.exam_type, e.exam_date
        FROM results r
        JOIN students s ON s.id = r.student_id
        JOIN users u ON u.id = s.user_id
        JOIN subjects sub ON sub.id = r.subject_id
        JOIN semesters sem ON sem.id = sub.semester_id
        JOIN examinations e ON e.id = r.examination_id
        ORDER BY r.is_published ASC, sem.semester_number ASC, s.roll_number ASC
      `)
      .all();

    res.json({ results });
  } catch (err) {
    console.error('Admin results error:', err);
    res.status(500).json({ error: 'Failed to load student marks and results.' });
  }
});

router.post('/results/publish', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { result_ids } = req.body as { result_ids?: number[] };

    if (!Array.isArray(result_ids) || result_ids.length === 0) {
      res.status(400).json({ error: 'Select at least one result record to publish.' });
      return;
    }

    const publishTx = db.transaction(() => {
      const stmt = db.prepare(`
        UPDATE results
        SET is_published = 1, published_at = datetime('now'), published_by = ?
        WHERE id = ?
      `);
      let count = 0;
      for (const id of result_ids) {
        const info = stmt.run(req.user!.id, id);
        count += info.changes;
      }
      return count;
    });

    const publishedCount = publishTx();
    res.json({ message: `${publishedCount} result(s) published successfully.` });
  } catch (err) {
    console.error('Publish results error:', err);
    res.status(500).json({ error: 'Failed to publish results.' });
  }
});

router.put('/results/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const resultId = Number(req.params.id);
    const { obtained_marks } = req.body as { obtained_marks?: number };

    const row = db
      .prepare(`
        SELECT r.id, r.student_id, r.subject_id, r.examination_id, r.max_marks, sub.passing_marks
        FROM results r
        JOIN subjects sub ON sub.id = r.subject_id
        WHERE r.id = ?
      `)
      .get(resultId) as
      | {
          id: number;
          student_id: number;
          subject_id: number;
          examination_id: number;
          max_marks: number;
          passing_marks: number;
        }
      | undefined;

    if (!row) {
      res.status(404).json({ error: 'Result record not found.' });
      return;
    }

    const score = Number(obtained_marks);
    if (Number.isNaN(score) || score < 0 || score > row.max_marks) {
      res.status(400).json({ error: `Marks must be between 0 and ${row.max_marks}.` });
      return;
    }

    const { grade, result_status } = calculateGradeAndStatus(score, row.max_marks, row.passing_marks);

    const updateTx = db.transaction(() => {
      db.prepare('UPDATE results SET obtained_marks = ?, grade = ?, result_status = ? WHERE id = ?').run(
        score,
        grade,
        result_status,
        resultId
      );
      db.prepare(`
        UPDATE marks SET obtained_marks = ?, updated_at = datetime('now')
        WHERE student_id = ? AND subject_id = ? AND examination_id = ?
      `).run(score, row.student_id, row.subject_id, row.examination_id);
    });

    updateTx();
    res.json({ message: 'Result marks updated.', grade, result_status });
  } catch (err) {
    console.error('Admin update result error:', err);
    res.status(500).json({ error: 'Failed to update result.' });
  }
});

// ============================================================================
// REVALUATION ADMINISTRATION & TRANSACTIONAL HISTORY
// ============================================================================
router.get('/revaluations', (_req: AuthenticatedRequest, res: Response) => {
  try {
    const requests = db
      .prepare(`
        SELECT rr.*,
               s.roll_number, stu_u.full_name AS student_name,
               sub.subject_code, sub.subject_name, sub.passing_marks,
               e.exam_title, e.exam_type, e.max_marks,
               fac.faculty_code, fac_u.full_name AS assigned_faculty_name
        FROM revaluation_requests rr
        JOIN students s ON s.id = rr.student_id
        JOIN users stu_u ON stu_u.id = s.user_id
        JOIN subjects sub ON sub.id = rr.subject_id
        JOIN examinations e ON e.id = rr.examination_id
        LEFT JOIN faculty fac ON fac.id = rr.assigned_faculty_id
        LEFT JOIN users fac_u ON fac_u.id = fac.user_id
        ORDER BY rr.submitted_at DESC, rr.id DESC
      `)
      .all();

    const history = db
      .prepare(`
        SELECT rh.*, u.full_name AS changed_by_name, sub.subject_code, s.roll_number
        FROM revaluation_history rh
        JOIN revaluation_requests rr ON rr.id = rh.revaluation_request_id
        JOIN students s ON s.id = rr.student_id
        JOIN subjects sub ON sub.id = rr.subject_id
        LEFT JOIN users u ON u.id = rh.changed_by
        ORDER BY rh.changed_at DESC, rh.id DESC
      `)
      .all();

    res.json({ revaluations: requests, history });
  } catch (err) {
    console.error('Admin revaluations error:', err);
    res.status(500).json({ error: 'Failed to load revaluation requests.' });
  }
});

router.put('/revaluations/:id/assign', (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestId = Number(req.params.id);
    const { faculty_id } = req.body as { faculty_id?: number };

    if (!faculty_id) {
      res.status(400).json({ error: 'Please select a faculty member to assign.' });
      return;
    }

    const facExists = db.prepare('SELECT id FROM faculty WHERE id = ?').get(faculty_id);
    if (!facExists) {
      res.status(404).json({ error: 'Selected faculty member does not exist.' });
      return;
    }

    const result = db
      .prepare(`
        UPDATE revaluation_requests
        SET assigned_faculty_id = ?, status = 'Under Review', updated_at = datetime('now')
        WHERE id = ?
      `)
      .run(faculty_id, requestId);

    if (result.changes === 0) {
      res.status(404).json({ error: 'Revaluation request not found.' });
      return;
    }

    res.json({ message: 'Revaluation request assigned to faculty for review.' });
  } catch (err) {
    console.error('Assign revaluation error:', err);
    res.status(500).json({ error: 'Failed to assign revaluation request.' });
  }
});

/**
 * POST /api/admin/revaluations/:id/decide
 * Approve & publish revised marks (atomically via SQLite transaction + history log) OR Reject request
 */
router.post('/revaluations/:id/decide', (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestId = Number(req.params.id);
    const { decision, revised_marks, admin_remarks } = req.body as {
      decision?: 'approve_publish' | 'reject';
      revised_marks?: number;
      admin_remarks?: string;
    };

    if (!decision || !['approve_publish', 'reject'].includes(decision)) {
      res.status(400).json({ error: 'Invalid decision action.' });
      return;
    }

    const reqRow = db
      .prepare(`
        SELECT rr.*, r.obtained_marks AS current_result_marks, r.max_marks, r.grade AS current_grade, sub.passing_marks
        FROM revaluation_requests rr
        JOIN results r ON r.id = rr.result_id
        JOIN subjects sub ON sub.id = rr.subject_id
        WHERE rr.id = ?
      `)
      .get(requestId) as
      | {
          id: number;
          student_id: number;
          result_id: number;
          subject_id: number;
          examination_id: number;
          original_marks: number;
          current_result_marks: number;
          max_marks: number;
          current_grade: string;
          passing_marks: number;
        }
      | undefined;

    if (!reqRow) {
      res.status(404).json({ error: 'Revaluation request not found.' });
      return;
    }

    if (decision === 'reject') {
      db.prepare(`
        UPDATE revaluation_requests
        SET status = 'Rejected', admin_remarks = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(admin_remarks?.trim() || 'No change in marks after verification.', requestId);

      res.json({ message: 'Revaluation request marked as Rejected.' });
      return;
    }

    // Approve & Publish Revised Marks inside a Transaction
    const finalScore = Number(revised_marks);
    if (Number.isNaN(finalScore) || finalScore < 0 || finalScore > reqRow.max_marks) {
      res.status(400).json({ error: `Revised marks must be between 0 and ${reqRow.max_marks}.` });
      return;
    }

    const { grade: newGrade, result_status: newStatus } = calculateGradeAndStatus(
      finalScore,
      reqRow.max_marks,
      reqRow.passing_marks
    );

    const publishRevisedTx = db.transaction(() => {
      db.prepare(`
        UPDATE results
        SET obtained_marks = ?, grade = ?, result_status = ?, is_published = 1,
            published_at = datetime('now'), published_by = ?
        WHERE id = ?
      `).run(finalScore, newGrade, newStatus, req.user!.id, reqRow.result_id);

      db.prepare(`
        UPDATE marks
        SET obtained_marks = ?, updated_at = datetime('now')
        WHERE student_id = ? AND subject_id = ? AND examination_id = ?
      `).run(finalScore, reqRow.student_id, reqRow.subject_id, reqRow.examination_id);

      db.prepare(`
        UPDATE revaluation_requests
        SET revised_marks = ?, status = 'Completed', admin_remarks = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(finalScore, admin_remarks?.trim() || 'Revised marks approved and published.', requestId);

      db.prepare(`
        INSERT INTO revaluation_history (
          revaluation_request_id, result_id, previous_marks, new_marks, previous_grade, new_grade, changed_by, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        requestId,
        reqRow.result_id,
        reqRow.current_result_marks,
        finalScore,
        reqRow.current_grade,
        newGrade,
        req.user!.id,
        admin_remarks?.trim() || 'Revised result published.'
      );
    });

    publishRevisedTx();
    res.json({
      message: 'Revised marks approved, published, and logged to revaluation history.',
      new_grade: newGrade,
      new_status: newStatus,
    });
  } catch (err) {
    console.error('Admin decide revaluation error:', err);
    res.status(500).json({ error: 'Failed to process revaluation decision.' });
  }
});

// ============================================================================
// SYSTEM REPORTS
// ============================================================================
router.get('/reports', (_req: AuthenticatedRequest, res: Response) => {
  try {
    const courseDistribution = db
      .prepare(`
        SELECT c.course_code, c.course_name, COUNT(s.id) AS student_count
        FROM courses c
        LEFT JOIN students s ON s.course_id = c.id
        GROUP BY c.id
      `)
      .all();

    const facultyWorkload = db
      .prepare(`
        SELECT f.faculty_code, u.full_name, f.department, COUNT(fs.subject_id) AS subject_count
        FROM faculty f
        JOIN users u ON u.id = f.user_id
        LEFT JOIN faculty_subjects fs ON fs.faculty_id = f.id
        GROUP BY f.id
      `)
      .all();

    const resultStats = db
      .prepare(`
        SELECT
          COUNT(*) AS total_results,
          SUM(CASE WHEN is_published = 1 THEN 1 ELSE 0 END) AS published_count,
          SUM(CASE WHEN is_published = 1 AND result_status = 'Pass' THEN 1 ELSE 0 END) AS pass_count,
          SUM(CASE WHEN is_published = 1 AND result_status = 'Fail' THEN 1 ELSE 0 END) AS fail_count
        FROM results
      `)
      .get();

    const revaluationStats = db
      .prepare(`
        SELECT status, COUNT(*) AS count
        FROM revaluation_requests
        GROUP BY status
      `)
      .all();

    res.json({
      course_distribution: courseDistribution,
      faculty_workload: facultyWorkload,
      result_stats: resultStats,
      revaluation_stats: revaluationStats,
    });
  } catch (err) {
    console.error('Admin reports error:', err);
    res.status(500).json({ error: 'Failed to generate reports.' });
  }
});

export default router;

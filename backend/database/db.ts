import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const DB_PATH = process.env.DB_PATH || path.resolve(process.cwd(), 'esms.db');
const SCHEMA_PATH = path.resolve(process.cwd(), 'database', 'schema.sql');

// Create and configure the SQLite database connection
export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Helper: Calculate university letter grade and Pass/Fail status from marks
 */
export function calculateGradeAndStatus(
  obtainedMarks: number,
  maxMarks: number,
  passingMarks: number = 40
): { grade: string; result_status: 'Pass' | 'Fail' } {
  const percentage = maxMarks > 0 ? (obtainedMarks / maxMarks) * 100 : 0;
  const passThresholdPct = maxMarks > 0 ? (passingMarks / maxMarks) * 100 : 40;

  if (percentage < passThresholdPct) {
    return { grade: 'F', result_status: 'Fail' };
  }
  if (percentage >= 90) return { grade: 'O', result_status: 'Pass' };
  if (percentage >= 80) return { grade: 'A+', result_status: 'Pass' };
  if (percentage >= 70) return { grade: 'A', result_status: 'Pass' };
  if (percentage >= 60) return { grade: 'B+', result_status: 'Pass' };
  if (percentage >= 50) return { grade: 'B', result_status: 'Pass' };
  return { grade: 'C', result_status: 'Pass' };
}

/**
 * Initialize schema from database/schema.sql and seed demo data if empty
 */
export function initializeDatabase(): void {
  const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schemaSql);

  const userCountRow = db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number };
  if (userCountRow.count > 0) {
    return; // Database already seeded; preserve existing records across restarts
  }

  console.log('Seeding initial GEHU ESMS database records...');

  const demoPasswordHash = bcrypt.hashSync('gehu@2026', 10);

  const seedTransaction = db.transaction(() => {
    // 1. Seed Courses
    db.prepare(`
      INSERT INTO courses (id, course_code, course_name, department, duration_years) VALUES
      (1, 'BT-CSE', 'B.Tech Computer Science & Engineering', 'School of Computing', 4),
      (2, 'BCA', 'Bachelor of Computer Applications', 'School of Computing', 3)
    `).run();

    // 2. Seed Semesters
    db.prepare(`
      INSERT INTO semesters (id, semester_number, academic_year, label) VALUES
      (1, 2, '2026-27', 'Semester II (2026-27)'),
      (2, 4, '2026-27', 'Semester IV (2026-27)'),
      (3, 6, '2026-27', 'Semester VI (2026-27)')
    `).run();

    // 3. Seed Users (Admin, Faculty, Students)
    const insertUser = db.prepare(`
      INSERT INTO users (username, password_hash, role, full_name, email, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const adminUser = insertUser.run(
      'admin',
      demoPasswordHash,
      'admin',
      'Controller of Examinations',
      'coe@gehu.ac.in',
      '+91-135-2642727'
    );

    const fac1User = insertUser.run(
      'FAC101',
      demoPasswordHash,
      'faculty',
      'Dr. Rajesh Sharma',
      'rajesh.sharma@gehu.ac.in',
      '+91-9876543210'
    );

    const fac2User = insertUser.run(
      'FAC102',
      demoPasswordHash,
      'faculty',
      'Prof. Meenakshi Rawat',
      'meenakshi.rawat@gehu.ac.in',
      '+91-9876543211'
    );

    const stu1User = insertUser.run(
      'GEHU2024001',
      demoPasswordHash,
      'student',
      'Aarav Bisht',
      'aarav.bisht@student.gehu.ac.in',
      '+91-9811223344'
    );

    const stu2User = insertUser.run(
      'GEHU2024002',
      demoPasswordHash,
      'student',
      'Priya Negi',
      'priya.negi@student.gehu.ac.in',
      '+91-9811223345'
    );

    const stu3User = insertUser.run(
      'GEHU2024003',
      demoPasswordHash,
      'student',
      'Rohan Joshi',
      'rohan.joshi@student.gehu.ac.in',
      '+91-9811223346'
    );

    const stu4User = insertUser.run(
      'GEHU2025004',
      demoPasswordHash,
      'student',
      'Sneha Verma',
      'sneha.verma@student.gehu.ac.in',
      '+91-9811223347'
    );

    // 4. Seed Faculty Profiles
    const insertFaculty = db.prepare(`
      INSERT INTO faculty (user_id, faculty_code, department, designation, joining_date)
      VALUES (?, ?, ?, ?, ?)
    `);
    const fac1 = insertFaculty.run(fac1User.lastInsertRowid, 'FAC101', 'Computer Science & Engineering', 'Associate Professor', '2019-07-15');
    const fac2 = insertFaculty.run(fac2User.lastInsertRowid, 'FAC102', 'Computer Science & Engineering', 'Assistant Professor', '2021-08-01');

    // 5. Seed Student Profiles
    const insertStudent = db.prepare(`
      INSERT INTO students (user_id, roll_number, course_id, semester_id, batch_year, section, admission_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const stu1 = insertStudent.run(stu1User.lastInsertRowid, 'GEHU2024001', 1, 2, 2024, 'A', '2024-08-12');
    const stu2 = insertStudent.run(stu2User.lastInsertRowid, 'GEHU2024002', 1, 2, 2024, 'A', '2024-08-12');
    const stu3 = insertStudent.run(stu3User.lastInsertRowid, 'GEHU2024003', 1, 2, 2024, 'B', '2024-08-14');
    const stu4 = insertStudent.run(stu4User.lastInsertRowid, 'GEHU2025004', 1, 1, 2025, 'A', '2025-08-10');

    // 6. Seed Subjects
    const insertSubject = db.prepare(`
      INSERT INTO subjects (subject_code, subject_name, course_id, semester_id, credits, max_marks, passing_marks)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const sub1 = insertSubject.run('TCS-401', 'Design and Analysis of Algorithms', 1, 2, 4, 100, 40);
    const sub2 = insertSubject.run('TCS-402', 'Database Management Systems', 1, 2, 4, 100, 40);
    const sub3 = insertSubject.run('TCS-403', 'Operating Systems', 1, 2, 4, 100, 40);
    const sub4 = insertSubject.run('TCS-404', 'Object Oriented Programming with C++', 1, 2, 3, 100, 40);
    const sub5 = insertSubject.run('TCS-201', 'Data Structures Using C', 1, 1, 4, 100, 40);
    const sub6 = insertSubject.run('TCS-601', 'Computer Networks', 1, 3, 4, 100, 40);

    // 7. Enroll Students into Subjects
    const enrollStudent = db.prepare(`INSERT INTO student_subjects (student_id, subject_id) VALUES (?, ?)`);
    for (const sId of [stu1.lastInsertRowid, stu2.lastInsertRowid, stu3.lastInsertRowid]) {
      enrollStudent.run(sId, sub1.lastInsertRowid);
      enrollStudent.run(sId, sub2.lastInsertRowid);
      enrollStudent.run(sId, sub3.lastInsertRowid);
      enrollStudent.run(sId, sub4.lastInsertRowid);
    }
    enrollStudent.run(stu4.lastInsertRowid, sub5.lastInsertRowid);

    // 8. Assign Subjects to Faculty
    const assignFaculty = db.prepare(`INSERT INTO faculty_subjects (faculty_id, subject_id) VALUES (?, ?)`);
    assignFaculty.run(fac1.lastInsertRowid, sub1.lastInsertRowid);
    assignFaculty.run(fac1.lastInsertRowid, sub2.lastInsertRowid);
    assignFaculty.run(fac1.lastInsertRowid, sub5.lastInsertRowid);
    assignFaculty.run(fac2.lastInsertRowid, sub3.lastInsertRowid);
    assignFaculty.run(fac2.lastInsertRowid, sub4.lastInsertRowid);
    assignFaculty.run(fac2.lastInsertRowid, sub6.lastInsertRowid);

    // 9. Seed Examinations (Both completed and upcoming dates relative to Nov 2026)
    const insertExam = db.prepare(`
      INSERT INTO examinations (subject_id, exam_title, exam_type, exam_date, exam_time, room_number, max_marks, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const exam1 = insertExam.run(sub1.lastInsertRowid, 'Mid-Term Examination — DAA', 'Mid-Term', '2026-10-12', '09:30 AM - 11:30 AM', 'LT-201', 100, adminUser.lastInsertRowid);
    const exam2 = insertExam.run(sub2.lastInsertRowid, 'Mid-Term Examination — DBMS', 'Mid-Term', '2026-10-14', '09:30 AM - 11:30 AM', 'LT-202', 100, adminUser.lastInsertRowid);
    const exam3 = insertExam.run(sub3.lastInsertRowid, 'End-Term Examination — OS', 'End-Term', '2026-11-24', '10:00 AM - 01:00 PM', 'CR-304', 100, adminUser.lastInsertRowid);
    const exam4 = insertExam.run(sub4.lastInsertRowid, 'End-Term Examination — OOP C++', 'End-Term', '2026-11-27', '10:00 AM - 01:00 PM', 'CR-305', 100, adminUser.lastInsertRowid);
    const exam5 = insertExam.run(sub5.lastInsertRowid, 'Mid-Term Examination — DSA in C', 'Mid-Term', '2026-11-30', '02:00 PM - 04:00 PM', 'LT-105', 100, fac1User.lastInsertRowid);

    // 10. Seed Marks & Published Results for Completed Mid-Term Exams (exam1 & exam2)
    const insertMark = db.prepare(`
      INSERT INTO marks (student_id, subject_id, examination_id, obtained_marks, max_marks, entered_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertResult = db.prepare(`
      INSERT INTO results (student_id, subject_id, examination_id, obtained_marks, max_marks, grade, result_status, is_published, published_at, published_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), ?)
    `);

    const seededScores: Array<[number | bigint, number | bigint, number | bigint, number, number | bigint]> = [
      [stu1.lastInsertRowid, sub1.lastInsertRowid, exam1.lastInsertRowid, 78, fac1User.lastInsertRowid],
      [stu1.lastInsertRowid, sub2.lastInsertRowid, exam2.lastInsertRowid, 64, fac1User.lastInsertRowid],
      [stu2.lastInsertRowid, sub1.lastInsertRowid, exam1.lastInsertRowid, 88, fac1User.lastInsertRowid],
      [stu2.lastInsertRowid, sub2.lastInsertRowid, exam2.lastInsertRowid, 91, fac1User.lastInsertRowid],
      [stu3.lastInsertRowid, sub1.lastInsertRowid, exam1.lastInsertRowid, 35, fac1User.lastInsertRowid],
      [stu3.lastInsertRowid, sub2.lastInsertRowid, exam2.lastInsertRowid, 72, fac1User.lastInsertRowid],
    ];

    let aaravDbmsResultId: number | bigint = 0;

    for (const [sId, subId, exId, score, facUserId] of seededScores) {
      insertMark.run(sId, subId, exId, score, 100, facUserId);
      const { grade, result_status } = calculateGradeAndStatus(score, 100, 40);
      const res = insertResult.run(sId, subId, exId, score, 100, grade, result_status, adminUser.lastInsertRowid);
      if (sId === stu1.lastInsertRowid && subId === sub2.lastInsertRowid) {
        aaravDbmsResultId = res.lastInsertRowid;
      }
    }

    // 11. Seed one sample Revaluation Request (Rohan Joshi in DAA) so Faculty & Admin queues have realistic initial data
    const rohanDaaResult = db.prepare(`
      SELECT id FROM results WHERE student_id = ? AND subject_id = ? AND examination_id = ?
    `).get(stu3.lastInsertRowid, sub1.lastInsertRowid, exam1.lastInsertRowid) as { id: number };

    db.prepare(`
      INSERT INTO revaluation_requests (
        student_id, result_id, subject_id, examination_id,
        original_marks, reason, status, assigned_faculty_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      stu3.lastInsertRowid,
      rohanDaaResult.id,
      sub1.lastInsertRowid,
      exam1.lastInsertRowid,
      35,
      'Section B Question 4 (Dynamic Programming) partial steps appear unchecked in total tally.',
      'Under Review',
      fac1.lastInsertRowid
    );

    // Keep Aarav's DBMS result clean (no active revaluation yet) so Aarav can immediately test submitting one!
    void aaravDbmsResultId;
    void exam3;
    void exam4;
    void exam5;
  });

  seedTransaction();
  console.log('Initial GEHU ESMS database seeding complete.');
}

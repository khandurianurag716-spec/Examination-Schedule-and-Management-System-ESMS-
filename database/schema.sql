-- ============================================================================
-- EXAMINATION SCHEDULE AND MANAGEMENT SYSTEM (ESMS)
-- Graphic Era Hill University (GEHU) - B.Tech CSE PBL Project
-- Database Schema (SQLite / Standard SQL)
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 1. Users Table (Central authentication for Student, Faculty, and Admin)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'faculty', 'admin')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Courses Table
CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_code TEXT NOT NULL UNIQUE,
  course_name TEXT NOT NULL,
  department TEXT NOT NULL,
  duration_years INTEGER NOT NULL DEFAULT 4 CHECK (duration_years > 0)
);

-- 3. Semesters Table
CREATE TABLE IF NOT EXISTS semesters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  semester_number INTEGER NOT NULL CHECK (semester_number BETWEEN 1 AND 8),
  academic_year TEXT NOT NULL,
  label TEXT NOT NULL,
  UNIQUE (semester_number, academic_year)
);

-- 4. Students Table
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  roll_number TEXT NOT NULL UNIQUE,
  course_id INTEGER NOT NULL,
  semester_id INTEGER NOT NULL,
  batch_year INTEGER NOT NULL,
  section TEXT NOT NULL DEFAULT 'A',
  admission_date TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT,
  FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE RESTRICT
);

-- 5. Faculty Table
CREATE TABLE IF NOT EXISTS faculty (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  faculty_code TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL,
  designation TEXT NOT NULL,
  joining_date TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_code TEXT NOT NULL UNIQUE,
  subject_name TEXT NOT NULL,
  course_id INTEGER NOT NULL,
  semester_id INTEGER NOT NULL,
  credits INTEGER NOT NULL DEFAULT 4 CHECK (credits > 0),
  max_marks INTEGER NOT NULL DEFAULT 100 CHECK (max_marks > 0),
  passing_marks INTEGER NOT NULL DEFAULT 40 CHECK (passing_marks >= 0),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT,
  FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE RESTRICT
);

-- 7. Student-Subject Enrollment (Many-to-Many)
CREATE TABLE IF NOT EXISTS student_subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  subject_id INTEGER NOT NULL,
  enrolled_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (student_id, subject_id),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- 8. Faculty-Subject Assignment (Many-to-Many)
CREATE TABLE IF NOT EXISTS faculty_subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  faculty_id INTEGER NOT NULL,
  subject_id INTEGER NOT NULL,
  assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (faculty_id, subject_id),
  FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- 9. Examinations Schedule Table
CREATE TABLE IF NOT EXISTS examinations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER NOT NULL,
  exam_title TEXT NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('Mid-Term', 'End-Term', 'Practical', 'Back Paper')),
  exam_date TEXT NOT NULL,
  exam_time TEXT NOT NULL,
  room_number TEXT NOT NULL,
  max_marks INTEGER NOT NULL DEFAULT 100 CHECK (max_marks > 0),
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (subject_id, exam_type, exam_date),
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 10. Marks Table (Raw marks entered by faculty)
CREATE TABLE IF NOT EXISTS marks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  subject_id INTEGER NOT NULL,
  examination_id INTEGER NOT NULL,
  obtained_marks REAL NOT NULL CHECK (obtained_marks >= 0),
  max_marks REAL NOT NULL CHECK (max_marks > 0),
  entered_by INTEGER,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (student_id, subject_id, examination_id),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (examination_id) REFERENCES examinations(id) ON DELETE CASCADE,
  FOREIGN KEY (entered_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 11. Results Table (Official published or draft results)
CREATE TABLE IF NOT EXISTS results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  subject_id INTEGER NOT NULL,
  examination_id INTEGER NOT NULL,
  obtained_marks REAL NOT NULL CHECK (obtained_marks >= 0),
  max_marks REAL NOT NULL CHECK (max_marks > 0),
  grade TEXT NOT NULL,
  result_status TEXT NOT NULL CHECK (result_status IN ('Pass', 'Fail')),
  is_published INTEGER NOT NULL DEFAULT 0 CHECK (is_published IN (0, 1)),
  published_at TEXT,
  published_by INTEGER,
  UNIQUE (student_id, subject_id, examination_id),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (examination_id) REFERENCES examinations(id) ON DELETE CASCADE,
  FOREIGN KEY (published_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 12. Revaluation Requests Table
CREATE TABLE IF NOT EXISTS revaluation_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  result_id INTEGER NOT NULL,
  subject_id INTEGER NOT NULL,
  examination_id INTEGER NOT NULL,
  original_marks REAL NOT NULL,
  revised_marks REAL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Under Review', 'Approved', 'Rejected', 'Completed')),
  assigned_faculty_id INTEGER,
  faculty_remarks TEXT,
  faculty_recommended_marks REAL,
  admin_remarks TEXT,
  submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (result_id) REFERENCES results(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (examination_id) REFERENCES examinations(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_faculty_id) REFERENCES faculty(id) ON DELETE SET NULL
);

-- 13. Revaluation History Table (Audit trail of original & revised marks)
CREATE TABLE IF NOT EXISTS revaluation_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  revaluation_request_id INTEGER NOT NULL,
  result_id INTEGER NOT NULL,
  previous_marks REAL NOT NULL,
  new_marks REAL NOT NULL,
  previous_grade TEXT NOT NULL,
  new_grade TEXT NOT NULL,
  changed_by INTEGER,
  remarks TEXT,
  changed_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (revaluation_request_id) REFERENCES revaluation_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (result_id) REFERENCES results(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 14. Sessions Table (Server-side persistent authentication tokens)
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

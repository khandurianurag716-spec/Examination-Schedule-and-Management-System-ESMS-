-- ============================================================================
-- SAMPLE SEED DATA REFERENCE FOR ESMS (GEHU)
-- Note: Password hashes are generated dynamically via bcryptjs in
-- backend/database/db.ts during initial database setup.
-- Demo password for all initial seeded accounts: gehu@2026
-- ============================================================================

INSERT OR IGNORE INTO courses (id, course_code, course_name, department, duration_years) VALUES
  (1, 'BT-CSE', 'B.Tech Computer Science & Engineering', 'School of Computing', 4),
  (2, 'BCA', 'Bachelor of Computer Applications', 'School of Computing', 3);

INSERT OR IGNORE INTO semesters (id, semester_number, academic_year, label) VALUES
  (1, 2, '2026-27', 'Semester II (2026-27)'),
  (2, 4, '2026-27', 'Semester IV (2026-27)'),
  (3, 6, '2026-27', 'Semester VI (2026-27)');

INSERT OR IGNORE INTO subjects (id, subject_code, subject_name, course_id, semester_id, credits, max_marks, passing_marks) VALUES
  (1, 'TCS-401', 'Design and Analysis of Algorithms', 1, 2, 4, 100, 40),
  (2, 'TCS-402', 'Database Management Systems', 1, 2, 4, 100, 40),
  (3, 'TCS-403', 'Operating Systems', 1, 2, 4, 100, 40),
  (4, 'TCS-404', 'Object Oriented Programming with C++', 1, 2, 3, 100, 40),
  (5, 'TCS-201', 'Data Structures Using C', 1, 1, 4, 100, 40),
  (6, 'TCS-601', 'Computer Networks', 1, 3, 4, 100, 40);

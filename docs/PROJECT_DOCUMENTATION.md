# Project Documentation & Viva Preparation Guide
## Graphic Era Hill University — Examination Schedule and Management System (GEHU-ESMS)

---

## 1. Project Introduction
The **Examination Schedule and Management System (GEHU-ESMS)** is a centralized web-based university portal designed for **Graphic Era Hill University (GEHU)**. It streamlines academic examination workflows across three distinct user roles: **Student**, **Faculty**, and **Admin (Controller of Examinations)**.

## 2. Problem Statement
Manual examination management using spreadsheets and paper notices causes timetable room clashes, delayed result publication, scattered student records, and opaque revaluation tracking without an audit trail. Universities require a unified database-backed system where schedules, marks, and revaluations remain consistent and role-protected.

## 3. Project Objectives
- Maintain centralized relational SQL records for students, faculty, courses, semesters, and subjects.
- Provide secure role-based authentication using bcrypt password hashing and persistent server-side sessions.
- Automate timetable conflict detection for rooms and semester schedules.
- Enforce strict permission boundaries so students cannot edit marks and faculty cannot bypass administrative result publication.
- Implement a complete end-to-end revaluation workflow with an immutable history log.
- Demonstrate core Computer Science fundamentals using C (DSA) and C++ (OOP).

## 4. Technologies Used
- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express.js (`server.ts`)
- **Database**: SQLite (`better-sqlite3`) with 14 normalized tables and foreign keys
- **Security**: `bcryptjs` password hashing, token-based persistent sessions, role middleware
- **Academic Foundations**: C (`gcc`) for DSA, C++ (`g++`) for OOP

## 5. System Architecture
GEHU-ESMS follows a three-tier client-server architecture:
1. **Presentation Layer (`src/`)**: Role-specific dashboards communicating over REST JSON APIs with Bearer token authentication.
2. **Application Layer (`backend/` & `server.ts`)**: Express routes divided into `authRoutes`, `studentRoutes`, `facultyRoutes`, and `adminRoutes`, protected by `requireAuth` and `requireRole`.
3. **Data Layer (`database/schema.sql` & `esms.db`)**: Relational SQLite database using transactions (`db.transaction`) for multi-table atomic updates.

## 6. Database Tables and Relationships
1. `users`: Stores login credentials (`username`, `password_hash`), `role`, and contact details.
2. `courses` & `semesters`: Academic programs (e.g., `BT-CSE`) and semester terms.
3. `students` & `faculty`: Role-specific profiles linked `1:1` to `users`.
4. `subjects`: Course subjects with `subject_code`, `credits`, `max_marks`, and `passing_marks`.
5. `student_subjects` & `faculty_subjects`: Many-to-many junction tables linking students and faculty to subjects.
6. `examinations`: Examination timetable entries linked to `subjects`, enforcing `UNIQUE(subject_id, exam_type, exam_date)`.
7. `marks`: Raw marks entered by faculty (`0 <= obtained_marks <= max_marks`).
8. `results`: Official grade and pass/fail status with `is_published` flag (`0` = Draft, `1` = Published).
9. `revaluation_requests`: Tracks student revaluation requests (`Pending` -> `Under Review` -> `Completed`/`Rejected`).
10. `revaluation_history`: Preserves previous and revised marks/grades whenever an Admin publishes revised marks.
11. `sessions`: Persistent server-side authentication tokens.

## 7. Four-Member Team Module Division
- **Member 1 (Student Module)**: Login view, `studentRoutes.ts`, `StudentDashboard`, `StudentProfile`, `StudentSubjects`, `StudentSchedule`, `StudentResults`, `StudentRevaluation`.
- **Member 2 (Faculty Module)**: `facultyRoutes.ts`, `FacultyDashboard`, `FacultyStudents`, `FacultySubjects`, `FacultySchedules`, `FacultyMarks`, `FacultyRevaluation`.
- **Member 3 (Admin Module)**: `adminRoutes.ts`, `AdminDashboard`, `AdminStudents`, `AdminFaculty`, `AdminSubjects`, `AdminSchedules`, `AdminResults`, `AdminRevaluation`, `AdminReports`.
- **Member 4 (DSA, Database & Integration)**: `database/schema.sql`, `backend/database/db.ts`, `dsa/dsa.c`, `oop/*.cpp`, `server.ts`, end-to-end integration and testing.

---

## 8. DSA Concepts in C (`dsa/dsa.h`, `dsa/dsa.c`)

### 1. Arrays & Traversal
- **What it means**: Storing fixed-size records sequentially in contiguous memory and visiting each element with a loop.
- **Why we used it**: Simple, fast (`O(1)` index access) storage for student and subject batches.
- **Where used**: `displayStudentsArray()` and `displaySubjectsArray()` in `dsa/dsa.c`.
- **Example**:
  ```c
  for (int i = 0; i < count; i++) {
      printf("%s - %s\n", subjects[i].subject_code, subjects[i].subject_name);
  }
  ```

### 2. Linear Search
- **What it means**: Checking elements one by one from start to end until a match is found (`O(n)` time).
- **Why we used it**: Works on unsorted arrays without preprocessing.
- **Where used**: `linearSearchStudentByRoll()` and `linearSearchSubjectByCode()` in `dsa/dsa.c`.
- **Example**:
  ```c
  if (strcmp(students[i].roll_number, target_roll) == 0) return i;
  ```

### 3. Bubble Sort
- **What it means**: Repeatedly comparing adjacent elements and swapping them if they are out of order (`O(n^2)` worst-case).
- **Why we used it**: Beginner-friendly sorting algorithm to order subject codes alphabetically.
- **Where used**: `bubbleSortSubjectsByCode()` in `dsa/dsa.c`.
- **Example**:
  ```c
  if (strcmp(subjects[j].subject_code, subjects[j + 1].subject_code) > 0) {
      SubjectRecord temp = subjects[j];
      subjects[j] = subjects[j + 1];
      subjects[j + 1] = temp;
  }
  ```

### 4. Singly Linked List
- **What it means**: Dynamic collection of heap-allocated nodes where each node stores data and a `next` pointer.
- **Why we used it**: Allows adding examination entries dynamically at runtime without fixed array limits.
- **Where used**: `createExamNode()`, `insertExamAtEnd()`, `traverseExamList()`, `freeExamList()` in `dsa/dsa.c`.
- **Example**:
  ```c
  ExamNode* node = (ExamNode*)malloc(sizeof(ExamNode));
  node->next = NULL;
  ```

---

## 9. OOP Concepts in C++ (`oop/`)

### 1. Classes, Objects & Encapsulation
- **What it means**: Bundling data and functions inside a class while protecting internal fields using `private`/`protected` access specifiers.
- **Why we used it**: Prevents unauthorized direct modification of user attributes like `rollNumber` or `facultyCode`.
- **Where used**: `User`, `Student`, `Faculty`, `Admin` classes.

### 2. Constructors
- **What it means**: Special member functions automatically invoked when an object is created to initialize attributes cleanly.
- **Where used**: `Student::Student(...) : User(id, name, mail), ...`.

### 3. Inheritance
- **What it means**: Creating specialized child classes (`Student`, `Faculty`, `Admin`) that reuse common attributes from a base class (`User`).
- **Where used**: `class Student : public User`, `class Faculty : public User`, `class Admin : public User`.

### 4. Function Overriding & Runtime Polymorphism
- **What it means**: Declaring a `virtual` function in the base class (`User::displayRoleDashboard()`) and overriding it in child classes so the correct method runs at runtime through a `User*` base pointer.
- **Where used**: `oop/main.cpp` iterates over `User* portalUsers[3]` and calls `portalUsers[i]->displayRoleDashboard()`.

---

## 10. Authentication & Revaluation Workflow
- **Authentication**: Passwords are never stored in plain text. `bcryptjs` hashes passwords during seeding and student/faculty creation. Login generates a random 256-bit token stored in SQLite `sessions`.
- **Revaluation Workflow**:
  1. Student opens published marksheet and submits a request (`Pending`).
  2. Admin assigns the request to an evaluator (`Under Review`).
  3. Faculty verifies the script and submits recommended marks and remarks.
  4. Admin approves and publishes revised marks inside an atomic SQLite transaction (`db.transaction`), updating `results`, `marks`, `revaluation_requests` (`Completed`), and inserting an audit row into `revaluation_history`.

---

## 11. Viva Questions & Answers

1. **Q: Why did you choose SQLite instead of storing data in JSON files?**  
   **A:** SQLite enforces relational integrity using primary keys, foreign keys, `CHECK` constraints, `UNIQUE` constraints, and atomic transactions (`db.transaction`), which prevents corrupted or duplicate records.

2. **Q: How are passwords secured in ESMS?**  
   **A:** Passwords are hashed using `bcryptjs` with salt rounds before storage in the `users` table. During login, `bcrypt.compareSync` verifies the entered password against the stored hash.

3. **Q: How do you prevent a student from accessing Admin APIs?**  
   **A:** Every backend route uses `requireAuth` (validating the Bearer token against `sessions`) followed by `requireRole('admin')`, which returns HTTP `403 Forbidden` if a student or faculty token calls an Admin endpoint.

4. **Q: Why do you use a database transaction when publishing revised revaluation marks?**  
   **A:** Publishing revised marks updates four tables (`results`, `marks`, `revaluation_requests`, and `revaluation_history`). A transaction guarantees either all four succeed together or none are applied if an error occurs.

5. **Q: What happens if a faculty member enters marks greater than `max_marks` or negative marks?**  
   **A:** Both the frontend input validation and the backend `/api/faculty/marks` handler reject negative values or scores exceeding `max_marks` with HTTP `400 Bad Request`.

6. **Q: What is the difference between `is_published = 0` and `is_published = 1` in `results`?**  
   **A:** Faculty save marks as unpublished drafts (`is_published = 0`). Students can only view results where `is_published = 1`, which only the Admin can authorize.

7. **Q: Why did you include C and C++ modules alongside the Node.js web app?**  
   **A:** To satisfy academic evaluation for Data Structures & Algorithms in C (arrays, linear search, bubble sort, singly linked list with `malloc`/`free`) and Object-Oriented Programming in C++ (encapsulation, inheritance, runtime polymorphism).

8. **Q: How do you prevent memory leaks in your C Singly Linked List?**  
   **A:** After traversing the schedule list, `freeExamList(&examHead)` iterates through every node and calls `free()` before setting `head` to `NULL`.

9. **Q: What is runtime polymorphism in your C++ module?**  
   **A:** `User::displayRoleDashboard()` is declared `virtual`. When a `User*` pointer points to a `Student`, `Faculty`, or `Admin` object, C++ resolves the overridden function at runtime via the vtable.

10. **Q: What is the future scope of GEHU-ESMS?**  
    **A:** Automated PDF admit card generation, hall seating arrangement algorithms, email/SMS alerts for published results, and biometric/QR exam attendance.

# GEHU Examination Schedule and Management System (GEHU-ESMS)

**Graphic Era Hill University (GEHU) — B.Tech CSE Project-Based Learning (PBL)**

A university Examination Schedule and Management System developed for **Graphic Era Hill University**. The project is organized into four independent team modules covering Web Frontend, Backend, SQLite Relational Database, C Data Structures & Algorithms, and C++ Object-Oriented Programming.

---

## Project Structure

```text
ESMS/
├── backend/
│   ├── database/db.ts
│   ├── middleware/auth.ts
│   └── routes/
│       ├── authRoutes.ts
│       ├── studentRoutes.ts
│       ├── facultyRoutes.ts
│       └── adminRoutes.ts
├── database/
│   ├── schema.sql
│   └── seed.sql
├── dsa/
│   ├── dsa.h
│   └── dsa.c
├── oop/
│   ├── User.h / User.cpp
│   ├── Student.h / Student.cpp
│   ├── Faculty.h / Faculty.cpp
│   ├── Admin.h / Admin.cpp
│   └── main.cpp
├── public/
├── src/
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── LoginPage.tsx
│   │   ├── student/
│   │   ├── faculty/
│   │   ├── admin/
│   │   └── ui/
│   ├── services/
│   └── types/esms.ts
├── docs/
│   └── PROJECT_DOCUMENTATION.md
├── server.ts
├── package.json
└── .env.example
```

---

## Official University Logo Setup

Place the official **Graphic Era Hill University** logo image at:

```text
public/gehu-logo.png
```

The logo is displayed on the login page, portal header, sidebar, student printable marksheets, and university administration reports while maintaining its original aspect ratio.

---

## Installation & Running Locally

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` (optional; default settings are provided).

```bash
cp .env.example .env
```

### 3. Start the Application

```bash
npm run dev
```

The application starts at:

```text
http://localhost:3000
```

On the first run, the database connection file initializes the database using `database/schema.sql` and inserts the initial demo accounts into `esms.db`.

### 4. Build & Type-Check

```bash
npm run lint
npm run build
```

---

## Demo Accounts (Evaluation & Viva)

The initial accounts use securely hashed passwords stored in the database.

| Role | ID / Username | Password | Name |
|---|---|---|---|
| **Admin** | `admin` | `gehu@2026` | Controller of Examinations |
| **Faculty** | `FAC101` | `gehu@2026` | Dr. Rajesh Sharma |
| **Faculty** | `FAC102` | `gehu@2026` | Prof. Meenakshi Rawat |
| **Student** | `GEHU2024001` | `gehu@2026` | Aarav Bisht (Sem IV) |
| **Student** | `GEHU2024002` | `gehu@2026` | Priya Negi (Sem IV) |
| **Student** | `GEHU2024003` | `gehu@2026` | Rohan Joshi (Sem IV) |

---

## Compiling & Running C DSA and C++ OOP Modules

### C Data Structures & Algorithms (`dsa/`)

```bash
gcc dsa/dsa.c -o dsa_demo
./dsa_demo
```

### C++ Object-Oriented Programming (`oop/`)

```bash
g++ oop/User.cpp oop/Student.cpp oop/Faculty.cpp oop/Admin.cpp oop/main.cpp -o oop_demo
./oop_demo
```

---

## End-to-End Testing Checklist

1. **Workflow 1 (Admin):** Log in as `admin`, create a new student, add a faculty member, create a subject, assign the subject, and verify updated dashboard counts.

2. **Workflow 2 (Faculty):** Log in as `FAC101`, view assigned subjects and students, schedule an examination, and enter marks. Verify that negative or over-maximum marks are rejected.

3. **Workflow 3 (Student):** Log in as `GEHU2024001`, check the profile, enrolled subjects, examination schedule filters, and published marksheet.

4. **Workflow 4 (Revaluation):** Log in as `GEHU2024001` and submit a revaluation request for `TCS-402`. Log in as `admin` to assign it to `FAC101`. Log in as `FAC101` to submit recommended marks and remarks. Finally, log in as `admin` to approve and publish revised marks, then verify the updated result and `Completed` status using the student account.

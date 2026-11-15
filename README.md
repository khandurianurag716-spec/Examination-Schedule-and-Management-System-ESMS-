# GEHU Examination Schedule and Management System (GEHU-ESMS)

**Graphic Era Hill University (GEHU) — B.Tech CSE Project-Based Learning (PBL)**

A full-stack university Examination Schedule and Management System built for **Graphic Era Hill University**, organized cleanly into four independent team modules covering Web Frontend, Backend APIs, SQLite Relational Database, C Data Structures & Algorithms, and C++ Object-Oriented Programming.

---

## Project Structure

```text
ESMS/
├── backend/
│   ├── database/db.ts          # SQLite connection, schema init & bcrypt seed
│   ├── middleware/auth.ts      # Session token verification & role-based guards
│   └── routes/
│       ├── authRoutes.ts       # Common login, logout, session validation
│       ├── studentRoutes.ts    # Member 1: Student APIs
│       ├── facultyRoutes.ts    # Member 2: Faculty APIs
│       └── adminRoutes.ts      # Member 3: Admin APIs & transactional revaluation
├── database/
│   ├── schema.sql              # 14 normalized SQL tables with FKs & constraints
│   └── seed.sql                # Reference seed data for courses & subjects
├── dsa/
│   ├── dsa.h                   # C structures & DSA prototypes
│   └── dsa.c                   # Arrays, Linear Search, Bubble Sort, Singly Linked List
├── oop/
│   ├── User.h / User.cpp       # Base class (Encapsulation & virtual methods)
│   ├── Student.h / Student.cpp # Derived Student class
│   ├── Faculty.h / Faculty.cpp # Derived Faculty class
│   ├── Admin.h / Admin.cpp     # Derived Admin class
│   └── main.cpp                # Runtime polymorphism demonstration
├── public/                     # Place official GEHU logo here as gehu-logo.png
├── src/
│   ├── components/
│   │   ├── Layout.tsx          # Portal shell, sidebar & header
│   │   ├── LoginPage.tsx       # Role-based university login
│   │   ├── student/            # Member 1 UI components
│   │   ├── faculty/            # Member 2 UI components
│   │   ├── admin/              # Member 3 UI components
│   │   └── ui/                 # GehuLogo, StatusIndicator, ConfirmDialog
│   ├── services/api.ts         # Fetch helper with Bearer session auth
│   └── types/esms.ts           # TypeScript domain interfaces
├── docs/
│   └── PROJECT_DOCUMENTATION.md # Complete project report & Viva Q&A
├── server.ts                   # Express + Vite server entrypoint (Port 3000)
├── package.json
└── .env.example
```

---

## Official University Logo Setup

Place the exact official **Graphic Era Hill University** logo image at:

```text
public/gehu-logo.png
```

Once placed there, the logo is automatically displayed with its original aspect ratio on the login page, portal header/sidebar, student printable marksheets, and university administration reports.

---

## Installation & Running Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` (optional; sensible defaults are built in):
```bash
cp .env.example .env
```

### 3. Start the Application (Backend + Frontend + SQLite Auto-Seed)
```bash
npm run dev
```
The server starts on `http://localhost:3000`. On first run, `backend/database/db.ts` executes `database/schema.sql` and seeds initial demo accounts into `esms.db`.

### 4. Build & Type-Check
```bash
npm run lint
npm run build
```

---

## Seeded Demo Accounts (Evaluation & Viva)

All initial seeded accounts use bcrypt-hashed passwords stored in `esms.db`.

| Role | ID / Username | Password | Name |
| :--- | :--- | :--- | :--- |
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

1. **Workflow 1 (Admin)**: Log in as `admin`, create a new student, add a faculty member, create a subject, assign the subject, and verify updated dashboard counts.
2. **Workflow 2 (Faculty)**: Log in as `FAC101`, view assigned subjects and students, schedule an examination, and enter marks (verify negative or over-max marks are rejected).
3. **Workflow 3 (Student)**: Log in as `GEHU2024001`, check profile, enrolled subjects, examination schedule filters, and published marksheet.
4. **Workflow 4 (Revaluation)**: As `GEHU2024001`, submit a revaluation request for `TCS-402`; log in as `admin` to assign it to `FAC101`; log in as `FAC101` to submit recommended marks & remarks; log in as `admin` to approve & publish revised marks; log in as `GEHU2024001` to verify the updated result and `Completed` status.

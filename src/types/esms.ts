export type UserRole = 'student' | 'faculty' | 'admin';

export interface AuthUser {
  id: number;
  username: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string | null;
  student_id?: number;
  roll_number?: string;
  faculty_id?: number;
  faculty_code?: string;
}

export interface Course {
  id: number;
  course_code: string;
  course_name: string;
  department: string;
  duration_years: number;
}

export interface Semester {
  id: number;
  semester_number: number;
  academic_year: string;
  label: string;
}

export interface SubjectItem {
  id: number;
  subject_code: string;
  subject_name: string;
  course_id: number;
  semester_id: number;
  credits: number;
  max_marks: number;
  passing_marks: number;
  course_code?: string;
  course_name?: string;
  semester_number?: number;
  semester_label?: string;
  faculty_names?: string | null;
  enrolled_count?: number;
  enrolled_students_count?: number;
}

export interface ExamScheduleItem {
  id: number;
  subject_id: number;
  exam_title: string;
  exam_type: 'Mid-Term' | 'End-Term' | 'Practical' | 'Back Paper';
  exam_date: string;
  exam_time: string;
  room_number: string;
  max_marks: number;
  subject_code: string;
  subject_name: string;
  course_id?: number;
  semester_id?: number;
  course_code?: string;
  semester_number?: number;
  semester_label?: string;
  schedule_status?: 'Upcoming' | 'Completed';
}

export interface ResultItem {
  result_id: number;
  student_id: number;
  subject_id: number;
  examination_id: number;
  obtained_marks: number;
  max_marks: number;
  grade: string;
  result_status: 'Pass' | 'Fail';
  is_published: number;
  published_at: string | null;
  roll_number?: string;
  student_name?: string;
  subject_code: string;
  subject_name: string;
  credits?: number;
  passing_marks?: number;
  semester_number: number;
  semester_label: string;
  exam_title: string;
  exam_type: string;
  exam_date: string;
  revaluation_status?: string | null;
}

export type RevaluationStatus = 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Completed';

export interface RevaluationRequestItem {
  id: number;
  student_id: number;
  result_id: number;
  subject_id: number;
  examination_id: number;
  original_marks: number;
  revised_marks: number | null;
  reason: string;
  status: RevaluationStatus;
  assigned_faculty_id: number | null;
  faculty_remarks: string | null;
  faculty_recommended_marks: number | null;
  admin_remarks: string | null;
  submitted_at: string;
  updated_at: string;
  roll_number?: string;
  student_name?: string;
  subject_code: string;
  subject_name: string;
  exam_title: string;
  exam_type: string;
  max_marks: number;
  current_grade?: string;
  current_result_status?: string;
  assigned_faculty_name?: string | null;
  faculty_code?: string | null;
}

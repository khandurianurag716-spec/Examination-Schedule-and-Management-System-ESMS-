import { useEffect, useState } from 'react';
import { BookOpen, Users, Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../services/api';

interface FacultyDashboardData {
  profile: {
    faculty_id: number;
    faculty_code: string;
    department: string;
    designation: string;
    full_name: string;
    email: string;
  };
  summary: {
    assigned_subjects: number;
    total_students: number;
    upcoming_exams: number;
    pending_revaluations: number;
  };
  upcoming_exams: Array<{
    id: number;
    exam_title: string;
    exam_type: string;
    exam_date: string;
    exam_time: string;
    room_number: string;
    subject_code: string;
    subject_name: string;
  }>;
}

interface FacultyDashboardProps {
  onNavigate: (tab: string) => void;
}

export function FacultyDashboard({ onNavigate }: FacultyDashboardProps) {
  const [data, setData] = useState<FacultyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<FacultyDashboardData>('/api/faculty/dashboard')
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load faculty dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>{error || 'Failed to load faculty overview.'}</span>
      </div>
    );
  }

  const { profile, summary, upcoming_exams } = data;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {profile.full_name}
          </h1>
          <p className="mt-1 text-sm text-slate-600 tabular-nums">
            Faculty ID <span className="font-mono font-medium text-slate-900">{profile.faculty_code}</span>
            <span className="mx-2 text-slate-300">·</span>
            <span>{profile.designation}</span>
            <span className="mx-2 text-slate-300">·</span>
            <span>{profile.department}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('marks')}
          className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          Enter Student Marks
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-medium">Assigned Subjects</span>
            <BookOpen className="w-4 h-4 text-blue-700" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{summary.assigned_subjects}</p>
          <p className="mt-1 text-xs text-slate-500">Active teaching courses</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-medium">Assigned Students</span>
            <Users className="w-4 h-4 text-blue-700" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{summary.total_students}</p>
          <p className="mt-1 text-xs text-slate-500">Enrolled across subjects</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-medium">Upcoming Exams</span>
            <Calendar className="w-4 h-4 text-blue-700" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{summary.upcoming_exams}</p>
          <p className="mt-1 text-xs text-slate-500">Scheduled for your courses</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-medium">Revaluation Queue</span>
            <RefreshCw className="w-4 h-4 text-blue-700" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{summary.pending_revaluations}</p>
          <p className="mt-1 text-xs text-slate-500">Assigned for verification</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Upcoming Subject Examinations</h2>
          <button
            type="button"
            onClick={() => onNavigate('schedules')}
            className="text-xs font-medium text-blue-700 hover:text-blue-900 whitespace-nowrap"
          >
            Manage Schedules
          </button>
        </div>
        {upcoming_exams.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No upcoming examinations scheduled for your assigned subjects.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                  <th className="py-2.5 px-4">Subject</th>
                  <th className="py-2.5 px-4">Title</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Date &amp; Time</th>
                  <th className="py-2.5 px-4">Room</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {upcoming_exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{exam.subject_name}</div>
                      <div className="text-xs font-mono text-slate-500">{exam.subject_code}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{exam.exam_title}</td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{exam.exam_type}</td>
                    <td className="py-3 px-4 tabular-nums">
                      <div className="text-slate-900">{exam.exam_date}</div>
                      <div className="text-xs text-slate-500">{exam.exam_time}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-800 whitespace-nowrap">
                      {exam.room_number}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Calendar, BookOpen, Award, RefreshCw, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { StatusIndicator } from '../ui/StatusIndicator';

interface DashboardData {
  profile: {
    full_name: string;
    roll_number: string;
    course_code: string;
    course_name: string;
    semester_label: string;
    section: string;
    batch_year: number;
  };
  summary: {
    total_subjects: number;
    upcoming_exams_count: number;
    active_revaluations: number;
    total_revaluations: number;
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
  latest_result: {
    obtained_marks: number;
    max_marks: number;
    grade: string;
    result_status: string;
    subject_code: string;
    subject_name: string;
    exam_type: string;
  } | null;
  latest_revaluation: {
    id: number;
    status: string;
    submitted_at: string;
    subject_code: string;
    subject_name: string;
  } | null;
}

interface StudentDashboardProps {
  onNavigate: (tab: string) => void;
}

export function StudentDashboard({ onNavigate }: StudentDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiRequest<DashboardData>('/api/student/dashboard')
      .then((res) => {
        if (active) setData(res);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load dashboard.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
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
      <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800 flex items-center gap-2.5">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>{error || 'Failed to load student overview.'}</span>
      </div>
    );
  }

  const { profile, summary, upcoming_exams, latest_result, latest_revaluation } = data;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Welcome, {profile.full_name}
          </h1>
          <p className="mt-1 text-sm text-slate-600 tabular-nums">
            Roll No. <span className="font-mono font-medium text-slate-900">{profile.roll_number}</span>
            <span className="mx-2 text-slate-300">·</span>
            <span>{profile.course_name}</span>
            <span className="mx-2 text-slate-300">·</span>
            <span>{profile.semester_label}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('schedule')}
          className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          View Exam Timetable
        </button>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-medium">Enrolled Subjects</span>
            <BookOpen className="w-4 h-4 text-blue-700" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{summary.total_subjects}</p>
          <p className="mt-1 text-xs text-slate-500">Current academic registration</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-medium">Upcoming Exams</span>
            <Calendar className="w-4 h-4 text-blue-700" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{summary.upcoming_exams_count}</p>
          <p className="mt-1 text-xs text-slate-500">
            {upcoming_exams[0] ? `Next: ${upcoming_exams[0].exam_date}` : 'No upcoming exams'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-medium">Latest Result</span>
            <Award className="w-4 h-4 text-blue-700" aria-hidden="true" />
          </div>
          {latest_result ? (
            <>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">
                {latest_result.obtained_marks}/{latest_result.max_marks}
              </p>
              <p className="mt-1 text-xs text-slate-500 truncate">
                {latest_result.subject_code} · Grade {latest_result.grade}
              </p>
            </>
          ) : (
            <>
              <p className="text-xl font-semibold text-slate-400">Pending</p>
              <p className="mt-1 text-xs text-slate-500">No published results yet</p>
            </>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-medium">Revaluation Requests</span>
            <RefreshCw className="w-4 h-4 text-blue-700" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{summary.total_revaluations}</p>
          <p className="mt-1 text-xs text-slate-500 truncate">
            {latest_revaluation
              ? `${latest_revaluation.subject_code} · ${latest_revaluation.status}`
              : 'No requests submitted'}
          </p>
        </div>
      </div>

      {/* Upcoming Examinations & Latest Revaluation Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Upcoming Examinations</h2>
            <button
              type="button"
              onClick={() => onNavigate('schedule')}
              className="text-xs font-medium text-blue-700 hover:text-blue-900 whitespace-nowrap"
            >
              Full Schedule
            </button>
          </div>
          {upcoming_exams.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No upcoming examinations are scheduled for your enrolled subjects.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                    <th className="py-2.5 px-4">Subject</th>
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
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{exam.exam_type}</td>
                      <td className="py-3 px-4 tabular-nums">
                        <div className="text-slate-900">{exam.exam_date}</div>
                        <div className="text-xs text-slate-500">{exam.exam_time}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                        {exam.room_number}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-4">Academic Status</h2>
            <div className="space-y-4">
              <div className="pb-4 border-b border-slate-100">
                <p className="text-xs text-slate-500 mb-1">Latest Published Result</p>
                {latest_result ? (
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{latest_result.subject_name}</p>
                      <p className="text-xs text-slate-500 tabular-nums">
                        {latest_result.subject_code} · {latest_result.obtained_marks}/{latest_result.max_marks}
                      </p>
                    </div>
                    <StatusIndicator status={latest_result.result_status} />
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Awaiting published marksheet.</p>
                )}
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1">Latest Revaluation Request</p>
                {latest_revaluation ? (
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{latest_revaluation.subject_name}</p>
                      <p className="text-xs text-slate-500 tabular-nums">
                        Submitted {latest_revaluation.submitted_at.slice(0, 10)}
                      </p>
                    </div>
                    <StatusIndicator status={latest_revaluation.status} />
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No active revaluation requests.</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('results')}
              className="flex-1 py-2 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              View Marksheet
            </button>
            <button
              type="button"
              onClick={() => onNavigate('revaluation')}
              className="flex-1 py-2 px-3 text-xs font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-lg transition-colors whitespace-nowrap"
            >
              Revaluation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

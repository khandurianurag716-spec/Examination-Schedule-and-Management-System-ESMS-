import { useEffect, useState } from 'react';
import { Users, GraduationCap, BookOpen, Calendar, Award, RefreshCw, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { StatusIndicator } from '../ui/StatusIndicator';

interface AdminDashboardData {
  summary: {
    total_students: number;
    total_faculty: number;
    total_subjects: number;
    total_examinations: number;
    published_results: number;
    pending_revaluations: number;
  };
  grade_breakdown: Array<{ grade: string; count: number }>;
  recent_revaluations: Array<{
    id: number;
    status: string;
    original_marks: number;
    revised_marks: number | null;
    submitted_at: string;
    roll_number: string;
    student_name: string;
    subject_code: string;
  }>;
}

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<AdminDashboardData>('/api/admin/dashboard')
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load admin dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
        <span>{error || 'Failed to load admin overview.'}</span>
      </div>
    );
  }

  const { summary, grade_breakdown, recent_revaluations } = data;
  const maxGradeCount = Math.max(1, ...grade_breakdown.map((g) => g.count));

  const cards = [
    { label: 'Total Students', value: summary.total_students, icon: <GraduationCap className="w-4 h-4 text-blue-700" />, tab: 'students' },
    { label: 'Total Faculty', value: summary.total_faculty, icon: <Users className="w-4 h-4 text-blue-700" />, tab: 'faculty' },
    { label: 'Total Subjects', value: summary.total_subjects, icon: <BookOpen className="w-4 h-4 text-blue-700" />, tab: 'subjects' },
    { label: 'Examinations', value: summary.total_examinations, icon: <Calendar className="w-4 h-4 text-blue-700" />, tab: 'schedules' },
    { label: 'Published Results', value: summary.published_results, icon: <Award className="w-4 h-4 text-blue-700" />, tab: 'results' },
    { label: 'Pending Revaluations', value: summary.pending_revaluations, icon: <RefreshCw className="w-4 h-4 text-blue-700" />, tab: 'revaluation' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Controller of Examinations — Administration
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Graphic Era Hill University · Centralized Examination Records &amp; Result Control
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('reports')}
          className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          View University Reports
        </button>
      </div>

      {/* 6 Database-Backed Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={() => onNavigate(card.tab)}
            className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-5 text-left transition-colors"
          >
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-medium">{card.label}</span>
              {card.icon}
            </div>
            <p className="text-2xl font-bold text-slate-900 tabular-nums">{card.value}</p>
          </button>
        ))}
      </div>

      {/* Grade Distribution Chart + Recent Revaluation Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-slate-900">Published Result Grade Distribution</h2>
          <p className="text-xs text-slate-500 mt-0.5 mb-5">
            Live breakdown across all published university subject results
          </p>

          {grade_breakdown.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No published results yet.</p>
          ) : (
            <div className="space-y-3">
              {grade_breakdown.map((item) => {
                const widthPct = Math.round((item.count / maxGradeCount) * 100);
                return (
                  <div key={item.grade} className="flex items-center gap-3 text-sm">
                    <span className="w-8 font-mono font-semibold text-slate-800">{item.grade}</span>
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-700 rounded-full"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                    <span className="w-10 text-right font-mono text-xs text-slate-700 tabular-nums">
                      {item.count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Recent Revaluation Requests</h2>
            <button
              type="button"
              onClick={() => onNavigate('revaluation')}
              className="text-xs font-medium text-blue-700 hover:text-blue-900 whitespace-nowrap"
            >
              Manage All
            </button>
          </div>
          {recent_revaluations.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No revaluation requests have been submitted yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                    <th className="py-2.5 px-4">Student</th>
                    <th className="py-2.5 px-4">Subject</th>
                    <th className="py-2.5 px-4 text-right">Marks</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {recent_revaluations.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{req.student_name}</div>
                        <div className="text-xs font-mono text-slate-500">{req.roll_number}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700">{req.subject_code}</td>
                      <td className="py-3 px-4 text-right tabular-nums text-slate-900">
                        {req.revised_marks !== null ? `${req.original_marks} → ${req.revised_marks}` : req.original_marks}
                      </td>
                      <td className="py-3 px-4">
                        <StatusIndicator status={req.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { AlertCircle, Printer } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { GehuLogo } from '../ui/GehuLogo';

interface ReportsData {
  course_distribution: Array<{ course_code: string; course_name: string; student_count: number }>;
  faculty_workload: Array<{ faculty_code: string; full_name: string; department: string; subject_count: number }>;
  result_stats: {
    total_results: number;
    published_count: number;
    pass_count: number;
    fail_count: number;
  };
  revaluation_stats: Array<{ status: string; count: number }>;
}

export function AdminReports() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<ReportsData>('/api/admin/reports')
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to generate reports.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse" />;
  }

  if (error || !data) {
    return (
      <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>{error || 'Failed to load reports.'}</span>
      </div>
    );
  }

  const { course_distribution, faculty_workload, result_stats, revaluation_stats } = data;
  const passRate =
    result_stats.published_count > 0
      ? ((result_stats.pass_count / result_stats.published_count) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-6">
      {/* Official Graphic Era Hill University Report Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <GehuLogo size="lg" className="border border-slate-200" />
          <div>
            <p className="text-xs font-semibold text-blue-800">Graphic Era Hill University</p>
            <h1 className="text-xl font-bold text-slate-900">
              Examination Cell — Consolidated Academic Report
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
              Generated from live SQLite records · {new Date().toISOString().slice(0, 10)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap self-start sm:self-auto print:hidden"
        >
          <Printer className="w-4 h-4" aria-hidden="true" />
          <span>Print Report</span>
        </button>
      </div>

      {/* Results & Pass Rate Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Total Result Entries</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
            {result_stats.total_results || 0}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Published Results</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
            {result_stats.published_count || 0}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Pass / Fail Count</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
            {result_stats.pass_count || 0} / {result_stats.fail_count || 0}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Overall Pass Rate</p>
          <p className="mt-1 text-2xl font-bold text-blue-800 tabular-nums">{passRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Enrollment Report */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">Student Enrollment by Course</h2>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                <th className="py-2.5 px-4">Course Code</th>
                <th className="py-2.5 px-4">Program Name</th>
                <th className="py-2.5 px-4 text-right">Students</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {course_distribution.map((c) => (
                <tr key={c.course_code}>
                  <td className="py-3 px-4 font-mono text-xs font-semibold text-blue-800">
                    {c.course_code}
                  </td>
                  <td className="py-3 px-4 text-slate-900">{c.course_name}</td>
                  <td className="py-3 px-4 text-right font-semibold tabular-nums">{c.student_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Faculty Workload Report */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">Faculty Subject Allocation</h2>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                <th className="py-2.5 px-4">Faculty ID</th>
                <th className="py-2.5 px-4">Name</th>
                <th className="py-2.5 px-4 text-right">Subjects</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {faculty_workload.map((f) => (
                <tr key={f.faculty_code}>
                  <td className="py-3 px-4 font-mono text-xs font-semibold text-blue-800">
                    {f.faculty_code}
                  </td>
                  <td className="py-3 px-4 text-slate-900">{f.full_name}</td>
                  <td className="py-3 px-4 text-right font-semibold tabular-nums">{f.subject_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revaluation Summary */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Revaluation Request Status Summary</h2>
        </div>
        {revaluation_stats.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">No revaluation requests recorded.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-slate-100">
            {revaluation_stats.map((st) => (
              <div key={st.status} className="p-4">
                <p className="text-xs text-slate-500">{st.status}</p>
                <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums">{st.count}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { AlertCircle, Printer, RefreshCw } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { ResultItem } from '../../types/esms';
import { StatusIndicator } from '../ui/StatusIndicator';
import { GehuLogo } from '../ui/GehuLogo';

interface StudentResultsProps {
  onRequestRevaluation: (resultId: number) => void;
}

export function StudentResults({ onRequestRevaluation }: StudentResultsProps) {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [semesterFilter, setSemesterFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<{ results: ResultItem[] }>('/api/student/results')
      .then((res) => setResults(res.results))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load published results.'))
      .finally(() => setLoading(false));
  }, []);

  const semesters = Array.from(new Set(results.map((r) => r.semester_label)));
  const filtered = results.filter((r) => semesterFilter === 'All' || r.semester_label === semesterFilter);

  const totalObtained = filtered.reduce((sum, r) => sum + r.obtained_marks, 0);
  const totalMax = filtered.reduce((sum, r) => sum + r.max_marks, 0);
  const percentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Official University Marksheet Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <GehuLogo size="md" className="border border-slate-200" />
          <div>
            <p className="text-xs font-semibold text-blue-800">Graphic Era Hill University</p>
            <h1 className="text-lg font-bold text-slate-900">Official Statement of Marks</h1>
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap self-start sm:self-auto print:hidden"
        >
          <Printer className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Print Marksheet</span>
        </button>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Published Subjects</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{filtered.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Aggregate Marks</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
            {totalObtained} / {totalMax}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Overall Percentage</p>
          <p className="mt-1 text-2xl font-bold text-blue-800 tabular-nums">{percentage}%</p>
        </div>
      </div>

      {/* Marksheet Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Published Results &amp; Marksheet</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Official university marks published by the Controller of Examinations
            </p>
          </div>

          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            aria-label="Filter results by semester"
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="All">All Semesters</option>
            {semesters.map((sem) => (
              <option key={sem} value={sem}>
                {sem}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="m-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No published results are available yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                  <th className="py-2.5 px-4">Subject</th>
                  <th className="py-2.5 px-4">Exam Type</th>
                  <th className="py-2.5 px-4 text-right">Obtained</th>
                  <th className="py-2.5 px-4 text-right">Max Marks</th>
                  <th className="py-2.5 px-4">Grade</th>
                  <th className="py-2.5 px-4">Result</th>
                  <th className="py-2.5 px-4 text-right">Revaluation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((res) => {
                  const hasActiveReval =
                    res.revaluation_status &&
                    ['Pending', 'Under Review', 'Approved'].includes(res.revaluation_status);

                  return (
                    <tr key={res.result_id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{res.subject_name}</div>
                        <div className="text-xs text-slate-500">
                          <span className="font-mono">{res.subject_code}</span> · {res.semester_label}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{res.exam_type}</td>
                      <td className="py-3 px-4 text-right font-semibold tabular-nums text-slate-900">
                        {res.obtained_marks}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-slate-600">
                        {res.max_marks}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">{res.grade}</td>
                      <td className="py-3 px-4">
                        <StatusIndicator status={res.result_status} />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {hasActiveReval ? (
                          <span className="text-xs font-medium text-blue-700">
                            {res.revaluation_status}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onRequestRevaluation(res.result_id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors whitespace-nowrap"
                          >
                            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Apply</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

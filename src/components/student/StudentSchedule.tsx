import { useEffect, useState } from 'react';
import { AlertCircle, Search } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { ExamScheduleItem } from '../../types/esms';
import { StatusIndicator } from '../ui/StatusIndicator';

export function StudentSchedule() {
  const [schedules, setSchedules] = useState<ExamScheduleItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Upcoming' | 'Completed'>('All');
  const [semesterFilter, setSemesterFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<{ schedules: ExamScheduleItem[] }>('/api/student/schedules')
      .then((res) => setSchedules(res.schedules))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load examination timetable.'))
      .finally(() => setLoading(false));
  }, []);

  const semesters = Array.from(new Set(schedules.map((s) => s.semester_label).filter(Boolean))) as string[];

  const filtered = schedules.filter((item) => {
    if (statusFilter !== 'All' && item.schedule_status !== statusFilter) return false;
    if (semesterFilter !== 'All' && item.semester_label !== semesterFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.subject_code.toLowerCase().includes(q) ||
        item.subject_name.toLowerCase().includes(q) ||
        item.exam_title.toLowerCase().includes(q) ||
        item.room_number.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="p-5 border-b border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Examination Timetable</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Scheduled Mid-Term, End-Term, and Practical examinations for your enrolled subjects
            </p>
          </div>

          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 self-start">
            {(['All', 'Upcoming', 'Completed'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  statusFilter === tab
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by subject code, name, or room..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            aria-label="Filter by semester"
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
          No examination schedules match your selected filters.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                <th className="py-2.5 px-4">Subject</th>
                <th className="py-2.5 px-4">Exam Type</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Time</th>
                <th className="py-2.5 px-4">Room</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.map((exam) => (
                <tr key={exam.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-900">{exam.subject_name}</div>
                    <div className="text-xs text-slate-500">
                      <span className="font-mono">{exam.subject_code}</span> · {exam.semester_label}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{exam.exam_type}</td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-900 tabular-nums whitespace-nowrap">
                    {exam.exam_date}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-700 tabular-nums whitespace-nowrap">
                    {exam.exam_time}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-800 whitespace-nowrap">
                    {exam.room_number}
                  </td>
                  <td className="py-3 px-4">
                    <StatusIndicator status={exam.schedule_status || 'Upcoming'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

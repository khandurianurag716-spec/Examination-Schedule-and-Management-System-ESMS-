import { useEffect, useState } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { SubjectItem } from '../../types/esms';

export function StudentSubjects() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<{ subjects: SubjectItem[] }>('/api/student/subjects')
      .then((res) => setSubjects(res.subjects))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load subjects.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = subjects.filter(
    (s) =>
      s.subject_code.toLowerCase().includes(search.toLowerCase()) ||
      s.subject_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Enrolled Subjects</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active subjects, credits, and assigned course faculty
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code or name..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
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
          {subjects.length === 0
            ? 'You are not enrolled in any subjects yet.'
            : 'No subjects match your search query.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                <th className="py-2.5 px-4">Subject Code</th>
                <th className="py-2.5 px-4">Subject Name</th>
                <th className="py-2.5 px-4">Semester</th>
                <th className="py-2.5 px-4">Faculty</th>
                <th className="py-2.5 px-4 text-right">Credits</th>
                <th className="py-2.5 px-4 text-right">Max / Pass Marks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono text-xs font-semibold text-blue-800 whitespace-nowrap">
                    {sub.subject_code}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">{sub.subject_name}</td>
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{sub.semester_label}</td>
                  <td className="py-3 px-4 text-slate-600">{sub.faculty_names || 'To be assigned'}</td>
                  <td className="py-3 px-4 text-right tabular-nums text-slate-900">{sub.credits}</td>
                  <td className="py-3 px-4 text-right tabular-nums text-slate-700">
                    {sub.max_marks} / {sub.passing_marks}
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

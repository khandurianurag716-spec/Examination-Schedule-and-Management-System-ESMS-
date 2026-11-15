import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { SubjectItem } from '../../types/esms';

export function FacultySubjects() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<{ subjects: SubjectItem[] }>('/api/faculty/subjects')
      .then((res) => setSubjects(res.subjects))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load assigned subjects.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="p-5 border-b border-slate-200">
        <h1 className="text-lg font-bold text-slate-900">Assigned Subjects</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Subjects allocated to you for examination scheduling and marks evaluation
        </p>
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
      ) : subjects.length === 0 ? (
        <div className="p-10 text-center text-sm text-slate-500">
          No subjects have been assigned to your account by Administration yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                <th className="py-2.5 px-4">Code</th>
                <th className="py-2.5 px-4">Subject Name</th>
                <th className="py-2.5 px-4">Course &amp; Semester</th>
                <th className="py-2.5 px-4 text-right">Credits</th>
                <th className="py-2.5 px-4 text-right">Max / Pass Marks</th>
                <th className="py-2.5 px-4 text-right">Students</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {subjects.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono text-xs font-semibold text-blue-800 whitespace-nowrap">
                    {sub.subject_code}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">{sub.subject_name}</td>
                  <td className="py-3 px-4 text-slate-600">
                    {sub.course_code} · {sub.semester_label}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums">{sub.credits}</td>
                  <td className="py-3 px-4 text-right tabular-nums text-slate-700">
                    {sub.max_marks} / {sub.passing_marks}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold tabular-nums text-slate-900">
                    {sub.enrolled_students_count ?? 0}
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

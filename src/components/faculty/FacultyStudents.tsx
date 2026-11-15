import { useEffect, useState } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../services/api';

interface FacultyStudent {
  student_id: number;
  roll_number: string;
  full_name: string;
  email: string;
  phone: string | null;
  course_code: string;
  course_name: string;
  semester_label: string;
  batch_year: number;
  section: string;
  subject_codes: string;
}

export function FacultyStudents() {
  const [students, setStudents] = useState<FacultyStudent[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<{ students: FacultyStudent[] }>('/api/faculty/students')
      .then((res) => setStudents(res.students))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load assigned students.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.full_name.toLowerCase().includes(q) ||
      s.roll_number.toLowerCase().includes(q) ||
      (s.subject_codes || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Assigned Students</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Students enrolled in your assigned courses and subjects
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, roll number, or subject..."
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
        <div className="p-10 text-center text-sm text-slate-500">No matching students found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                <th className="py-2.5 px-4">Roll Number</th>
                <th className="py-2.5 px-4">Student Name</th>
                <th className="py-2.5 px-4">Course &amp; Semester</th>
                <th className="py-2.5 px-4">Enrolled Subjects</th>
                <th className="py-2.5 px-4">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.map((stu) => (
                <tr key={stu.student_id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono text-xs font-semibold text-blue-800 tabular-nums whitespace-nowrap">
                    {stu.roll_number}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-900">{stu.full_name}</div>
                    <div className="text-xs text-slate-500">
                      Batch {stu.batch_year} · Section {stu.section}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    <div>{stu.course_code}</div>
                    <div className="text-xs text-slate-500">{stu.semester_label}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-700">{stu.subject_codes}</td>
                  <td className="py-3 px-4 text-xs text-slate-600">{stu.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

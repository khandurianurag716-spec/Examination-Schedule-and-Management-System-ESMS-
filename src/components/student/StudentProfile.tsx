import { useEffect, useState } from 'react';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import { apiRequest } from '../../services/api';

interface StudentProfileData {
  profile: {
    roll_number: string;
    full_name: string;
    email: string;
    phone: string | null;
    course_code: string;
    course_name: string;
    department: string;
    semester_label: string;
    batch_year: number;
    section: string;
    admission_date: string;
  };
  registered_subjects: Array<{
    id: number;
    subject_code: string;
    subject_name: string;
    credits: number;
    semester_label: string;
  }>;
}

export function StudentProfile() {
  const [data, setData] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<StudentProfileData>('/api/student/profile')
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse" />;
  }

  if (error || !data) {
    return (
      <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>{error || 'Student profile unavailable.'}</span>
      </div>
    );
  }

  const { profile, registered_subjects } = data;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Student Academic Profile</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Official university enrollment record for {profile.full_name}
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <ShieldCheck className="w-4 h-4 text-blue-700" aria-hidden="true" />
            <span>Managed by Examination Cell</span>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5 text-sm">
          <div>
            <dt className="text-xs font-medium text-slate-500">Full Name</dt>
            <dd className="mt-1 font-semibold text-slate-900">{profile.full_name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">University Roll Number</dt>
            <dd className="mt-1 font-mono font-semibold text-slate-900 tabular-nums">
              {profile.roll_number}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Official Email</dt>
            <dd className="mt-1 text-slate-900">{profile.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Phone Number</dt>
            <dd className="mt-1 text-slate-900 tabular-nums">{profile.phone || 'Not provided'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Course &amp; Department</dt>
            <dd className="mt-1 text-slate-900">
              {profile.course_name} ({profile.course_code})
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Current Semester &amp; Section</dt>
            <dd className="mt-1 text-slate-900">
              {profile.semester_label} · Section {profile.section}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Batch Year</dt>
            <dd className="mt-1 text-slate-900 tabular-nums">{profile.batch_year}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Admission Date</dt>
            <dd className="mt-1 text-slate-900 tabular-nums">{profile.admission_date}</dd>
          </div>
        </dl>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Registered Subjects</h2>
        </div>
        {registered_subjects.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No subjects are currently assigned to your student record.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                  <th className="py-2.5 px-4">Subject Code</th>
                  <th className="py-2.5 px-4">Subject Name</th>
                  <th className="py-2.5 px-4">Semester</th>
                  <th className="py-2.5 px-4 text-right">Credits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {registered_subjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-blue-800 whitespace-nowrap">
                      {sub.subject_code}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">{sub.subject_name}</td>
                    <td className="py-3 px-4 text-slate-600">{sub.semester_label}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-900">{sub.credits}</td>
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

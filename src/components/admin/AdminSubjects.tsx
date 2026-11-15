import { FormEvent, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Edit3, Plus, Trash2, X } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { Course, Semester, SubjectItem } from '../../types/esms';
import { ConfirmDialog } from '../ui/ConfirmDialog';

export function AdminSubjects() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [courseId, setCourseId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [credits, setCredits] = useState('4');
  const [maxMarks, setMaxMarks] = useState('100');
  const [passingMarks, setPassingMarks] = useState('40');
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<SubjectItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const [subRes, metaRes] = await Promise.all([
        apiRequest<{ subjects: SubjectItem[] }>('/api/admin/subjects'),
        apiRequest<{ courses: Course[]; semesters: Semester[] }>('/api/admin/metadata'),
      ]);
      setSubjects(subRes.subjects);
      setCourses(metaRes.courses);
      setSemesters(metaRes.semesters);
      if (!courseId && metaRes.courses[0]) setCourseId(String(metaRes.courses[0].id));
      if (!semesterId && metaRes.semesters[0]) setSemesterId(String(metaRes.semesters[0].id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load subjects.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  function resetForm() {
    setEditingId(null);
    setSubjectCode('');
    setSubjectName('');
    setCredits('4');
    setMaxMarks('100');
    setPassingMarks('40');
    setShowForm(false);
  }

  function startEdit(sub: SubjectItem) {
    setEditingId(sub.id);
    setSubjectCode(sub.subject_code);
    setSubjectName(sub.subject_name);
    setCourseId(String(sub.course_id));
    setSemesterId(String(sub.semester_id));
    setCredits(String(sub.credits));
    setMaxMarks(String(sub.max_marks));
    setPassingMarks(String(sub.passing_marks));
    setShowForm(true);
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!subjectCode.trim() || !subjectName.trim() || !courseId || !semesterId) {
      setError('Subject code, name, course, and semester are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        subject_code: subjectCode.trim(),
        subject_name: subjectName.trim(),
        course_id: Number(courseId),
        semester_id: Number(semesterId),
        credits: Number(credits),
        max_marks: Number(maxMarks),
        passing_marks: Number(passingMarks),
      };

      if (editingId) {
        const res = await apiRequest<{ message: string }>(`/api/admin/subjects/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setSuccess(res.message);
      } else {
        const res = await apiRequest<{ message: string }>('/api/admin/subjects', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSuccess(res.message);
      }
      resetForm();
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save subject.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await apiRequest<{ message: string }>(`/api/admin/subjects/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      setSuccess(res.message);
      setDeleteTarget(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete subject.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">
              {editingId ? `Edit Subject (${subjectCode})` : 'Add New Subject'}
            </h2>
            <button type="button" onClick={resetForm} className="text-slate-500 hover:text-slate-800 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Subject Code</label>
              <input
                type="text"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                placeholder="TCS-405"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Subject Name</label>
              <input
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="Software Engineering"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Credits</label>
              <input
                type="number"
                min={1}
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Course</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.course_code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Semester</label>
              <select
                value={semesterId}
                onChange={(e) => setSemesterId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Max Marks</label>
              <input
                type="number"
                min={1}
                value={maxMarks}
                onChange={(e) => setMaxMarks(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Passing Marks</label>
              <input
                type="number"
                min={0}
                value={passingMarks}
                onChange={(e) => setPassingMarks(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg tabular-nums"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-lg disabled:opacity-60"
              >
                {submitting ? 'Saving...' : editingId ? 'Update Subject' : 'Add Subject'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Subjects &amp; Curriculum</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Define course subjects, credits, and passing criteria
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-lg whitespace-nowrap self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subject</span>
          </button>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                  <th className="py-2.5 px-4">Code</th>
                  <th className="py-2.5 px-4">Subject Name</th>
                  <th className="py-2.5 px-4">Course &amp; Sem</th>
                  <th className="py-2.5 px-4">Faculty</th>
                  <th className="py-2.5 px-4 text-right">Students</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
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
                    <td className="py-3 px-4 text-xs text-slate-600">{sub.faculty_names || 'Unassigned'}</td>
                    <td className="py-3 px-4 text-right tabular-nums">{sub.enrolled_count ?? 0}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        type="button"
                        onClick={() => startEdit(sub)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(sub)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Subject"
        message={
          deleteTarget
            ? `Delete ${deleteTarget.subject_code} (${deleteTarget.subject_name})? Any linked examinations and marks for this subject will also be removed.`
            : ''
        }
        confirmLabel="Delete Subject"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

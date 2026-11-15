import { FormEvent, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Edit3, Plus, Search, Trash2, X } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { Course, Semester, SubjectItem } from '../../types/esms';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface AdminStudentRow {
  student_id: number;
  roll_number: string;
  full_name: string;
  email: string;
  phone: string | null;
  course_id: number;
  semester_id: number;
  course_code: string;
  semester_label: string;
  batch_year: number;
  section: string;
  subject_ids: string | null;
  subject_codes: string | null;
}

export function AdminStudents() {
  const [students, setStudents] = useState<AdminStudentRow[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [rollNumber, setRollNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [courseId, setCourseId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [batchYear, setBatchYear] = useState('2026');
  const [section, setSection] = useState('A');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminStudentRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const [stuRes, metaRes, subRes] = await Promise.all([
        apiRequest<{ students: AdminStudentRow[] }>('/api/admin/students'),
        apiRequest<{ courses: Course[]; semesters: Semester[] }>('/api/admin/metadata'),
        apiRequest<{ subjects: SubjectItem[] }>('/api/admin/subjects'),
      ]);
      setStudents(stuRes.students);
      setCourses(metaRes.courses);
      setSemesters(metaRes.semesters);
      setSubjects(subRes.subjects);
      if (!courseId && metaRes.courses[0]) setCourseId(String(metaRes.courses[0].id));
      if (!semesterId && metaRes.semesters[0]) setSemesterId(String(metaRes.semesters[0].id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load students.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  function resetForm() {
    setEditingId(null);
    setRollNumber('');
    setFullName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setBatchYear('2026');
    setSection('A');
    setSelectedSubjectIds([]);
    setShowForm(false);
  }

  function startEdit(stu: AdminStudentRow) {
    setEditingId(stu.student_id);
    setRollNumber(stu.roll_number);
    setFullName(stu.full_name);
    setEmail(stu.email);
    setPhone(stu.phone || '');
    setPassword('');
    setCourseId(String(stu.course_id));
    setSemesterId(String(stu.semester_id));
    setBatchYear(String(stu.batch_year));
    setSection(stu.section);
    const ids = stu.subject_ids
      ? stu.subject_ids.split(',').map((s) => Number(s.trim())).filter(Boolean)
      : [];
    setSelectedSubjectIds(ids);
    setShowForm(true);
    setError(null);
    setSuccess(null);
  }

  function toggleSubject(id: number) {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if ((!editingId && !rollNumber.trim()) || !fullName.trim() || !email.trim() || !courseId || !semesterId) {
      setError('Roll number, full name, email, course, and semester are required.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        const res = await apiRequest<{ message: string }>(`/api/admin/students/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({
            full_name: fullName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            course_id: Number(courseId),
            semester_id: Number(semesterId),
            batch_year: Number(batchYear),
            section: section.trim(),
            subject_ids: selectedSubjectIds,
          }),
        });
        setSuccess(res.message);
      } else {
        const res = await apiRequest<{ message: string }>('/api/admin/students', {
          method: 'POST',
          body: JSON.stringify({
            roll_number: rollNumber.trim(),
            full_name: fullName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            password: password || undefined,
            course_id: Number(courseId),
            semester_id: Number(semesterId),
            batch_year: Number(batchYear),
            section: section.trim(),
            subject_ids: selectedSubjectIds,
          }),
        });
        setSuccess(res.message);
      }
      resetForm();
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save student record.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await apiRequest<{ message: string }>(`/api/admin/students/${deleteTarget.student_id}`, {
        method: 'DELETE',
      });
      setSuccess(res.message);
      setDeleteTarget(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete student.');
    } finally {
      setDeleting(false);
    }
  }

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.roll_number.toLowerCase().includes(q) ||
      s.full_name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  });

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
              {editingId ? `Edit Student (${rollNumber})` : 'Register New Student'}
            </h2>
            <button
              type="button"
              onClick={resetForm}
              className="text-slate-500 hover:text-slate-800 p-1"
              aria-label="Close form"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Roll Number</label>
                <input
                  type="text"
                  disabled={Boolean(editingId)}
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="GEHU2026001"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Student full name"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@student.gehu.ac.in"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91-98..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
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
                      {c.course_code} — {c.course_name}
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
                <label className="block text-xs font-medium text-slate-700 mb-1">Batch Year</label>
                <input
                  type="number"
                  value={batchYear}
                  onChange={(e) => setBatchYear(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Section</label>
                <input
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              {!editingId && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Initial Password (optional)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Default: gehu@2026"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-slate-700 mb-2">Enroll in Subjects</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {subjects.map((sub) => (
                  <label
                    key={sub.id}
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSubjectIds.includes(sub.id)}
                      onChange={() => toggleSubject(sub.id)}
                      className="rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                    />
                    <span className="font-mono font-semibold text-blue-800">{sub.subject_code}</span>
                    <span className="text-slate-700 truncate">{sub.subject_name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
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
                {submitting ? 'Saving...' : editingId ? 'Update Student' : 'Add Student'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Student Directory</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Add, edit, enroll subjects, or remove official student records
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search roll no. or name..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-lg whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Student</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No students found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                  <th className="py-2.5 px-4">Roll No.</th>
                  <th className="py-2.5 px-4">Name &amp; Email</th>
                  <th className="py-2.5 px-4">Course &amp; Sem</th>
                  <th className="py-2.5 px-4">Subjects</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
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
                      <div className="text-xs text-slate-500">{stu.email}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div>
                        {stu.course_code} · Sec {stu.section}
                      </div>
                      <div className="text-xs text-slate-500">{stu.semester_label}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">
                      {stu.subject_codes || 'None assigned'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        type="button"
                        onClick={() => startEdit(stu)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(stu)}
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
        title="Delete Student Record"
        message={
          deleteTarget
            ? `Are you sure you want to permanently remove ${deleteTarget.full_name} (${deleteTarget.roll_number}) and all linked marks and results?`
            : ''
        }
        confirmLabel="Delete Student"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

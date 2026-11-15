import { FormEvent, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Edit3, Plus, Search, Trash2, X } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { SubjectItem } from '../../types/esms';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface AdminFacultyRow {
  faculty_id: number;
  faculty_code: string;
  full_name: string;
  email: string;
  phone: string | null;
  department: string;
  designation: string;
  joining_date: string;
  subject_ids: string | null;
  subject_codes: string | null;
}

export function AdminFaculty() {
  const [facultyList, setFacultyList] = useState<AdminFacultyRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [facultyCode, setFacultyCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [password, setPassword] = useState('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminFacultyRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const [facRes, subRes] = await Promise.all([
        apiRequest<{ faculty: AdminFacultyRow[] }>('/api/admin/faculty'),
        apiRequest<{ subjects: SubjectItem[] }>('/api/admin/subjects'),
      ]);
      setFacultyList(facRes.faculty);
      setSubjects(subRes.subjects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load faculty directory.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  function resetForm() {
    setEditingId(null);
    setFacultyCode('');
    setFullName('');
    setEmail('');
    setPhone('');
    setDepartment('Computer Science & Engineering');
    setDesignation('Assistant Professor');
    setPassword('');
    setSelectedSubjectIds([]);
    setShowForm(false);
  }

  function startEdit(fac: AdminFacultyRow) {
    setEditingId(fac.faculty_id);
    setFacultyCode(fac.faculty_code);
    setFullName(fac.full_name);
    setEmail(fac.email);
    setPhone(fac.phone || '');
    setDepartment(fac.department);
    setDesignation(fac.designation);
    setPassword('');
    const ids = fac.subject_ids
      ? fac.subject_ids.split(',').map((s) => Number(s.trim())).filter(Boolean)
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

    if ((!editingId && !facultyCode.trim()) || !fullName.trim() || !email.trim() || !department.trim()) {
      setError('Faculty code, full name, email, and department are required.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        const res = await apiRequest<{ message: string }>(`/api/admin/faculty/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({
            full_name: fullName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            department: department.trim(),
            designation: designation.trim(),
            subject_ids: selectedSubjectIds,
          }),
        });
        setSuccess(res.message);
      } else {
        const res = await apiRequest<{ message: string }>('/api/admin/faculty', {
          method: 'POST',
          body: JSON.stringify({
            faculty_code: facultyCode.trim(),
            full_name: fullName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            department: department.trim(),
            designation: designation.trim(),
            password: password || undefined,
            subject_ids: selectedSubjectIds,
          }),
        });
        setSuccess(res.message);
      }
      resetForm();
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save faculty record.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await apiRequest<{ message: string }>(`/api/admin/faculty/${deleteTarget.faculty_id}`, {
        method: 'DELETE',
      });
      setSuccess(res.message);
      setDeleteTarget(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete faculty record.');
    } finally {
      setDeleting(false);
    }
  }

  const filtered = facultyList.filter((f) => {
    const q = search.toLowerCase();
    return (
      f.faculty_code.toLowerCase().includes(q) ||
      f.full_name.toLowerCase().includes(q) ||
      f.department.toLowerCase().includes(q)
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
              {editingId ? `Edit Faculty (${facultyCode})` : 'Add Faculty Member'}
            </h2>
            <button type="button" onClick={resetForm} className="text-slate-500 hover:text-slate-800 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Faculty ID / Code</label>
                <input
                  type="text"
                  disabled={Boolean(editingId)}
                  value={facultyCode}
                  onChange={(e) => setFacultyCode(e.target.value)}
                  placeholder="FAC103"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. / Prof. Name"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="faculty@gehu.ac.in"
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
                <label className="block text-xs font-medium text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Designation</label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
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
              <p className="text-xs font-medium text-slate-700 mb-2">Assign Teaching Subjects</p>
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
                {submitting ? 'Saving...' : editingId ? 'Update Faculty' : 'Add Faculty'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Faculty Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage teaching staff profiles and subject allocations
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search faculty..."
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
              <span>Add Faculty</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No faculty records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                  <th className="py-2.5 px-4">Faculty ID</th>
                  <th className="py-2.5 px-4">Name &amp; Email</th>
                  <th className="py-2.5 px-4">Department &amp; Role</th>
                  <th className="py-2.5 px-4">Assigned Subjects</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((fac) => (
                  <tr key={fac.faculty_id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-blue-800 whitespace-nowrap">
                      {fac.faculty_code}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{fac.full_name}</div>
                      <div className="text-xs text-slate-500">{fac.email}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div>{fac.designation}</div>
                      <div className="text-xs text-slate-500">{fac.department}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">
                      {fac.subject_codes || 'Unassigned'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        type="button"
                        onClick={() => startEdit(fac)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(fac)}
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
        title="Delete Faculty Member"
        message={
          deleteTarget
            ? `Are you sure you want to remove ${deleteTarget.full_name} (${deleteTarget.faculty_code})?`
            : ''
        }
        confirmLabel="Delete Faculty"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

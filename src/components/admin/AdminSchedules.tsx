import { FormEvent, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Edit3, Plus, Trash2, X } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { Course, ExamScheduleItem, Semester, SubjectItem } from '../../types/esms';
import { ConfirmDialog } from '../ui/ConfirmDialog';

export function AdminSchedules() {
  const [schedules, setSchedules] = useState<ExamScheduleItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);

  const [courseFilter, setCourseFilter] = useState('All');
  const [semesterFilter, setSemesterFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [subjectId, setSubjectId] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [examType, setExamType] = useState<'Mid-Term' | 'End-Term' | 'Practical' | 'Back Paper'>('End-Term');
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('10:00 AM - 01:00 PM');
  const [roomNumber, setRoomNumber] = useState('');
  const [maxMarks, setMaxMarks] = useState('100');
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ExamScheduleItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const [schedRes, subRes, metaRes] = await Promise.all([
        apiRequest<{ schedules: ExamScheduleItem[] }>('/api/admin/schedules'),
        apiRequest<{ subjects: SubjectItem[] }>('/api/admin/subjects'),
        apiRequest<{ courses: Course[]; semesters: Semester[] }>('/api/admin/metadata'),
      ]);
      setSchedules(schedRes.schedules);
      setSubjects(subRes.subjects);
      setCourses(metaRes.courses);
      setSemesters(metaRes.semesters);
      if (!subjectId && subRes.subjects[0]) setSubjectId(String(subRes.subjects[0].id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load examination schedules.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  function resetForm() {
    setEditingId(null);
    setExamTitle('');
    setExamType('End-Term');
    setExamDate('');
    setExamTime('10:00 AM - 01:00 PM');
    setRoomNumber('');
    setMaxMarks('100');
    setShowForm(false);
  }

  function startEdit(item: ExamScheduleItem) {
    setEditingId(item.id);
    setSubjectId(String(item.subject_id));
    setExamTitle(item.exam_title);
    setExamType(item.exam_type);
    setExamDate(item.exam_date);
    setExamTime(item.exam_time);
    setRoomNumber(item.room_number);
    setMaxMarks(String(item.max_marks));
    setShowForm(true);
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!subjectId || !examTitle.trim() || !examDate || !examTime.trim() || !roomNumber.trim()) {
      setError('All examination schedule fields are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        subject_id: Number(subjectId),
        exam_title: examTitle.trim(),
        exam_type: examType,
        exam_date: examDate,
        exam_time: examTime.trim(),
        room_number: roomNumber.trim(),
        max_marks: Number(maxMarks),
      };

      if (editingId) {
        const res = await apiRequest<{ message: string }>(`/api/admin/schedules/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setSuccess(res.message);
      } else {
        const res = await apiRequest<{ message: string }>('/api/admin/schedules', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSuccess(res.message);
      }
      resetForm();
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save schedule.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await apiRequest<{ message: string }>(`/api/admin/schedules/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      setSuccess(res.message);
      setDeleteTarget(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete schedule.');
    } finally {
      setDeleting(false);
    }
  }

  const filtered = schedules.filter((item) => {
    if (courseFilter !== 'All' && String(item.course_id) !== courseFilter) return false;
    if (semesterFilter !== 'All' && String(item.semester_id) !== semesterFilter) return false;
    if (dateFilter && item.exam_date !== dateFilter) return false;
    return true;
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
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingId ? 'Update Examination Entry' : 'Schedule New Examination'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically checks room booking and semester timetable conflicts
              </p>
            </div>
            <button type="button" onClick={resetForm} className="text-slate-500 hover:text-slate-800 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.subject_code} — {sub.subject_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Exam Title</label>
              <input
                type="text"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                placeholder="End-Term Examination"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Exam Type</label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value as typeof examType)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="Mid-Term">Mid-Term</option>
                <option value="End-Term">End-Term</option>
                <option value="Practical">Practical</option>
                <option value="Back Paper">Back Paper</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Time Slot</label>
              <input
                type="text"
                value={examTime}
                onChange={(e) => setExamTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Room</label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="CR-301"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
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
            </div>

            <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-3 pt-2">
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
                {submitting ? 'Saving...' : editingId ? 'Update Schedule' : 'Create Schedule'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-slate-900">University Examination Timetable</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Filter and manage all scheduled examinations across courses and semesters
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
              <span>Schedule Exam</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
            >
              <option value="All">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.course_code}
                </option>
              ))}
            </select>

            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
            >
              <option value="All">All Semesters</option>
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No schedules match the selected filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                  <th className="py-2.5 px-4">Subject</th>
                  <th className="py-2.5 px-4">Title &amp; Type</th>
                  <th className="py-2.5 px-4">Date &amp; Time</th>
                  <th className="py-2.5 px-4">Room</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{item.subject_name}</div>
                      <div className="text-xs font-mono text-slate-500">
                        {item.subject_code} · {item.course_code} · {item.semester_label}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-900">{item.exam_title}</div>
                      <div className="text-xs text-slate-500">{item.exam_type}</div>
                    </td>
                    <td className="py-3 px-4 tabular-nums">
                      <div className="font-mono text-xs text-slate-900">{item.exam_date}</div>
                      <div className="text-xs text-slate-500">{item.exam_time}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-800 whitespace-nowrap">
                      {item.room_number}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
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
        title="Delete Examination Schedule"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.exam_title}" scheduled on ${deleteTarget.exam_date}?`
            : ''
        }
        confirmLabel="Delete Schedule"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

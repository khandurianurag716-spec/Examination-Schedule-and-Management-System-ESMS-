import { FormEvent, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Edit3, Plus, X } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { ExamScheduleItem, SubjectItem } from '../../types/esms';

export function FacultySchedules() {
  const [schedules, setSchedules] = useState<ExamScheduleItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [subjectId, setSubjectId] = useState<string>('');
  const [examTitle, setExamTitle] = useState('');
  const [examType, setExamType] = useState<'Mid-Term' | 'End-Term' | 'Practical' | 'Back Paper'>('Mid-Term');
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('10:00 AM - 01:00 PM');
  const [roomNumber, setRoomNumber] = useState('');
  const [maxMarks, setMaxMarks] = useState('100');
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [schedRes, subRes] = await Promise.all([
        apiRequest<{ schedules: ExamScheduleItem[] }>('/api/faculty/schedules'),
        apiRequest<{ subjects: SubjectItem[] }>('/api/faculty/subjects'),
      ]);
      setSchedules(schedRes.schedules);
      setSubjects(subRes.subjects);
      if (!subjectId && subRes.subjects.length > 0) {
        setSubjectId(String(subRes.subjects[0].id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load examination schedules.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function resetForm() {
    setEditingId(null);
    setExamTitle('');
    setExamType('Mid-Term');
    setExamDate('');
    setExamTime('10:00 AM - 01:00 PM');
    setRoomNumber('');
    setMaxMarks('100');
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
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!subjectId || !examTitle.trim() || !examDate || !examTime.trim() || !roomNumber.trim()) {
      setError('Please complete all required schedule fields.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        const res = await apiRequest<{ message: string }>(`/api/faculty/schedules/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({
            exam_title: examTitle.trim(),
            exam_type: examType,
            exam_date: examDate,
            exam_time: examTime.trim(),
            room_number: roomNumber.trim(),
            max_marks: Number(maxMarks),
          }),
        });
        setSuccess(res.message);
      } else {
        const res = await apiRequest<{ message: string }>('/api/faculty/schedules', {
          method: 'POST',
          body: JSON.stringify({
            subject_id: Number(subjectId),
            exam_title: examTitle.trim(),
            exam_type: examType,
            exam_date: examDate,
            exam_time: examTime.trim(),
            room_number: roomNumber.trim(),
            max_marks: Number(maxMarks),
          }),
        });
        setSuccess(res.message);
      }
      resetForm();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save examination schedule.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              {editingId ? 'Update Examination Schedule' : 'Add Examination Schedule'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Schedule examinations for your assigned subjects with room conflict validation
            </p>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel Edit</span>
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
            <select
              value={subjectId}
              disabled={Boolean(editingId)}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white disabled:bg-slate-100"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.subject_code} — {sub.subject_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Examination Title</label>
            <input
              type="text"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              placeholder="e.g. End-Term Examination — DBMS"
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
            <label className="block text-xs font-medium text-slate-700 mb-1">Exam Date</label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Exam Time</label>
            <input
              type="text"
              value={examTime}
              onChange={(e) => setExamTime(e.target.value)}
              placeholder="e.g. 10:00 AM - 01:00 PM"
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
                placeholder="LT-201"
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

          <div className="sm:col-span-2 lg:col-span-3 flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting || subjects.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : editingId ? 'Update Schedule' : 'Add Schedule'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Schedules Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Your Subject Examination Schedules</h2>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : schedules.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No examination schedules created for your assigned subjects yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                  <th className="py-2.5 px-4">Subject</th>
                  <th className="py-2.5 px-4">Title</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Date &amp; Time</th>
                  <th className="py-2.5 px-4">Room</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {schedules.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{item.subject_name}</div>
                      <div className="text-xs font-mono text-slate-500">{item.subject_code}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{item.exam_title}</td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{item.exam_type}</td>
                    <td className="py-3 px-4 tabular-nums">
                      <div className="text-slate-900">{item.exam_date}</div>
                      <div className="text-xs text-slate-500">{item.exam_time}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-800 whitespace-nowrap">
                      {item.room_number}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md whitespace-nowrap"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </td>
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

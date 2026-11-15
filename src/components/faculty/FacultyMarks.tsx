import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Save } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { ExamScheduleItem, SubjectItem } from '../../types/esms';
import { StatusIndicator } from '../ui/StatusIndicator';

interface MarkStudentRow {
  student_id: number;
  roll_number: string;
  full_name: string;
  mark_id: number | null;
  obtained_marks: number | null;
  max_marks: number;
  updated_at: string | null;
  is_published: number | null;
  grade: string | null;
  result_status: string | null;
}

export function FacultyMarks() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [schedules, setSchedules] = useState<ExamScheduleItem[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [students, setStudents] = useState<MarkStudentRow[]>([]);
  const [draftScores, setDraftScores] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiRequest<{ subjects: SubjectItem[] }>('/api/faculty/subjects'),
      apiRequest<{ schedules: ExamScheduleItem[] }>('/api/faculty/schedules'),
    ])
      .then(([subRes, schedRes]) => {
        setSubjects(subRes.subjects);
        setSchedules(schedRes.schedules);
        if (subRes.subjects.length > 0) {
          const firstSubId = String(subRes.subjects[0].id);
          setSelectedSubjectId(firstSubId);
          const matchingExam = schedRes.schedules.find((s) => String(s.subject_id) === firstSubId);
          if (matchingExam) {
            setSelectedExamId(String(matchingExam.id));
          }
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load marks setup.'));
  }, []);

  const subjectExams = schedules.filter((e) => String(e.subject_id) === selectedSubjectId);

  async function loadStudentMarks(subId: string, examId: string) {
    if (!subId || !examId) {
      setStudents([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ students: MarkStudentRow[] }>(
        `/api/faculty/marks?subject_id=${subId}&examination_id=${examId}`
      );
      setStudents(res.students);
      const initialScores: Record<number, string> = {};
      for (const row of res.students) {
        initialScores[row.student_id] =
          row.obtained_marks !== null && row.obtained_marks !== undefined ? String(row.obtained_marks) : '';
      }
      setDraftScores(initialScores);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load student marks.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStudentMarks(selectedSubjectId, selectedExamId);
  }, [selectedSubjectId, selectedExamId]);

  function handleSubjectChange(newSubId: string) {
    setSelectedSubjectId(newSubId);
    const matching = schedules.filter((e) => String(e.subject_id) === newSubId);
    setSelectedExamId(matching.length > 0 ? String(matching[0].id) : '');
    setSuccess(null);
    setError(null);
  }

  async function handleSaveMark(row: MarkStudentRow) {
    setError(null);
    setSuccess(null);

    const raw = draftScores[row.student_id];
    if (raw === undefined || raw.trim() === '') {
      setError(`Please enter marks for ${row.full_name} (${row.roll_number}).`);
      return;
    }

    const numeric = Number(raw);
    if (Number.isNaN(numeric) || numeric < 0) {
      setError('Marks cannot be negative.');
      return;
    }
    if (numeric > row.max_marks) {
      setError(`Obtained marks (${numeric}) cannot exceed maximum marks (${row.max_marks}).`);
      return;
    }

    setSavingId(row.student_id);
    try {
      const res = await apiRequest<{ message: string }>('/api/faculty/marks', {
        method: 'POST',
        body: JSON.stringify({
          student_id: row.student_id,
          subject_id: Number(selectedSubjectId),
          examination_id: Number(selectedExamId),
          obtained_marks: numeric,
        }),
      });
      setSuccess(`${row.roll_number}: ${res.message}`);
      await loadStudentMarks(selectedSubjectId, selectedExamId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save marks.');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="pb-4 border-b border-slate-200">
          <h1 className="text-lg font-bold text-slate-900">Marks Entry &amp; Evaluation</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Select an assigned subject and examination to enter or update student marks (final publication is controlled by Admin)
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Select Subject</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
            >
              <option value="">-- Select Subject --</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.subject_code} — {sub.subject_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Select Examination</label>
            <select
              value={selectedExamId}
              onChange={(e) => {
                setSelectedExamId(e.target.value);
                setSuccess(null);
                setError(null);
              }}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
            >
              <option value="">-- Select Examination --</option>
              {subjectExams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.exam_title} ({ex.exam_date})
                </option>
              ))}
            </select>
          </div>
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
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {!selectedSubjectId || !selectedExamId ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Select both a subject and an examination schedule to view enrolled students.
          </div>
        ) : loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No students are currently enrolled in this subject.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                  <th className="py-2.5 px-4">Roll Number</th>
                  <th className="py-2.5 px-4">Student Name</th>
                  <th className="py-2.5 px-4">Obtained Marks</th>
                  <th className="py-2.5 px-4 text-right">Max</th>
                  <th className="py-2.5 px-4">Grade &amp; Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {students.map((row) => {
                  const locked = row.is_published === 1;
                  return (
                    <tr key={row.student_id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-blue-800 tabular-nums whitespace-nowrap">
                        {row.roll_number}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">{row.full_name}</td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min={0}
                          max={row.max_marks}
                          step="0.5"
                          disabled={locked}
                          value={draftScores[row.student_id] ?? ''}
                          onChange={(e) =>
                            setDraftScores((prev) => ({ ...prev, [row.student_id]: e.target.value }))
                          }
                          className="w-28 px-2.5 py-1.5 text-sm border border-slate-300 rounded-md tabular-nums disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-slate-600">{row.max_marks}</td>
                      <td className="py-3 px-4">
                        {row.grade ? (
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-semibold text-slate-900">{row.grade}</span>
                            <StatusIndicator status={locked ? 'Published' : 'Draft'} />
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Not entered</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {locked ? (
                          <span className="text-xs text-slate-400">Locked (Published)</span>
                        ) : (
                          <button
                            type="button"
                            disabled={savingId === row.student_id}
                            onClick={() => handleSaveMark(row)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-md disabled:opacity-60 whitespace-nowrap"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>{savingId === row.student_id ? 'Saving...' : 'Save Marks'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

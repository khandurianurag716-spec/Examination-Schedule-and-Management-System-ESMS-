import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Save, Send } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { ResultItem } from '../../types/esms';
import { StatusIndicator } from '../ui/StatusIndicator';

export function AdminResults() {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [semesterFilter, setSemesterFilter] = useState('All');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Draft' | 'Published'>('All');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [editingMarks, setEditingMarks] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadResults() {
    setLoading(true);
    try {
      const res = await apiRequest<{ results: ResultItem[] }>('/api/admin/results');
      setResults(res.results);
      const map: Record<number, string> = {};
      for (const r of res.results) {
        map[r.result_id] = String(r.obtained_marks);
      }
      setEditingMarks(map);
      setSelectedIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load results.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadResults();
  }, []);

  const semesters = Array.from(new Set(results.map((r) => r.semester_label)));
  const subjects = Array.from(new Set(results.map((r) => `${r.subject_code} — ${r.subject_name}`)));

  const filtered = results.filter((r) => {
    if (semesterFilter !== 'All' && r.semester_label !== semesterFilter) return false;
    if (subjectFilter !== 'All' && `${r.subject_code} — ${r.subject_name}` !== subjectFilter) return false;
    if (statusFilter === 'Draft' && r.is_published === 1) return false;
    if (statusFilter === 'Published' && r.is_published === 0) return false;
    return true;
  });

  const draftVisibleIds = filtered.filter((r) => r.is_published === 0).map((r) => r.result_id);

  function toggleSelect(id: number) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function selectAllDrafts() {
    if (selectedIds.length === draftVisibleIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(draftVisibleIds);
    }
  }

  async function handlePublishSelected() {
    if (selectedIds.length === 0) return;
    setError(null);
    setSuccess(null);
    setPublishing(true);
    try {
      const res = await apiRequest<{ message: string }>('/api/admin/results/publish', {
        method: 'POST',
        body: JSON.stringify({ result_ids: selectedIds }),
      });
      setSuccess(res.message);
      await loadResults();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to publish results.');
    } finally {
      setPublishing(false);
    }
  }

  async function handleUpdateMarks(row: ResultItem) {
    setError(null);
    setSuccess(null);
    const val = Number(editingMarks[row.result_id]);
    if (Number.isNaN(val) || val < 0 || val > row.max_marks) {
      setError(`Marks must be between 0 and ${row.max_marks}.`);
      return;
    }

    setSavingId(row.result_id);
    try {
      const res = await apiRequest<{ message: string }>(`/api/admin/results/${row.result_id}`, {
        method: 'PUT',
        body: JSON.stringify({ obtained_marks: val }),
      });
      setSuccess(`${row.roll_number}: ${res.message}`);
      await loadResults();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update marks.');
    } finally {
      setSavingId(null);
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

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-slate-900">Marks &amp; Official Result Publication</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Review faculty-entered marks and publish official university results to student portals
              </p>
            </div>

            <div className="flex items-center gap-2">
              {draftVisibleIds.length > 0 && (
                <button
                  type="button"
                  onClick={selectAllDrafts}
                  className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap"
                >
                  {selectedIds.length === draftVisibleIds.length ? 'Unselect Drafts' : 'Select All Drafts'}
                </button>
              )}
              <button
                type="button"
                disabled={selectedIds.length === 0 || publishing}
                onClick={handlePublishSelected}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-lg disabled:opacity-50 whitespace-nowrap"
              >
                <Send className="w-4 h-4" />
                <span>{publishing ? 'Publishing...' : `Publish Selected (${selectedIds.length})`}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
            >
              <option value="All">All Semesters</option>
              {semesters.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
            >
              <option value="All">All Subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft (Unpublished)</option>
              <option value="Published">Published</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No student marks or results match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                  <th className="py-2.5 px-4 w-10">Pick</th>
                  <th className="py-2.5 px-4">Student</th>
                  <th className="py-2.5 px-4">Subject &amp; Exam</th>
                  <th className="py-2.5 px-4">Marks</th>
                  <th className="py-2.5 px-4">Grade</th>
                  <th className="py-2.5 px-4">State</th>
                  <th className="py-2.5 px-4 text-right">Admin Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((row) => (
                  <tr key={row.result_id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      {row.is_published === 0 && (
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(row.result_id)}
                          onChange={() => toggleSelect(row.result_id)}
                          className="rounded border-slate-300 text-blue-700"
                          aria-label={`Select result for ${row.roll_number}`}
                        />
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{row.student_name}</div>
                      <div className="text-xs font-mono text-slate-500">{row.roll_number}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">
                        {row.subject_code} · {row.exam_type}
                      </div>
                      <div className="text-xs text-slate-500">{row.semester_label}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 tabular-nums">
                        <input
                          type="number"
                          min={0}
                          max={row.max_marks}
                          step="0.5"
                          value={editingMarks[row.result_id] ?? ''}
                          onChange={(e) =>
                            setEditingMarks((prev) => ({ ...prev, [row.result_id]: e.target.value }))
                          }
                          className="w-20 px-2 py-1 text-sm border border-slate-300 rounded-md"
                        />
                        <span className="text-xs text-slate-500">/ {row.max_marks}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {row.grade} ({row.result_status})
                    </td>
                    <td className="py-3 px-4">
                      <StatusIndicator status={row.is_published === 1 ? 'Published' : 'Draft'} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        disabled={savingId === row.result_id}
                        onClick={() => handleUpdateMarks(row)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md whitespace-nowrap"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{savingId === row.result_id ? 'Saving...' : 'Save'}</span>
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

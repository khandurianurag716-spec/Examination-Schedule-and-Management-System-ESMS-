import { FormEvent, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, History } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { RevaluationRequestItem } from '../../types/esms';
import { StatusIndicator } from '../ui/StatusIndicator';

interface FacultyOption {
  faculty_id: number;
  faculty_code: string;
  full_name: string;
  department: string;
}

interface RevaluationHistoryRow {
  id: number;
  revaluation_request_id: number;
  previous_marks: number;
  new_marks: number;
  previous_grade: string;
  new_grade: string;
  changed_by_name: string | null;
  remarks: string | null;
  changed_at: string;
  subject_code: string;
  roll_number: string;
}

export function AdminRevaluation() {
  const [requests, setRequests] = useState<RevaluationRequestItem[]>([]);
  const [history, setHistory] = useState<RevaluationHistoryRow[]>([]);
  const [facultyList, setFacultyList] = useState<FacultyOption[]>([]);
  const [statusFilter, setStatusFilter] = useState('All');

  const [assignFacultyMap, setAssignFacultyMap] = useState<Record<number, string>>({});
  const [activeDecisionReq, setActiveDecisionReq] = useState<RevaluationRequestItem | null>(null);
  const [revisedMarks, setRevisedMarks] = useState('');
  const [adminRemarks, setAdminRemarks] = useState('');

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    try {
      const [revRes, facRes] = await Promise.all([
        apiRequest<{ revaluations: RevaluationRequestItem[]; history: RevaluationHistoryRow[] }>(
          '/api/admin/revaluations'
        ),
        apiRequest<{ faculty: FacultyOption[] }>('/api/admin/faculty'),
      ]);
      setRequests(revRes.revaluations);
      setHistory(revRes.history);
      setFacultyList(facRes.faculty);

      const map: Record<number, string> = {};
      for (const r of revRes.revaluations) {
        map[r.id] = r.assigned_faculty_id ? String(r.assigned_faculty_id) : facRes.faculty[0] ? String(facRes.faculty[0].faculty_id) : '';
      }
      setAssignFacultyMap(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load revaluation administration.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  async function handleAssign(requestId: number) {
    const facultyId = Number(assignFacultyMap[requestId]);
    if (!facultyId) {
      setError('Select a faculty member before assigning.');
      return;
    }

    setError(null);
    setSuccess(null);
    try {
      const res = await apiRequest<{ message: string }>(`/api/admin/revaluations/${requestId}/assign`, {
        method: 'PUT',
        body: JSON.stringify({ faculty_id: facultyId }),
      });
      setSuccess(res.message);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to assign request.');
    }
  }

  function openDecisionPanel(req: RevaluationRequestItem) {
    setActiveDecisionReq(req);
    setRevisedMarks(
      req.faculty_recommended_marks !== null
        ? String(req.faculty_recommended_marks)
        : String(req.original_marks)
    );
    setAdminRemarks(req.admin_remarks || '');
    setError(null);
    setSuccess(null);
  }

  async function handleDecision(e: FormEvent, decision: 'approve_publish' | 'reject') {
    e.preventDefault();
    if (!activeDecisionReq) return;

    setError(null);
    setSuccess(null);
    setProcessing(true);

    try {
      const res = await apiRequest<{ message: string }>(
        `/api/admin/revaluations/${activeDecisionReq.id}/decide`,
        {
          method: 'POST',
          body: JSON.stringify({
            decision,
            revised_marks: decision === 'approve_publish' ? Number(revisedMarks) : undefined,
            admin_remarks: adminRemarks.trim(),
          }),
        }
      );
      setSuccess(res.message);
      setActiveDecisionReq(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process decision.');
    } finally {
      setProcessing(false);
    }
  }

  const filtered = requests.filter((r) => statusFilter === 'All' || r.status === statusFilter);

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

      {activeDecisionReq && (
        <div className="bg-white border border-blue-200 rounded-xl p-6">
          <div className="flex items-start justify-between pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Final Decision — Revaluation #{activeDecisionReq.id}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 tabular-nums">
                {activeDecisionReq.student_name} ({activeDecisionReq.roll_number}) ·{' '}
                {activeDecisionReq.subject_code}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveDecisionReq(null)}
              className="text-xs font-medium text-slate-500 hover:text-slate-900"
            >
              Close
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-xs font-medium text-slate-500 mb-1">Student Reason</p>
              <p className="text-slate-800">{activeDecisionReq.reason}</p>
              <p className="mt-2 text-xs text-slate-600 tabular-nums">
                Original Marks: <span className="font-semibold">{activeDecisionReq.original_marks}</span>
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-xs font-medium text-slate-500 mb-1">Faculty Recommendation</p>
              <p className="text-slate-800">
                {activeDecisionReq.faculty_remarks || 'No faculty remarks submitted yet.'}
              </p>
              <p className="mt-2 text-xs text-slate-600 tabular-nums">
                Recommended Marks:{' '}
                <span className="font-semibold">
                  {activeDecisionReq.faculty_recommended_marks !== null
                    ? activeDecisionReq.faculty_recommended_marks
                    : 'Not entered'}
                </span>
              </p>
            </div>
          </div>

          <form onSubmit={(e) => handleDecision(e, 'approve_publish')} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Final Revised Marks (Max {activeDecisionReq.max_marks})
                </label>
                <input
                  type="number"
                  min={0}
                  max={activeDecisionReq.max_marks}
                  step="0.5"
                  value={revisedMarks}
                  onChange={(e) => setRevisedMarks(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg tabular-nums"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Controller / Admin Remarks
                </label>
                <input
                  type="text"
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder="Enter official revaluation publication note..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={processing}
                onClick={(e) => handleDecision(e, 'reject')}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg disabled:opacity-60"
              >
                Reject Request
              </button>
              <button
                type="submit"
                disabled={processing}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-lg disabled:opacity-60"
              >
                {processing ? 'Publishing...' : 'Approve & Publish Revised Marks'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Requests Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Revaluation Administration</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Assign pending requests to faculty, review recommendations, and publish revised marks
            </p>
          </div>

          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 overflow-x-auto">
            {['All', 'Pending', 'Under Review', 'Completed', 'Rejected'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
                  statusFilter === st ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No revaluation requests found for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                  <th className="py-2.5 px-4">Student &amp; Subject</th>
                  <th className="py-2.5 px-4 text-right">Original</th>
                  <th className="py-2.5 px-4 text-right">Recommended</th>
                  <th className="py-2.5 px-4">Assigned Faculty</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((req) => {
                  const finalized = req.status === 'Completed' || req.status === 'Rejected';
                  return (
                    <tr key={req.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">
                          {req.student_name} ({req.roll_number})
                        </div>
                        <div className="text-xs font-mono text-slate-500">
                          {req.subject_code} · {req.exam_type}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums">
                        {req.original_marks} / {req.max_marks}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums font-medium">
                        {req.faculty_recommended_marks !== null
                          ? `${req.faculty_recommended_marks} / ${req.max_marks}`
                          : '—'}
                      </td>
                      <td className="py-3 px-4">
                        {finalized ? (
                          <span className="text-xs text-slate-700">
                            {req.assigned_faculty_name || 'Unassigned'}
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={assignFacultyMap[req.id] || ''}
                              onChange={(e) =>
                                setAssignFacultyMap((prev) => ({ ...prev, [req.id]: e.target.value }))
                              }
                              className="px-2 py-1 text-xs border border-slate-200 rounded-md bg-white max-w-[160px]"
                            >
                              {facultyList.map((f) => (
                                <option key={f.faculty_id} value={f.faculty_id}>
                                  {f.faculty_code} — {f.full_name}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleAssign(req.id)}
                              className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md whitespace-nowrap"
                            >
                              Assign
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <StatusIndicator status={req.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        {finalized ? (
                          <span className="text-xs font-mono text-slate-600 tabular-nums">
                            {req.revised_marks !== null ? `Final: ${req.revised_marks}` : 'Closed'}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openDecisionPanel(req)}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-md whitespace-nowrap"
                          >
                            Review &amp; Decide
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

      {/* Audit History Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
          <History className="w-4 h-4 text-blue-700" aria-hidden="true" />
          <h2 className="text-base font-semibold text-slate-900">
            Revaluation Audit History (Original vs. Revised Marks)
          </h2>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No revised marks have been published yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                  <th className="py-2.5 px-4">Roll No.</th>
                  <th className="py-2.5 px-4">Subject</th>
                  <th className="py-2.5 px-4 text-right">Marks Change</th>
                  <th className="py-2.5 px-4">Grade Change</th>
                  <th className="py-2.5 px-4">Approved By</th>
                  <th className="py-2.5 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-blue-800">
                      {h.roll_number}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-700">{h.subject_code}</td>
                    <td className="py-3 px-4 text-right tabular-nums font-medium text-slate-900">
                      {h.previous_marks} → {h.new_marks}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-800">
                      {h.previous_grade} → {h.new_grade}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {h.changed_by_name || 'Administrator'}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500 tabular-nums">
                      {h.changed_at.slice(0, 10)}
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

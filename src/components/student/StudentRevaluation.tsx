import { FormEvent, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { ResultItem, RevaluationRequestItem } from '../../types/esms';
import { StatusIndicator } from '../ui/StatusIndicator';

interface StudentRevaluationProps {
  preselectedResultId?: number | null;
}

export function StudentRevaluation({ preselectedResultId }: StudentRevaluationProps) {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [requests, setRequests] = useState<RevaluationRequestItem[]>([]);
  const [selectedResultId, setSelectedResultId] = useState<string>(
    preselectedResultId ? String(preselectedResultId) : ''
  );
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [resData, revData] = await Promise.all([
        apiRequest<{ results: ResultItem[] }>('/api/student/results'),
        apiRequest<{ revaluations: RevaluationRequestItem[] }>('/api/student/revaluations'),
      ]);
      setResults(resData.results);
      setRequests(revData.revaluations);
      if (preselectedResultId) {
        setSelectedResultId(String(preselectedResultId));
      } else if (!selectedResultId && resData.results.length > 0) {
        setSelectedResultId(String(resData.results[0].result_id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load revaluation details.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [preselectedResultId]);

  const selectedResult = results.find((r) => String(r.result_id) === selectedResultId);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedResultId) {
      setError('Please select a published subject result.');
      return;
    }

    if (reason.trim().length < 10) {
      setError('Please enter a detailed reason (at least 10 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest<{ message: string }>('/api/student/revaluations', {
        method: 'POST',
        body: JSON.stringify({ result_id: Number(selectedResultId), reason: reason.trim() }),
      });
      setSuccess(res.message);
      setReason('');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit revaluation request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Submission Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="pb-4 border-b border-slate-200">
          <h1 className="text-lg font-bold text-slate-900">Apply for Marksheet Revaluation</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Select a published subject result and state the reason for answer script re-checking
          </p>
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

        {results.length === 0 && !loading ? (
          <p className="mt-4 text-sm text-slate-500">
            Revaluation requests can only be submitted once your examination results are published.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reval-subject" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Published Subject Marksheet
                </label>
                <select
                  id="reval-subject"
                  value={selectedResultId}
                  onChange={(e) => setSelectedResultId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">-- Select Subject --</option>
                  {results.map((r) => (
                    <option key={r.result_id} value={r.result_id}>
                      {r.subject_code} — {r.subject_name} ({r.exam_type})
                    </option>
                  ))}
                </select>
              </div>

              {selectedResult && (
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Subject Code &amp; Exam</p>
                    <p className="font-mono font-semibold text-slate-900">
                      {selectedResult.subject_code} · {selectedResult.exam_type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Obtained Marks</p>
                    <p className="font-bold text-slate-900 tabular-nums">
                      {selectedResult.obtained_marks} / {selectedResult.max_marks} ({selectedResult.grade})
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="reval-reason" className="block text-sm font-medium text-slate-700 mb-1.5">
                Reason for Revaluation
              </label>
              <textarea
                id="reval-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe specific questions or totaling discrepancies you want verified..."
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !selectedResultId}
                className="px-5 py-2.5 bg-blue-800 hover:bg-blue-900 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 whitespace-nowrap"
              >
                {submitting ? 'Submitting...' : 'Submit Revaluation Request'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Request Tracking Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Submitted Revaluation Requests</h2>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            You have not submitted any revaluation requests yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                  <th className="py-2.5 px-4">Subject</th>
                  <th className="py-2.5 px-4">Submitted Date</th>
                  <th className="py-2.5 px-4 text-right">Original Marks</th>
                  <th className="py-2.5 px-4 text-right">Revised Marks</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{req.subject_name}</div>
                      <div className="text-xs font-mono text-slate-500">
                        {req.subject_code} · {req.exam_type}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {req.submitted_at.slice(0, 10)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-900">
                      {req.original_marks} / {req.max_marks}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-semibold text-slate-900">
                      {req.revised_marks !== null ? `${req.revised_marks} / ${req.max_marks}` : 'Pending'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusIndicator status={req.status} />
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 max-w-xs">
                      {req.admin_remarks || req.reason}
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

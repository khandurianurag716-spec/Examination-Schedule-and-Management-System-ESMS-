import { FormEvent, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { RevaluationRequestItem } from '../../types/esms';
import { StatusIndicator } from '../ui/StatusIndicator';

export function FacultyRevaluation() {
  const [requests, setRequests] = useState<RevaluationRequestItem[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RevaluationRequestItem | null>(null);
  const [recommendedMarks, setRecommendedMarks] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadRequests() {
    setLoading(true);
    try {
      const res = await apiRequest<{ revaluations: RevaluationRequestItem[] }>('/api/faculty/revaluations');
      setRequests(res.revaluations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load revaluation requests.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRequests();
  }, []);

  function openReview(req: RevaluationRequestItem) {
    setSelectedRequest(req);
    setRecommendedMarks(
      req.faculty_recommended_marks !== null
        ? String(req.faculty_recommended_marks)
        : String(req.original_marks)
    );
    setRemarks(req.faculty_remarks || '');
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedRequest) return;

    setError(null);
    setSuccess(null);

    const score = Number(recommendedMarks);
    if (Number.isNaN(score) || score < 0 || score > selectedRequest.max_marks) {
      setError(`Recommended marks must be between 0 and ${selectedRequest.max_marks}.`);
      return;
    }

    if (remarks.trim().length < 5) {
      setError('Please enter review remarks (at least 5 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest<{ message: string }>(
        `/api/faculty/revaluations/${selectedRequest.id}/recommend`,
        {
          method: 'POST',
          body: JSON.stringify({ recommended_marks: score, remarks: remarks.trim() }),
        }
      );
      setSuccess(res.message);
      setSelectedRequest(null);
      await loadRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit recommendation.');
    } finally {
      setSubmitting(false);
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

      {selectedRequest && (
        <div className="bg-white border border-blue-200 rounded-xl p-6">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Review Revaluation #{selectedRequest.id}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 tabular-nums">
                {selectedRequest.student_name} ({selectedRequest.roll_number}) ·{' '}
                {selectedRequest.subject_code} — {selectedRequest.subject_name}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedRequest(null)}
              className="text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              Close
            </button>
          </div>

          <div className="mt-4 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-sm">
            <p className="text-xs font-medium text-slate-500 mb-1">Student Reason</p>
            <p className="text-slate-800">{selectedRequest.reason}</p>
            <p className="mt-2 text-xs text-slate-600 tabular-nums">
              Original Marks:{' '}
              <span className="font-semibold text-slate-900">
                {selectedRequest.original_marks} / {selectedRequest.max_marks}
              </span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Recommended Revised Marks
                </label>
                <input
                  type="number"
                  min={0}
                  max={selectedRequest.max_marks}
                  step="0.5"
                  value={recommendedMarks}
                  onChange={(e) => setRecommendedMarks(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg tabular-nums"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Faculty Evaluation Remarks
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="State answer script verification findings..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-lg disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Submit Recommendation to Admin'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h1 className="text-lg font-bold text-slate-900">Assigned Revaluation Reviews</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verify student answer scripts and submit mark recommendations to Administration for final publication
          </p>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No revaluation requests are currently assigned to you.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                  <th className="py-2.5 px-4">Student</th>
                  <th className="py-2.5 px-4">Subject</th>
                  <th className="py-2.5 px-4 text-right">Original</th>
                  <th className="py-2.5 px-4 text-right">Recommended</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {requests.map((req) => {
                  const finalized = req.status === 'Completed' || req.status === 'Rejected';
                  return (
                    <tr key={req.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{req.student_name}</div>
                        <div className="text-xs font-mono text-slate-500">{req.roll_number}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{req.subject_name}</div>
                        <div className="text-xs font-mono text-slate-500">{req.subject_code}</div>
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums">
                        {req.original_marks} / {req.max_marks}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums font-semibold">
                        {req.faculty_recommended_marks !== null
                          ? `${req.faculty_recommended_marks} / ${req.max_marks}`
                          : 'Pending'}
                      </td>
                      <td className="py-3 px-4">
                        <StatusIndicator status={req.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        {finalized ? (
                          <span className="text-xs text-slate-400">Finalized</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openReview(req)}
                            className="px-3 py-1.5 text-xs font-medium text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md whitespace-nowrap"
                          >
                            {req.faculty_recommended_marks !== null ? 'Update Review' : 'Review & Recommend'}
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

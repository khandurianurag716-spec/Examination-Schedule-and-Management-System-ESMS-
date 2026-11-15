import { CheckCircle2, Clock, Eye, XCircle, AlertCircle } from 'lucide-react';

interface StatusIndicatorProps {
  status: string;
}

/**
 * Semantic status display using explicit icon + label + color (no pill capsules)
 */
export function StatusIndicator({ status }: StatusIndicatorProps) {
  switch (status) {
    case 'Pass':
    case 'Published':
    case 'Approved':
    case 'Completed':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{status}</span>
        </span>
      );
    case 'Under Review':
    case 'Upcoming':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 whitespace-nowrap">
          <Eye className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{status}</span>
        </span>
      );
    case 'Pending':
    case 'Draft':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{status}</span>
        </span>
      );
    case 'Fail':
    case 'Rejected':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 whitespace-nowrap">
          <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{status}</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 whitespace-nowrap">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{status}</span>
        </span>
      );
  }
}

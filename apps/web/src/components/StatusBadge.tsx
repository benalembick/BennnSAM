import clsx from 'clsx';
import type { RiskRating } from '../lib/types';

const variants: Record<string, string> = {
  low: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  medium: 'bg-amber-50 text-amber-700 ring-amber-200',
  high: 'bg-orange-50 text-orange-700 ring-orange-200',
  critical: 'bg-rose-50 text-rose-700 ring-rose-200',
  connected: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'needs attention': 'bg-amber-50 text-amber-700 ring-amber-200',
  'not connected': 'bg-slate-100 text-slate-600 ring-slate-200',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  shadow: 'bg-rose-50 text-rose-700 ring-rose-200',
  'over-licensed': 'bg-blue-50 text-blue-700 ring-blue-200',
  'under-licensed': 'bg-rose-50 text-rose-700 ring-rose-200',
  'adequately licensed': 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  approvedState: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  overridden: 'bg-blue-50 text-blue-700 ring-blue-200',
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'refresh due': 'bg-amber-50 text-amber-700 ring-amber-200',
  retired: 'bg-slate-100 text-slate-600 ring-slate-200'
};

export function StatusBadge({ value }: { value: string | RiskRating }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
        variants[value] ?? variants[value === 'approved' ? 'approvedState' : 'not connected']
      )}
    >
      {value}
    </span>
  );
}

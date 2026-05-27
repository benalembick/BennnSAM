import clsx from 'clsx';
import type { RiskRating } from '../lib/types';
import { Badge } from './ui';

const variants: Record<string, string> = {
  low: 'bg-emerald-50 text-emerald-700 ring-emerald-200 before:bg-emerald-500',
  medium: 'bg-amber-50 text-amber-800 ring-amber-200 before:bg-amber-500',
  high: 'bg-orange-50 text-orange-700 ring-orange-200 before:bg-orange-500',
  critical: 'bg-rose-50 text-rose-700 ring-rose-200 before:bg-rose-500',
  connected: 'bg-emerald-50 text-emerald-700 ring-emerald-200 before:bg-emerald-500',
  'needs attention': 'bg-amber-50 text-amber-800 ring-amber-200 before:bg-amber-500',
  'not connected': 'bg-slate-100 text-slate-600 ring-slate-200 before:bg-slate-400',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200 before:bg-emerald-500',
  shadow: 'bg-rose-50 text-rose-700 ring-rose-200 before:bg-rose-500',
  'missing owner': 'bg-amber-50 text-amber-800 ring-amber-200 before:bg-amber-500',
  'over-licensed': 'bg-indigo-50 text-indigo-700 ring-indigo-200 before:bg-indigo-500',
  'under-licensed': 'bg-rose-50 text-rose-700 ring-rose-200 before:bg-rose-500',
  'adequately licensed': 'bg-emerald-50 text-emerald-700 ring-emerald-200 before:bg-emerald-500',
  pending: 'bg-amber-50 text-amber-800 ring-amber-200 before:bg-amber-500',
  approvedState: 'bg-emerald-50 text-emerald-700 ring-emerald-200 before:bg-emerald-500',
  overridden: 'bg-indigo-50 text-indigo-700 ring-indigo-200 before:bg-indigo-500',
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200 before:bg-emerald-500',
  'refresh due': 'bg-amber-50 text-amber-800 ring-amber-200 before:bg-amber-500',
  retired: 'bg-slate-100 text-slate-600 ring-slate-200 before:bg-slate-400'
};

export function StatusBadge({ value }: { value: string | RiskRating }) {
  return (
    <Badge
      tone="custom"
      className={clsx(
        'rounded-full capitalize before:h-1.5 before:w-1.5 before:rounded-full',
        variants[value] ?? variants[value === 'approved' ? 'approvedState' : 'not connected']
      )}
    >
      {value}
    </Badge>
  );
}

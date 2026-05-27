import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';
import { compact } from '../lib/format';

export function MetricCard({
  label,
  value,
  change,
  icon: Icon,
  href,
  money
}: {
  label: string;
  value: number;
  change?: number;
  icon: LucideIcon;
  href?: string;
  money?: boolean;
}) {
  const formatted = money ? compact(value) : value > 999 ? compact(value) : value.toLocaleString('en-AU');
  const trendIsPositive = (change ?? 0) >= 0;
  const body = (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-cyan-200 hover:shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <div className="rounded-md bg-cyan-50 p-2 text-cyan-700">
          <Icon className="h-5 w-5" />
        </div>
        {change !== undefined ? (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trendIsPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trendIsPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        ) : null}
      </div>
      <div className="mt-4 text-2xl font-semibold tracking-normal text-ink">{money ? `$${formatted}` : formatted}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  );
  return href ? <a href={href}>{body}</a> : body;
}

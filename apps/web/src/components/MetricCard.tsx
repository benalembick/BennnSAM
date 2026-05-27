import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';
import { compact } from '../lib/format';
import { cardSurface } from './ui';

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
  const sparkValues = [34, 42, 39, 48, 44, trendIsPositive ? 58 : 36, trendIsPositive ? 66 : 30];
  const points = sparkValues.map((sparkValue, index) => `${index * 9},${70 - sparkValue}`).join(' ');
  const body = (
    <div
      className={`${cardSurface} group min-h-[128px] rounded-lg p-3.5 transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-panel`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-md bg-gradient-to-br from-cyan-50 to-slate-50 p-2 text-cyan-700 ring-1 ring-inset ring-cyan-100">
          <Icon className="h-4 w-4" />
        </div>
        {change !== undefined ? (
          <div
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ring-inset ${
              trendIsPositive ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-rose-50 text-rose-700 ring-rose-200'
            }`}
          >
            {trendIsPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        ) : null}
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[1.7rem] font-semibold leading-none tracking-tight text-slate-950">{money ? `$${formatted}` : formatted}</div>
          <div className="mt-1.5 text-xs font-medium text-slate-500">{label}</div>
        </div>
        <svg className="h-9 w-16 shrink-0 overflow-visible" viewBox="0 0 54 44" aria-hidden="true">
          <polyline
            fill="none"
            points={points}
            stroke={trendIsPositive ? '#059669' : '#e11d48'}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.25"
          />
        </svg>
      </div>
    </div>
  );
  return href ? (
    <a className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2" href={href}>
      {body}
    </a>
  ) : (
    body
  );
}

export const StatCard = MetricCard;

import clsx from 'clsx';
import type React from 'react';
import type { LucideIcon } from 'lucide-react';

export const cardSurface =
  'border border-slate-200/80 bg-white/95 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_45px_rgba(15,23,42,0.04)]';

export function Button({
  children,
  className,
  icon: Icon,
  variant = 'secondary',
  size = 'md',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'icon';
}) {
  return (
    <button
      className={clsx(
        'inline-flex min-w-0 shrink-0 items-center justify-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap rounded-md font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
        size === 'sm' && 'h-8 px-2.5 text-xs',
        size === 'md' && 'h-9 px-3 text-sm',
        size === 'icon' && 'h-9 w-9 p-0',
        variant === 'primary' && 'bg-slate-950 text-white shadow-sm hover:bg-slate-800',
        variant === 'secondary' && 'border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50',
        variant === 'ghost' && 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
        variant === 'danger' && 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
        className
      )}
      {...props}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
  leadingIcon: Icon
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  leadingIcon: LucideIcon;
}) {
  return (
    <label className={clsx('relative block', className)}>
      <span className="sr-only">{placeholder}</span>
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        className="h-9 w-full rounded-md border-slate-200 bg-white/90 pl-9 pr-3 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-cyan-500 focus:ring-cyan-500"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export function Badge({
  children,
  tone = 'neutral',
  className
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'risk' | 'info' | 'automation' | 'custom';
  className?: string;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset',
        tone === 'neutral' && 'bg-slate-100 text-slate-700 ring-slate-200',
        tone === 'brand' && 'bg-cyan-50 text-cyan-700 ring-cyan-200',
        tone === 'success' && 'bg-emerald-50 text-emerald-700 ring-emerald-200',
        tone === 'warning' && 'bg-amber-50 text-amber-800 ring-amber-200',
        tone === 'risk' && 'bg-rose-50 text-rose-700 ring-rose-200',
        tone === 'info' && 'bg-indigo-50 text-indigo-700 ring-indigo-200',
        tone === 'automation' && 'bg-violet-50 text-violet-700 ring-violet-200',
        className
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  eyebrow,
  description,
  action
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-700">{eyebrow}</div> : null}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function InsightCard({
  title,
  description,
  children,
  className,
  variant = 'default'
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass';
}) {
  return (
    <section
      className={clsx(
        'rounded-lg p-4',
        variant === 'default' && cardSurface,
        variant === 'glass' && 'border border-white/10 bg-white/10 shadow-none',
        className
      )}
    >
      <div className="mb-4">
        <h2 className={clsx('text-sm font-semibold', variant === 'glass' ? 'text-cyan-100' : 'text-slate-950')}>{title}</h2>
        {description ? <p className={clsx('mt-1 text-sm', variant === 'glass' ? 'text-cyan-50' : 'text-slate-500')}>{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function ChartCard({
  title,
  insight,
  children,
  action
}: {
  title: string;
  insight?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className={clsx('overflow-hidden rounded-lg', cardSurface)}>
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
          {insight ? <p className="mt-1 text-xs text-slate-500">{insight}</p> : null}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function EmptyState({
  title = 'No records found',
  message = 'Try adjusting the current filters or search term.'
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
      <div className="text-sm font-semibold text-slate-800">{title}</div>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>
    </div>
  );
}

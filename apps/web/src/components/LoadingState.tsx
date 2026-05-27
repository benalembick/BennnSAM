import { cardSurface } from './ui';

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div className={`${cardSurface} rounded-lg p-8 text-center text-sm font-medium text-slate-500`}>
      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-cyan-600" />
      {label}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm font-medium text-rose-700 shadow-sm">
      {message}
    </div>
  );
}

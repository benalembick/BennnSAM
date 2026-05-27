import type React from 'react';
import { X } from 'lucide-react';

export function Drawer({
  title,
  children,
  onClose
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40">
      <button className="absolute inset-0 bg-slate-950/20" onClick={onClose} type="button" aria-label="Close drawer" />
      <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-ink" onClick={onClose} type="button">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </aside>
    </div>
  );
}

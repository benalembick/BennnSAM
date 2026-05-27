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
      <button className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm" onClick={onClose} type="button" aria-label="Close drawer" />
      <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 p-4 backdrop-blur">
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500" onClick={onClose} type="button">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </aside>
    </div>
  );
}

import { ArrowDownUp, Download, Search } from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { downloadCsv } from '../lib/csv';

export interface Column<T extends object> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
}

export function DataTable<T extends object>({
  title,
  rows,
  columns,
  filename,
  searchPlaceholder = 'Search records',
  onRowClick
}: {
  title: string;
  rows: T[];
  columns: Array<Column<T>>;
  filename: string;
  searchPlaceholder?: string;
  onRowClick?: (row: T) => void;
}) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<string>(String(columns[0]?.key ?? ''));
  const [ascending, setAscending] = useState(true);

  const visibleRows = useMemo(() => {
    const q = query.toLowerCase();
    return rows
      .filter((row) => !q || JSON.stringify(row).toLowerCase().includes(q))
      .sort((a, b) => {
        const column = columns.find((candidate) => String(candidate.key) === sortKey);
        const aValue = column?.sortValue ? column.sortValue(a) : ((a as Record<string, unknown>)[sortKey] as string | number | undefined);
        const bValue = column?.sortValue ? column.sortValue(b) : ((b as Record<string, unknown>)[sortKey] as string | number | undefined);
        return String(aValue ?? '').localeCompare(String(bValue ?? ''), undefined, { numeric: true }) * (ascending ? 1 : -1);
      });
  }, [ascending, columns, query, rows, sortKey]);

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <p className="text-sm text-slate-500">{visibleRows.length.toLocaleString('en-AU')} records</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              className="h-9 w-full rounded-md border-slate-200 pl-9 text-sm focus:border-cyan-500 focus:ring-cyan-500 sm:w-64"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
            />
          </label>
          <button
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => downloadCsv(filename, visibleRows as Array<Record<string, unknown>>)}
            type="button"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
        </div>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)} className="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-600">
                  <button
                    className="inline-flex items-center gap-1 hover:text-cyan-700"
                    onClick={() => {
                      setSortKey(String(column.key));
                      setAscending((current) => (sortKey === String(column.key) ? !current : true));
                    }}
                    type="button"
                  >
                    {column.header}
                    <ArrowDownUp className="h-3.5 w-3.5" />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {visibleRows.map((row, rowIndex) => (
              <tr
                key={String((row as { id?: string | number }).id ?? rowIndex)}
                className={onRowClick ? 'cursor-pointer hover:bg-cyan-50/50' : 'hover:bg-slate-50'}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td key={String(column.key)} className="max-w-xs whitespace-nowrap px-4 py-3 text-slate-700">
                    {column.render ? column.render(row) : String((row as Record<string, unknown>)[String(column.key)] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {visibleRows.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500">No records match the current filters.</div>
      ) : null}
    </section>
  );
}

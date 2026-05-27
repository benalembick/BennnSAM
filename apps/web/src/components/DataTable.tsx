import { ArrowDownUp, ChevronLeft, ChevronRight, Download, MoreHorizontal, Search } from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { downloadCsv } from '../lib/csv';
import { Button, EmptyState, SearchInput, cardSurface } from './ui';

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
  const [page, setPage] = useState(1);
  const pageSize = 10;

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

  const pageCount = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const pagedRows = visibleRows.slice((page - 1) * pageSize, page * pageSize);
  const rangeStart = visibleRows.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, visibleRows.length);

  useEffect(() => {
    setPage(1);
  }, [query, rows]);

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  return (
    <section className={`${cardSurface} overflow-hidden rounded-lg`}>
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
          <p className="mt-0.5 text-xs font-medium text-slate-500">{visibleRows.length.toLocaleString('en-AU')} records</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <SearchInput className="sm:w-64" value={query} onChange={setQuery} placeholder={searchPlaceholder} leadingIcon={Search} />
          <Button
            icon={Download}
            onClick={() => downloadCsv(filename, visibleRows as Array<Record<string, unknown>>)}
            type="button"
          >
            CSV
          </Button>
        </div>
      </div>
      <div className="max-h-[620px] overflow-auto scrollbar-thin">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className="whitespace-nowrap px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500"
                  scope="col"
                  aria-sort={sortKey === String(column.key) ? (ascending ? 'ascending' : 'descending') : 'none'}
                >
                  <button
                    className="inline-flex items-center gap-1 rounded text-left hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
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
              {onRowClick ? (
                <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wide text-slate-500" scope="col">
                  Actions
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {pagedRows.map((row, rowIndex) => (
              <tr
                key={String((row as { id?: string | number }).id ?? rowIndex)}
                className={onRowClick ? 'cursor-pointer transition hover:bg-cyan-50/60 focus:bg-cyan-50/60' : 'transition hover:bg-slate-50'}
                onClick={() => onRowClick?.(row)}
                onKeyDown={(event) => {
                  if (!onRowClick) return;
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onRowClick(row);
                  }
                }}
                tabIndex={onRowClick ? 0 : undefined}
              >
                {columns.map((column) => (
                  <td key={String(column.key)} className="max-w-xs whitespace-nowrap px-4 py-2.5 text-[13px] font-medium text-slate-700">
                    {column.render ? column.render(row) : String((row as Record<string, unknown>)[String(column.key)] ?? '')}
                  </td>
                ))}
                {onRowClick ? (
                  <td className="px-4 py-2.5 text-right">
                    <Button
                      aria-label="Open row details"
                      icon={MoreHorizontal}
                      onClick={(event) => {
                        event.stopPropagation();
                        onRowClick(row);
                      }}
                      size="icon"
                      type="button"
                      variant="ghost"
                    />
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {visibleRows.length === 0 ? (
        <div className="p-4">
          <EmptyState />
        </div>
      ) : null}
      <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-xs font-medium text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Showing {rangeStart.toLocaleString('en-AU')} to {rangeEnd.toLocaleString('en-AU')} of {visibleRows.length.toLocaleString('en-AU')}
        </span>
        <div className="flex items-center gap-2">
          <Button aria-label="Previous page" disabled={page <= 1} icon={ChevronLeft} onClick={() => setPage((current) => Math.max(1, current - 1))} size="icon" type="button" variant="secondary" />
          <span className="min-w-20 text-center">
            Page {page} of {pageCount}
          </span>
          <Button aria-label="Next page" disabled={page >= pageCount} icon={ChevronRight} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} size="icon" type="button" variant="secondary" />
        </div>
      </div>
    </section>
  );
}

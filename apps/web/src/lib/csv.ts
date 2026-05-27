export function toCsv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    const raw = Array.isArray(value) ? value.join('; ') : String(value ?? '');
    return `"${raw.replaceAll('"', '""')}"`;
  };
  return [headers.map(escape).join(','), ...rows.map((row) => headers.map((header) => escape(row[header])).join(','))].join('\n');
}

export function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function readCsv(file: File) {
  const text = await file.text();
  const [headerLine = '', ...lines] = text.split(/\r?\n/).filter(Boolean);
  const headers = headerLine.split(',').map((header) => header.trim().replace(/^"|"$/g, ''));
  return lines.map((line) => {
    const values = line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, ''));
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

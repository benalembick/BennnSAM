export const currency = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0
});

export const number = new Intl.NumberFormat('en-AU');

export function compact(value: number) {
  return new Intl.NumberFormat('en-AU', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value);
}

export function date(value: string | null) {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium' }).format(new Date(value));
}

export function titleCase(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (first) => first.toUpperCase());
}

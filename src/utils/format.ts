/** Naira amount, e.g. ₦250,000. Anything that is not a finite number renders as "—". */
export function formatCurrency(amount: unknown): string {
  const value = typeof amount === 'string' && amount.trim() !== '' ? Number(amount) : amount;
  return typeof value === 'number' && Number.isFinite(value) ? `₦${value.toLocaleString()}` : '—';
}

/** Short date, e.g. "Sep 30, 2026". Missing or unparseable input renders as "—". */
export function formatDate(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

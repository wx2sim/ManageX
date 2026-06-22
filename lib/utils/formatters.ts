/**
 * Formats a numeric amount to DZD currency format.
 */
export function formatDZD(amount: number): string {
  const absoluteValue = Math.abs(amount);
  return `${absoluteValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} DZD`;
}

/**
 * Formats a date string into a standard, clean local format.
 */
export function formatDate(dateString: string | Date): string {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats a date string into a month/year label.
 */
export function formatMonthYear(dateString: string | Date): string {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

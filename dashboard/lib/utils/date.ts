export function formatDateTime(value?: string | number | Date, locale: string = 'id-ID') {
  if (!value) return '-';
  try {
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString(locale);
  } catch {
    return '-';
  }
}

export function formatDate(value?: string | number | Date, locale: string = 'id-ID') {
  if (!value) return '-';
  try {
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString(locale);
  } catch {
    return '-';
  }
}
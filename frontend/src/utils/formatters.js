export function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

export function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  }).format(new Date(value));
}

export function formatNumber(value, digits = 2) {
  return Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: digits
  });
}

export function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

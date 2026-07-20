const SEAT_TYPE_LABELS = {
  '1A': 'AC First Class (1A)',
  '2A': 'AC 2 Tier (2A)',
  '3A': 'AC 3 Tier (3A)',
  'CC': 'AC Chair Car (CC)',
  'SL': 'Sleeper Class (SL)',
  '2S': 'Second Sitting (2S)',
};

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return dateStr;
  }
}

export function formatCurrency(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatSeatType(type) {
  return SEAT_TYPE_LABELS[type] || type;
}

export function formatTime(timeStr) {
  if (!timeStr) return '—';
  return timeStr;
}

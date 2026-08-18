// Currency formatter for IDR
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rp0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('IDR', 'Rp').replace(/\s/g, '');
}

// Number formatter
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return new Intl.NumberFormat('id-ID').format(num);
}

// Percentage formatter
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) return '0%';
  return `${value.toFixed(1)}%`;
}

// Date formatter
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

// DateTime formatter
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateStr;
  }
}

// Calculate profit
export function calculateProfit(total: number, totalHpp: number): number {
  return total - totalHpp;
}

// Calculate margin (safe, no NaN/Infinity)
export function calculateMargin(profit: number, total: number): number {
  if (!total || total === 0) return 0;
  const margin = (profit / total) * 100;
  if (!isFinite(margin) || isNaN(margin)) return 0;
  return parseFloat(margin.toFixed(2));
}

// Generate UUID
export function generateId(): string {
  return crypto.randomUUID();
}

// CN utility for classnames
export function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Get date range for filter
export function getDateRange(filter: string): { start: string; end: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (filter) {
    case 'today': {
      const start = today.toISOString().split('T')[0];
      const end = new Date(today.getTime() + 86400000 - 1).toISOString().split('T')[0];
      return { start, end };
    }
    case '7days': {
      const start = new Date(today.getTime() - 6 * 86400000).toISOString().split('T')[0];
      return { start, end: today.toISOString().split('T')[0] };
    }
    case '30days': {
      const start = new Date(today.getTime() - 29 * 86400000).toISOString().split('T')[0];
      return { start, end: today.toISOString().split('T')[0] };
    }
    case 'this_month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      return { start, end };
    }
    case 'last_month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      return { start, end };
    }
    case 'this_year': {
      const start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      const end = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
      return { start, end };
    }
    default: {
      // all time — return wide range
      return { start: '2020-01-01', end: '2099-12-31' };
    }
  }
}

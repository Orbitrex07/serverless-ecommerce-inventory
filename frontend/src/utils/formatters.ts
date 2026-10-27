export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC'
    }).format(date) + ' UTC';
  } catch {
    return isoString;
  }
}

export type StockStatusType = 'in-stock' | 'low-stock' | 'out-of-stock';

export function getStockStatus(stock: number): {
  type: StockStatusType;
  label: string;
  badgeClass: string;
} {
  if (stock <= 0) {
    return {
      type: 'out-of-stock',
      label: 'Sold Out',
      badgeClass: 'bg-red-50 text-red-700 border-red-200'
    };
  }
  if (stock <= 5) {
    return {
      type: 'low-stock',
      label: `Low Stock: ${stock} remaining`,
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200'
    };
  }
  return {
    type: 'in-stock',
    label: `${stock} in stock`,
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  };
}

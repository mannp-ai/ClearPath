export const formatCurrency = (val: number | null | undefined): string => {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

export const formatPercent = (val: number | null | undefined): string => {
  if (val === null || val === undefined || isNaN(val)) return '0.00%';
  return `${Number(val).toFixed(2)}%`;
};

export const formatDuration = (months: number | null | undefined): string => {
  if (months === null || months === undefined || isNaN(months) || months <= 0) return 'N/A';
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) {
    return `${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
  }
  if (remainingMonths === 0) {
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  }
  return `${years}y ${remainingMonths}m (${months} mos)`;
};

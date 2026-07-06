const currencyMap = {
  PHP: '₱',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  INR: '₹',
  CAD: '$',
  AUD: '$',
  CNY: '¥',
};

export function getCurrencySymbol(currencyCode = 'PHP') {
  return currencyMap[currencyCode] || '₱';
}

export function formatCurrency(value, { currencyCode = 'PHP', currencySymbol = getCurrencySymbol(currencyCode) } = {}) {
  try {
    if (value == null || Number.isNaN(Number(value))) {
      return '';
    }

    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
    }).format(Number(value));
  } catch (error) {
    return `${currencySymbol}${Number(value).toFixed(2)}`;
  }
}

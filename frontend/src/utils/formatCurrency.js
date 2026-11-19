export const SUPPORTED_CURRENCIES = [
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: '$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: '$' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
];

const currencyMap = Object.fromEntries(
  SUPPORTED_CURRENCIES.map(({ code, symbol }) => [code, symbol])
);

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
  } catch {
    return `${currencySymbol}${Number(value).toFixed(2)}`;
  }
}

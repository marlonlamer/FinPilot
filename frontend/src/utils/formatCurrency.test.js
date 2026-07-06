import assert from 'node:assert/strict';
import test from 'node:test';

import { formatCurrency } from './formatCurrency.js';

test('formats currency with Intl when a supported code is provided', () => {
  const value = 1234.5;
  const expected = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(Number(value));

  assert.equal(formatCurrency(value, { currencyCode: 'PHP', currencySymbol: '₱' }), expected);
});

test('falls back to symbol formatting when Intl throws', () => {
  assert.equal(formatCurrency(42, { currencyCode: 'INVALID', currencySymbol: '₱' }), '₱42.00');
});

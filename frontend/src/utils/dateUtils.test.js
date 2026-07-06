import assert from 'node:assert/strict';
import test from 'node:test';

import { formatYearMonth } from './dateUtils.js';

test('formats a year and month to YYYY-MM', () => {
  assert.equal(formatYearMonth(2026, 0), '2026-01');
  assert.equal(formatYearMonth(2026, 9), '2026-10');
  assert.equal(formatYearMonth(1999, 11), '1999-12');
});

import assert from 'node:assert/strict';
import test from 'node:test';

import { clampPercentage } from './clampPercentage.js';

test('clamps values to the 0-100 range', () => {
  assert.equal(clampPercentage(42), 42);
  assert.equal(clampPercentage(0), 0);
  assert.equal(clampPercentage(100), 100);
  assert.equal(clampPercentage(120), 100);
  assert.equal(clampPercentage(-10), 0);
  assert.equal(clampPercentage(undefined), 0);
  assert.equal(clampPercentage(null), 0);
});

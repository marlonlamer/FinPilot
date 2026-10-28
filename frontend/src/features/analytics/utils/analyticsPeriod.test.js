import assert from "node:assert/strict";
import test from "node:test";

import {
  getAdjacentMonth,
  getAdjacentYear,
  isValidAnalyticsYear
} from "./analyticsPeriod.js";

test("previous and next month navigation crosses year boundaries", () => {
  assert.deepEqual(getAdjacentMonth({ year: 2026, month: 0 }, -1), {
    year: 2025,
    month: 11
  });
  assert.deepEqual(getAdjacentMonth({ year: 2025, month: 11 }, 1), {
    year: 2026,
    month: 0
  });
});

test("year navigation changes the year without changing period mode", () => {
  assert.equal(getAdjacentYear(2026, -1), 2025);
  assert.equal(getAdjacentYear(2026, 1), 2027);
});

test("accepts only whole years in the supported selector range", () => {
  assert.equal(isValidAnalyticsYear(2026), true);
  assert.equal(isValidAnalyticsYear("2026"), true);
  assert.equal(isValidAnalyticsYear(1899), false);
  assert.equal(isValidAnalyticsYear(10000), false);
  assert.equal(isValidAnalyticsYear("26"), false);
});

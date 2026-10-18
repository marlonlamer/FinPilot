import assert from "node:assert/strict";
import test from "node:test";

import { getIncomeComparisonSummary } from "./incomeComparison.js";

test("shows a green upward comparison when income increases", () => {
  assert.deepEqual(getIncomeComparisonSummary(112.5, 100, "month"), {
    text: "↑ 12.5% vs previous month",
    direction: "up"
  });
});

test("shows a red downward comparison when income decreases", () => {
  assert.deepEqual(getIncomeComparisonSummary(91.5, 100, "month"), {
    text: "↓ 8.5% vs previous month",
    direction: "down"
  });
});

test("shows a neutral zero-change comparison", () => {
  assert.deepEqual(getIncomeComparisonSummary(100, 100, "month"), {
    text: "0.0% vs previous month",
    direction: null
  });
});

test("uses a neutral fallback when the previous period has no income", () => {
  assert.deepEqual(getIncomeComparisonSummary(100, 0, "month"), {
    text: "No previous data",
    direction: null
  });
  assert.deepEqual(getIncomeComparisonSummary(0, 0, "month"), {
    text: "No previous data",
    direction: null
  });
});

test("uses a stable neutral fallback for non-finite comparison data", () => {
  assert.deepEqual(getIncomeComparisonSummary(Infinity, 100, "month"), {
    text: "No previous data",
    direction: null
  });
});

test("preserves selected-period labels and all-time behavior", () => {
  assert.deepEqual(getIncomeComparisonSummary(150, 100, "week"), {
    text: "↑ 50.0% vs previous week",
    direction: "up"
  });
  assert.deepEqual(getIncomeComparisonSummary(150, 100, "all"), {
    text: "Total income",
    direction: null
  });
});

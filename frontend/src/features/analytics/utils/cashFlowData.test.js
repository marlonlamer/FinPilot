import assert from "node:assert/strict";
import test from "node:test";

import { buildCashFlowData, getCashFlowAvailability } from "./cashFlowData.js";

const options = {
  selectedYear: 2026,
  selectedMonth: 9
};

test("monthly data groups actual records by day and preserves negative net flow", () => {
  const result = buildCashFlowData({
    ...options,
    timeframe: "monthly",
    incomes: [
      { amount: 100, date: "2026-10-03T08:00:00.000Z" },
      { amount: 50, date: "2026-10-03T10:00:00.000Z" }
    ],
    expenses: [{ amount: 200, date: "2026-10-03T12:00:00.000Z" }]
  });

  assert.equal(result.length, 31);
  assert.deepEqual(result[2], {
    key: "2026-10-03",
    label: "3",
    income: 150,
    expense: 200,
    net: -50
  });
  assert.equal(result[0].net, 0);
});

test("yearly data aggregates full selected-year history by month", () => {
  const result = buildCashFlowData({
    ...options,
    timeframe: "yearly",
    incomes: [
      { amount: 75, date: "2026-01-15T00:00:00.000Z" },
      { amount: 25, date: "2026-01-29T00:00:00.000Z" },
      { amount: 500, date: "2025-12-31T23:59:00.000Z" }
    ],
    expenses: [{ amount: 150, date: "2026-12-12T00:00:00.000Z" }]
  });

  assert.equal(result.length, 12);
  assert.deepEqual(result[0], {
    key: "2026-01",
    label: "Jan",
    income: 100,
    expense: 0,
    net: 100
  });
  assert.equal(result[11].net, -150);
});

test("all-time data spans the full available transaction history", () => {
  const result = buildCashFlowData({
    ...options,
    timeframe: "all",
    incomes: [
      { amount: 300, date: "2024-12-05T00:00:00.000Z" },
      { amount: 50, date: "2026-02-05T00:00:00.000Z" }
    ],
    expenses: [{ amount: 80, date: "2025-02-05T00:00:00.000Z" }]
  });

  assert.equal(result.length, 15);
  assert.equal(result[0].key, "2024-12");
  assert.equal(result[1].key, "2025-01");
  assert.equal(result[1].net, 0);
  assert.equal(result.at(-1).key, "2026-02");
});

test("empty, invalid-dated, and out-of-period records do not fabricate chart data", () => {
  assert.deepEqual(buildCashFlowData({
    ...options,
    timeframe: "monthly",
    incomes: [],
    expenses: []
  }), []);

  assert.deepEqual(buildCashFlowData({
    ...options,
    timeframe: "monthly",
    incomes: [{ amount: 100, date: "invalid" }],
    expenses: [{ amount: 200, date: "2026-09-10T00:00:00.000Z" }]
  }), []);
});

test("keeps successfully loaded data available when Income fails", () => {
  assert.deepEqual(getCashFlowAvailability(undefined, [], "unavailable", "loaded"), {
    incomeAvailable: false,
    expenseAvailable: true,
    hasAvailableData: true,
    isLoading: false,
    showInitialLoading: false,
    bothUnavailable: false
  });
});

test("keeps successfully loaded data available when Expenses fail", () => {
  assert.deepEqual(getCashFlowAvailability([], undefined, "loaded", "unavailable"), {
    incomeAvailable: true,
    expenseAvailable: false,
    hasAvailableData: true,
    isLoading: false,
    showInitialLoading: false,
    bothUnavailable: false
  });
});

test("shows full unavailable state only when neither source loaded or is pending", () => {
  assert.deepEqual(getCashFlowAvailability(undefined, undefined, "unavailable", "unavailable"), {
    incomeAvailable: false,
    expenseAvailable: false,
    hasAvailableData: false,
    isLoading: false,
    showInitialLoading: false,
    bothUnavailable: true
  });
});

test("keeps loading state while no source has completed", () => {
  assert.deepEqual(getCashFlowAvailability(undefined, undefined, "loading", "loading"), {
    incomeAvailable: false,
    expenseAvailable: false,
    hasAvailableData: false,
    isLoading: true,
    showInitialLoading: true,
    bothUnavailable: false
  });
});

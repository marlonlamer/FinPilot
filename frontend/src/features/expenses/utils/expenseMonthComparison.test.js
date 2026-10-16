import assert from "node:assert/strict";
import test from "node:test";

import { getExpenseMonthComparison } from "./expenseMonthComparison.js";

const expense = (date, amount) => ({ date, amount });

test("reports an increase compared with the previous month", () => {
  const result = getExpenseMonthComparison([
    expense("2026-01-10", 80),
    expense("2026-02-10", 90)
  ], "2026-02");

  assert.deepEqual(result, { text: "↑ 12.5% vs previous month", direction: "up" });
});

test("reports a decrease compared with the previous month", () => {
  const result = getExpenseMonthComparison([
    expense("2026-01-10", 100),
    expense("2026-02-10", 90)
  ], "2026-02");

  assert.deepEqual(result, { text: "↓ 10.0% vs previous month", direction: "down" });
});

test("reports equal month totals with a neutral indicator", () => {
  const result = getExpenseMonthComparison([
    expense("2026-01-10", 100),
    expense("2026-02-10", 100)
  ], "2026-02");

  assert.deepEqual(result, { text: "0.0% vs previous month", direction: null });
});

test("uses a neutral fallback when the previous month has no expenses", () => {
  assert.deepEqual(
    getExpenseMonthComparison([expense("2026-02-10", 25)], "2026-02"),
    { text: "No previous data", direction: null }
  );
});

test("uses a neutral fallback when both months have zero expenses", () => {
  assert.deepEqual(getExpenseMonthComparison([
    expense("2026-01-10", 0),
    expense("2026-02-10", 0)
  ], "2026-02"), { text: "No previous data", direction: null });
});

test("reports a 100 percent decrease when current-month expenses are zero", () => {
  const result = getExpenseMonthComparison([
    expense("2026-01-10", 40),
    expense("2026-02-10", 0)
  ], "2026-02");

  assert.deepEqual(result, { text: "↓ 100.0% vs previous month", direction: "down" });
});

test("compares January with December of the prior year", () => {
  const result = getExpenseMonthComparison([
    expense("2025-12-10", 80),
    expense("2026-01-10", 100)
  ], "2026-01");

  assert.deepEqual(result, { text: "↑ 25.0% vs previous month", direction: "up" });
});

test("applies the same expense filters to both months and recalculates with new data", () => {
  const matchesCategory = (item) => item.category === "food";
  const expenses = [
    { ...expense("2026-01-10", 100), category: "food" },
    { ...expense("2026-01-11", 200), category: "travel" },
    { ...expense("2026-02-10", 150), category: "food" }
  ];

  assert.deepEqual(getExpenseMonthComparison(expenses, "2026-02", matchesCategory), {
    text: "↑ 50.0% vs previous month",
    direction: "up"
  });
  assert.deepEqual(getExpenseMonthComparison([
    ...expenses,
    { ...expense("2026-02-11", 50), category: "food" }
  ], "2026-02", matchesCategory), {
    text: "↑ 100.0% vs previous month",
    direction: "up"
  });
});

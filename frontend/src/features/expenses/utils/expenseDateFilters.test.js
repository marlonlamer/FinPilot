import assert from "node:assert/strict";
import test from "node:test";

import {
  getExpenseDateRange,
  getIsoWeekValue,
  getLocalDateValue,
  isDateWithinRange
} from "./expenseDateFilters.js";

test("filters a selected local calendar day through its final timestamp", () => {
  const range = getExpenseDateRange({ timeframe: "day", dayValue: "2026-03-08" });
  assert.equal(isDateWithinRange(new Date(2026, 2, 8, 23, 59, 59, 999), range), true);
  assert.equal(isDateWithinRange(new Date(2026, 2, 9), range), false);
});

test("includes all days of an ISO week crossing a month boundary", () => {
  const selectedWeek = getIsoWeekValue(new Date(2026, 2, 1));
  const range = getExpenseDateRange({ timeframe: "week", weekValue: selectedWeek });
  assert.equal(getLocalDateValue(range.start), "2026-02-23");
  assert.equal(getLocalDateValue(new Date(range.end.getTime() - 1)), "2026-03-01");
  assert.equal(isDateWithinRange(new Date(2026, 2, 1, 23, 59, 59, 999), range), true);
  assert.equal(isDateWithinRange(new Date(2026, 2, 2), range), false);
});

test("handles ISO weeks that cross a year boundary", () => {
  const selectedWeek = getIsoWeekValue(new Date(2021, 0, 1));
  const range = getExpenseDateRange({ timeframe: "week", weekValue: selectedWeek });
  assert.equal(selectedWeek, "2020-W53");
  assert.equal(getLocalDateValue(range.start), "2020-12-28");
  assert.equal(getLocalDateValue(new Date(range.end.getTime() - 1)), "2021-01-03");
});

test("selects a non-current month without including adjacent dates", () => {
  const range = getExpenseDateRange({ timeframe: "month", monthValue: "2025-12" });
  assert.equal(isDateWithinRange(new Date(2025, 11, 1), range), true);
  assert.equal(isDateWithinRange(new Date(2025, 11, 31, 23, 59, 59, 999), range), true);
  assert.equal(isDateWithinRange(new Date(2026, 0, 1), range), false);
});

test("selects an entire year across all months", () => {
  const range = getExpenseDateRange({ timeframe: "year", yearValue: "2024" });
  assert.equal(isDateWithinRange(new Date(2024, 0, 1), range), true);
  assert.equal(isDateWithinRange(new Date(2024, 11, 31, 23, 59, 59, 999), range), true);
  assert.equal(isDateWithinRange(new Date(2025, 0, 1), range), false);
});

test("rejects malformed and impossible date selections", () => {
  assert.equal(getExpenseDateRange({ timeframe: "day", dayValue: "2026-02-30" }), null);
  assert.equal(getExpenseDateRange({ timeframe: "week", weekValue: "2026-W54" }), null);
  assert.equal(getExpenseDateRange({ timeframe: "month", monthValue: "2026-13" }), null);
});

test("All Time has no date restriction", () => {
  assert.equal(getExpenseDateRange({ timeframe: "all" }), null);
});

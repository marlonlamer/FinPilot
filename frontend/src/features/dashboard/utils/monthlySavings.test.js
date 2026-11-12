import assert from "node:assert/strict";
import test from "node:test";

import { getMonthlySavingsNet } from "./monthlySavings.js";

test("sums signed savings transactions within only the selected month", () => {
  const transactions = [
    { amount: 150, date: "2026-03-01" },
    { amount: -40, date: "2026-03-31" },
    { amount: 500, date: "2026-04-01" },
    { amount: 900, date: "2025-03-15" }
  ];

  assert.equal(getMonthlySavingsNet(transactions, 2026, 2), 110);
});

test("returns zero for months without savings transactions", () => {
  assert.equal(getMonthlySavingsNet([{ amount: 25, date: "2026-03-04" }], 2026, 3), 0);
});

test("ignores invalid dates and nonnumeric amounts", () => {
  assert.equal(getMonthlySavingsNet([
    { amount: 10, date: "invalid" },
    { amount: "invalid", date: "2026-03-10" }
  ], 2026, 2), 0);
});

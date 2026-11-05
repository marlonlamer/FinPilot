import assert from "node:assert/strict";
import test from "node:test";

import { buildMonthlyStatement } from "./monthlyStatement.js";

test("aggregates actual transactions into all twelve selected-year months", () => {
  const statement = buildMonthlyStatement({
    year: 2026,
    incomeAvailable: true,
    expenseAvailable: true,
    incomes: [
      { amount: 125, date: "2026-01-03T08:00:00.000Z" },
      { amount: 75, date: "2026-03-19T13:00:00.000Z" },
      { amount: 900, date: "2025-03-19T13:00:00.000Z" }
    ],
    expenses: [
      { amount: 25, date: "2026-01-28T13:00:00.000Z" },
      { amount: 50, date: "2026-03-29T13:00:00.000Z" }
    ]
  });

  assert.equal(statement.rows.length, 12);
  assert.deepEqual(statement.rows[0], {
    month: "January",
    monthIndex: 0,
    income: 125,
    expenditure: 25,
    net: 100,
    proportion: 33.33333333333333
  });
  assert.equal(statement.rows[1].income, 0);
  assert.equal(statement.rows[1].expenditure, 0);
  assert.equal(statement.rows[2].net, 25);
  assert.deepEqual(statement.totals, {
    income: 200,
    expenditure: 75,
    net: 125,
    proportion: 100
  });
});

test("zero yearly expenditure produces 0.00 percent proportions", () => {
  const statement = buildMonthlyStatement({
    year: 2026,
    incomeAvailable: true,
    expenseAvailable: true,
    incomes: [{ amount: 10, date: "2026-04-04T00:00:00.000Z" }],
    expenses: []
  });

  assert.ok(statement.rows.every((row) => row.proportion === 0));
  assert.equal(statement.totals.proportion, 0);
  assert.equal(statement.totals.expenditure, 0);
});

test("income-only availability does not invent expenditure, net, or proportions", () => {
  const statement = buildMonthlyStatement({
    year: 2026,
    incomeAvailable: true,
    expenseAvailable: false,
    incomes: [{ amount: 80, date: "2026-06-11T00:00:00.000Z" }],
    expenses: []
  });

  assert.equal(statement.totals.income, 80);
  assert.equal(statement.totals.expenditure, null);
  assert.equal(statement.totals.net, null);
  assert.equal(statement.rows[5].income, 80);
  assert.equal(statement.rows[5].expenditure, null);
  assert.equal(statement.rows[5].net, null);
  assert.equal(statement.rows[5].proportion, null);
});

test("expense-only availability retains spending while income and net stay unavailable", () => {
  const statement = buildMonthlyStatement({
    year: 2026,
    incomeAvailable: false,
    expenseAvailable: true,
    incomes: [],
    expenses: [{ amount: 30, date: "2026-08-21T00:00:00.000Z" }]
  });

  assert.equal(statement.totals.income, null);
  assert.equal(statement.totals.expenditure, 30);
  assert.equal(statement.totals.net, null);
  assert.equal(statement.totals.proportion, 100);
  assert.equal(statement.rows[7].income, null);
  assert.equal(statement.rows[7].expenditure, 30);
});

test("both unavailable sources return unavailable figures and an empty year", () => {
  const statement = buildMonthlyStatement({
    year: 2026,
    incomeAvailable: false,
    expenseAvailable: false,
    incomes: [],
    expenses: []
  });

  assert.equal(statement.rows.length, 12);
  assert.equal(statement.totals.income, null);
  assert.equal(statement.totals.expenditure, null);
  assert.equal(statement.totals.net, null);
  assert.equal(statement.totals.proportion, null);
  assert.equal(statement.hasTransactions, false);
});

test("a loaded but empty year has twelve zero rows", () => {
  const statement = buildMonthlyStatement({
    year: 2024,
    incomeAvailable: true,
    expenseAvailable: true,
    incomes: [{ amount: 100, date: "2023-12-31T23:59:00.000Z" }],
    expenses: []
  });

  assert.equal(statement.rows.length, 12);
  assert.ok(statement.rows.every((row) =>
    row.income === 0 && row.expenditure === 0 && row.net === 0 && row.proportion === 0
  ));
  assert.equal(statement.hasTransactions, false);
});

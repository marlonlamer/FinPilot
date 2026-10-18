import assert from "node:assert/strict";
import test from "node:test";

import { buildIncomeCategoryData } from "./incomeCategoryData.js";

test("groups income records by category, sums amounts, sorts, and calculates percentages", () => {
  const { data, total } = buildIncomeCategoryData([
    { category: "Salary", amount: "1000" },
    { category: "salary", amount: 500 },
    { category: "Freelance", amount: 500 }
  ]);

  assert.equal(total, 2000);
  assert.deepEqual(data.map(({ name, value, percent }) => ({ name, value, percent })), [
    { name: "Salary", value: 1500, percent: 75 },
    { name: "Freelance", value: 500, percent: 25 }
  ]);
  assert.notEqual(data[0].color, data[1].color);
});

test("handles one category and missing category labels", () => {
  const { data, total } = buildIncomeCategoryData([
    { category: "", title: "", type: "", amount: 125 },
    { amount: 75 }
  ]);

  assert.equal(total, 200);
  assert.deepEqual(data.map(({ name, value, percent }) => ({ name, value, percent })), [
    { name: "Uncategorized", value: 200, percent: 100 }
  ]);
});

test("returns an empty zero-total result for empty, invalid, or non-positive records", () => {
  assert.deepEqual(buildIncomeCategoryData([]), { data: [], total: 0 });
  assert.deepEqual(buildIncomeCategoryData([
    { category: "Salary", amount: "not-a-number" },
    { category: "Refund", amount: -25 },
    { category: "Bonus", amount: 0 }
  ]), { data: [], total: 0 });
});

test("keeps distinct income records represented once and percentages sum to 100", () => {
  const { data, total } = buildIncomeCategoryData([
    { id: "income-1", category: "Salary", amount: 300 },
    { id: "income-2", category: "Interest", amount: 100 },
    { id: "income-3", category: "Other", amount: 100 }
  ]);

  assert.equal(total, 500);
  assert.equal(data.reduce((sum, category) => sum + category.value, 0), total);
  assert.equal(data.reduce((sum, category) => sum + category.percent, 0), 100);
});

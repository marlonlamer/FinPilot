import assert from "node:assert/strict";
import test from "node:test";

import {
  getIncomeEditFormFields,
  getIncomeRequestFields,
  getIncomeTransactionDisplayFields,
  normalizeIncomeRecord
} from "./incomeTransactionMapping.js";

test("normalizes persisted category, payer, and destination independently", () => {
  const income = normalizeIncomeRecord({
    id: 1,
    title: "Salary",
    source: "ABC Company",
    destination: "GCash"
  });

  assert.equal(income.category, "Salary");
  assert.equal(income.source, "ABC Company");
  assert.equal(income.payer, "ABC Company");
  assert.equal(income.destination, "GCash");
});

test("maps category, payer, and destination to distinct transaction display fields", () => {
  assert.deepEqual(getIncomeTransactionDisplayFields({
    category: "Salary",
    source: "ABC Company",
    payer: "ABC Company",
    destination: "GCash"
  }), {
    title: "ABC Company",
    category: "Salary",
    account: "GCash"
  });
});

test("maps each persisted value to its matching edit input", () => {
  assert.deepEqual(getIncomeEditFormFields({
    category: "Salary",
    source: "ABC Company",
    destination: "GCash"
  }), {
    description: "ABC Company",
    source: "GCash"
  });
});

test("maps payer and destination independently into the income API fields", () => {
  assert.deepEqual(getIncomeRequestFields({
    payer: " ABC Company ",
    destination: " GCash "
  }), {
    source: "ABC Company",
    destination: "GCash"
  });
});

test("allows an empty optional payer without borrowing the destination", () => {
  assert.deepEqual(getIncomeRequestFields({
    payer: "",
    destination: "GCash"
  }), {
    source: "",
    destination: "GCash"
  });
});

test("does not substitute category or destination for an absent payer", () => {
  assert.deepEqual(getIncomeTransactionDisplayFields({
    category: "Salary",
    destination: "GCash"
  }), {
    title: "Income",
    category: "Salary",
    account: "GCash"
  });
  assert.deepEqual(getIncomeEditFormFields({
    category: "Salary",
    destination: "GCash"
  }), {
    description: "",
    source: "GCash"
  });
});

test("supports legacy category and payer aliases without conflating destination", () => {
  const income = normalizeIncomeRecord({
    title: "Salary",
    payerSource: "ABC Company",
    destinationAccount: "GCash"
  });

  assert.equal(income.category, "Salary");
  assert.equal(income.payer, "ABC Company");
  assert.equal(income.destination, "GCash");
});

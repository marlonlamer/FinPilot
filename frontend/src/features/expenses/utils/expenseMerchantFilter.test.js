import assert from "node:assert/strict";
import test from "node:test";

import { matchesExpenseMerchant } from "./expenseMerchantFilter.js";

test("matches complete and partial merchant names without case sensitivity", () => {
  const expense = { merchant: "  Green Grocer  " };
  assert.equal(matchesExpenseMerchant(expense, "green grocer"), true);
  assert.equal(matchesExpenseMerchant(expense, "GRO"), true);
});

test("uses known merchant and recipient aliases, including description-backed legacy records", () => {
  assert.equal(matchesExpenseMerchant({ merchantRecipient: "Corner Shop" }, "corner"), true);
  assert.equal(matchesExpenseMerchant({ recipient: "Local Pharmacy" }, "pharmacy"), true);
  assert.equal(matchesExpenseMerchant({ description: "Transit fare" }, "transit"), true);
});

test("ignores unrelated fields and safely handles missing merchant values", () => {
  const expense = { category: "Food", account: "Cash" };
  assert.equal(matchesExpenseMerchant(expense, "food"), false);
  assert.equal(matchesExpenseMerchant(expense, "cash"), false);
  assert.equal(matchesExpenseMerchant(expense, "shop"), false);
  assert.equal(matchesExpenseMerchant(expense, "  "), true);
});

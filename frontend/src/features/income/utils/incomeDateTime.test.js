import assert from "node:assert/strict";
import test from "node:test";

import {
  getIncomeDateTimeInputValues,
  getRecurrenceFormValues,
  serializeIncomeDateTime
} from "./incomeDateTime.js";

test("serializes the selected date and time as a stable UTC wall-clock value", () => {
  const serialized = serializeIncomeDateTime("2026-10-19", "22:40");
  assert.equal(serialized, "2026-10-19T22:40:00.000Z");
  assert.deepEqual(getIncomeDateTimeInputValues(serialized), {
    date: "2026-10-19",
    time: "22:40"
  });
});

test("preserves dates and times close to midnight and month boundaries", () => {
  for (const [date, time] of [
    ["2026-01-31", "23:58"],
    ["2026-02-01", "00:02"],
    ["2026-12-31", "23:59"],
    ["2027-01-01", "00:01"]
  ]) {
    assert.deepEqual(getIncomeDateTimeInputValues(serializeIncomeDateTime(date, time)), { date, time });
  }
});

test("rejects malformed date/time values", () => {
  assert.equal(serializeIncomeDateTime("2026-02-30", "12:00"), null);
  assert.equal(serializeIncomeDateTime("2026-10-19", "24:00"), null);
  assert.equal(serializeIncomeDateTime("", "12:00"), null);
  assert.deepEqual(getIncomeDateTimeInputValues("not a date"), { date: "", time: "" });
});

test("loads recurring metadata in the edit form", () => {
  assert.deepEqual(getRecurrenceFormValues({
    isRecurring: true,
    recurrenceFrequency: "WEEKLY",
    recurrenceEndDate: "2027-03-04T00:00:00.000Z"
  }), {
    isRecurring: true,
    recurringFrequency: "weekly",
    recurringEndDate: "2027-03-04"
  });
});

test("uses defaults for non-recurring or unsupported recurrence metadata", () => {
  assert.deepEqual(getRecurrenceFormValues({ isRecurring: false, recurrenceFrequency: "DAILY" }), {
    isRecurring: false,
    recurringFrequency: "daily",
    recurringEndDate: ""
  });
  assert.deepEqual(getRecurrenceFormValues({ isRecurring: true, recurrenceFrequency: "UNKNOWN" }), {
    isRecurring: true,
    recurringFrequency: "monthly",
    recurringEndDate: ""
  });
});

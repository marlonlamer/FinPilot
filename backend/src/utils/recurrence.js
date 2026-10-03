const RECURRENCE_FREQUENCIES = new Set(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]);

const parseDateOnly = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
};

const parseRecurrence = ({ isRecurring, recurrenceFrequency, recurrenceEndDate }) => {
  if (isRecurring == null || isRecurring === false) {
    return {
      value: {
        isRecurring: false,
        recurrenceFrequency: null,
        recurrenceEndDate: null
      }
    };
  }

  if (isRecurring !== true) return { error: "isRecurring must be a boolean." };

  const normalizedFrequency = typeof recurrenceFrequency === "string"
    ? recurrenceFrequency.toUpperCase()
    : "";
  if (!RECURRENCE_FREQUENCIES.has(normalizedFrequency)) {
    return { error: "A valid recurrence frequency is required for recurring transactions." };
  }

  if (recurrenceEndDate == null || recurrenceEndDate === "") {
    return {
      value: {
        isRecurring: true,
        recurrenceFrequency: normalizedFrequency,
        recurrenceEndDate: null
      }
    };
  }

  const endDate = parseDateOnly(recurrenceEndDate);
  if (!endDate) return { error: "recurrenceEndDate must be a valid YYYY-MM-DD date." };

  return {
    value: {
      isRecurring: true,
      recurrenceFrequency: normalizedFrequency,
      recurrenceEndDate: endDate
    }
  };
};

module.exports = { parseRecurrence };

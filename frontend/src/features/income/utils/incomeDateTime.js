const pad = (value) => String(value).padStart(2, "0");

export const getIncomeDateTimeInputValues = (value) => {
  if (!value) return { date: "", time: "" };
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { date: "", time: "" };

  return {
    date: `${parsed.getUTCFullYear()}-${pad(parsed.getUTCMonth() + 1)}-${pad(parsed.getUTCDate())}`,
    time: `${pad(parsed.getUTCHours())}:${pad(parsed.getUTCMinutes())}`
  };
};

export const serializeIncomeDateTime = (dateValue, timeValue) => {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  if (!dateMatch) return null;
  const [, year, month, day] = dateMatch.map(Number);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeValue || "00:00");
  if (!timeMatch) return null;
  const [, hour, minute] = timeMatch.map(Number);

  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, 0, 0);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date.getUTCHours() !== hour ||
    date.getUTCMinutes() !== minute
  ) return null;

  return date.toISOString();
};

export const formatIncomeTime = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", timeZone: "UTC" })
    : "";
};

export const getRecurrenceFormValues = (transaction) => {
  const isRecurring = transaction?.isRecurring === true || transaction?.recurring === true;
  const frequencyValue = transaction?.recurrenceFrequency || transaction?.recurringFrequency || transaction?.recurrence;
  const frequency = typeof frequencyValue === "string" ? frequencyValue.toLowerCase() : "";
  const recurrenceEndDate = transaction?.recurrenceEndDate || transaction?.recurringEndDate || "";
  const endDate = recurrenceEndDate instanceof Date && !Number.isNaN(recurrenceEndDate.getTime())
    ? recurrenceEndDate.toISOString().slice(0, 10)
    : typeof recurrenceEndDate === "string" && /^\d{4}-\d{2}-\d{2}/.test(recurrenceEndDate)
      ? recurrenceEndDate.slice(0, 10)
      : "";

  return {
    isRecurring,
    recurringFrequency: ["daily", "weekly", "monthly", "yearly"].includes(frequency) ? frequency : "monthly",
    recurringEndDate: isRecurring ? endDate : ""
  };
};

export const normalizeIncomeRecord = (income = {}) => ({
  ...income,
  category: income.category ?? income.title ?? "",
  source: income.source ?? income.payer ?? income.payerSource ?? "",
  payer: income.payer ?? income.payerSource ?? income.source ?? "",
  destination: income.destination ?? income.destinationAccount ?? income.account ?? "",
  isRecurring: income.isRecurring ?? income.recurring ?? false,
  recurrenceFrequency: income.recurrenceFrequency ?? income.recurrence ?? undefined,
  recurrenceEndDate: income.recurrenceEndDate ?? undefined
});

export const getIncomeTransactionDisplayFields = (income) => ({
  title: income.payer || income.payerSource || income.source || income.description || "Income",
  category: income.category || income.title || "General",
  account: income.destination || income.destinationAccount || income.account || "Not provided"
});

export const getIncomeEditFormFields = (income) => ({
  description: income.payer || income.payerSource || income.source || income.description || "",
  source: income.destination || income.destinationAccount || income.account || ""
});

export const getIncomeRequestFields = ({ payer, destination }) => ({
  source: String(payer ?? "").trim(),
  destination: String(destination ?? "").trim()
});

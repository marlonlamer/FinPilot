const getRecordDate = (record) => {
  const value = record?.date || record?.createdAt || record?.created_at || record?.timestamp;
  if (!value) return null;

  if (typeof value === "string") {
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (dateOnly) {
      const [, year, month, day] = dateOnly;
      const parsed = new Date(Number(year), Number(month) - 1, Number(day));
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getMonthlySavingsNet = (transactions, year, month) => {
  if (!Array.isArray(transactions)) return 0;
  const selectedYear = Number(year);
  const selectedMonth = Number(month);

  return transactions.reduce((total, transaction) => {
    const date = getRecordDate(transaction);
    const amount = Number(transaction?.amount);
    if (
      !date ||
      date.getFullYear() !== selectedYear ||
      date.getMonth() !== selectedMonth ||
      !Number.isFinite(amount)
    ) {
      return total;
    }
    return total + amount;
  }, 0);
};

import { getCashFlowRecordDate } from "./cashFlowData.js";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const getAmount = (record) => {
  const amount = Number(record?.amount);
  return Number.isFinite(amount) ? Math.abs(amount) : 0;
};

export const buildMonthlyStatement = ({
  incomes = [],
  expenses = [],
  year,
  incomeAvailable,
  expenseAvailable
}) => {
  const selectedYear = Number(year);
  if (!Number.isInteger(selectedYear)) return null;

  const rows = MONTH_NAMES.map((month, monthIndex) => ({
    month,
    monthIndex,
    income: incomeAvailable ? 0 : null,
    expenditure: expenseAvailable ? 0 : null,
    net: incomeAvailable && expenseAvailable ? 0 : null,
    proportion: expenseAvailable ? 0 : null
  }));

  const addRecords = (records, field) => {
    records.forEach((record) => {
      const date = getCashFlowRecordDate(record);
      if (!date || date.getFullYear() !== selectedYear) return;
      rows[date.getMonth()][field] += getAmount(record);
    });
  };

  if (incomeAvailable) addRecords(incomes, "income");
  if (expenseAvailable) addRecords(expenses, "expenditure");

  const totalIncome = incomeAvailable
    ? rows.reduce((total, row) => total + row.income, 0)
    : null;
  const totalExpenditure = expenseAvailable
    ? rows.reduce((total, row) => total + row.expenditure, 0)
    : null;

  rows.forEach((row) => {
    if (incomeAvailable && expenseAvailable) row.net = row.income - row.expenditure;
    if (expenseAvailable) {
      row.proportion = totalExpenditure > 0
        ? (row.expenditure / totalExpenditure) * 100
        : 0;
    }
  });

  return {
    year: selectedYear,
    rows,
    totals: {
      income: totalIncome,
      expenditure: totalExpenditure,
      net: incomeAvailable && expenseAvailable ? totalIncome - totalExpenditure : null,
      proportion: expenseAvailable && totalExpenditure > 0 ? 100 : expenseAvailable ? 0 : null
    },
    hasTransactions: rows.some((row) =>
      (row.income || 0) > 0 || (row.expenditure || 0) > 0
    )
  };
};

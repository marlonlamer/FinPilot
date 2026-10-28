const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const getCashFlowRecordDate = (record) => {
  const value = record?.date || record?.createdAt || record?.created_at || record?.timestamp;
  if (!value) return null;

  if (typeof value === "string") {
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(value);
    if (dateOnly) {
      const [, year, month, day] = dateOnly;
      const parsed = new Date(Number(year), Number(month) - 1, Number(day));
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getAmount = (record) => {
  const amount = Number(record?.amount);
  return Number.isFinite(amount) ? Math.abs(amount) : 0;
};

const monthKey = (year, monthIndex) => `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

const monthLabel = (year, monthIndex) =>
  `${MONTHS[monthIndex]} ${String(year).slice(-2)}`;

export const getCashFlowAvailability = (incomes, expenses, incomeStatus, expenseStatus) => {
  const incomeAvailable = incomeStatus === "loaded" && Array.isArray(incomes);
  const expenseAvailable = expenseStatus === "loaded" && Array.isArray(expenses);
  const hasAvailableData = incomeAvailable || expenseAvailable;
  const isLoading = incomeStatus === "loading" || expenseStatus === "loading";

  return {
    incomeAvailable,
    expenseAvailable,
    hasAvailableData,
    isLoading,
    showInitialLoading: !hasAvailableData && isLoading,
    bothUnavailable: !hasAvailableData && !isLoading
  };
};

export const buildCashFlowData = ({
  incomes = [],
  expenses = [],
  timeframe,
  selectedYear,
  selectedMonth
}) => {
  const year = Number(selectedYear);
  const month = Number(selectedMonth);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 0 || month > 11) return [];

  const totalsByKey = new Map();
  const datedRecords = [];
  const addRecords = (records, field) => {
    records.forEach((record) => {
      const date = getCashFlowRecordDate(record);
      if (!date) return;
      datedRecords.push(date);

      let key;
      let label;
      if (timeframe === "monthly") {
        if (date.getFullYear() !== year || date.getMonth() !== month) return;
        key = `${monthKey(year, month)}-${String(date.getDate()).padStart(2, "0")}`;
        label = String(date.getDate());
      } else if (timeframe === "yearly") {
        if (date.getFullYear() !== year) return;
        key = monthKey(year, date.getMonth());
        label = MONTHS[date.getMonth()];
      } else {
        key = monthKey(date.getFullYear(), date.getMonth());
        label = monthLabel(date.getFullYear(), date.getMonth());
      }

      const totals = totalsByKey.get(key) || {
        key,
        label,
        income: 0,
        expense: 0
      };
      totals[field] += getAmount(record);
      totalsByKey.set(key, totals);
    });
  };

  addRecords(incomes, "income");
  addRecords(expenses, "expense");

  if (timeframe === "monthly" && totalsByKey.size > 0) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day += 1) {
      const key = `${monthKey(year, month)}-${String(day).padStart(2, "0")}`;
      if (!totalsByKey.has(key)) {
        totalsByKey.set(key, { key, label: String(day), income: 0, expense: 0 });
      }
    }
  }

  if (timeframe === "yearly" && totalsByKey.size > 0) {
    for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
      const key = monthKey(year, monthIndex);
      if (!totalsByKey.has(key)) {
        totalsByKey.set(key, {
          key,
          label: MONTHS[monthIndex],
          income: 0,
          expense: 0
        });
      }
    }
  }

  if (timeframe === "all" && datedRecords.length > 0) {
    const first = datedRecords.reduce((earliest, date) => date < earliest ? date : earliest);
    const last = datedRecords.reduce((latest, date) => date > latest ? date : latest);
    let cursor = new Date(first.getFullYear(), first.getMonth(), 1);
    const end = new Date(last.getFullYear(), last.getMonth(), 1);
    while (cursor <= end) {
      const key = monthKey(cursor.getFullYear(), cursor.getMonth());
      if (!totalsByKey.has(key)) {
        totalsByKey.set(key, {
          key,
          label: monthLabel(cursor.getFullYear(), cursor.getMonth()),
          income: 0,
          expense: 0
        });
      }
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }
  }

  return [...totalsByKey.values()]
    .map((totals) => ({ ...totals, net: totals.income - totals.expense }))
    .sort((a, b) => a.key.localeCompare(b.key));
};

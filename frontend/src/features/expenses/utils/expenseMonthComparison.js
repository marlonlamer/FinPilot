export const getExpenseDate = (expense) => {
  const rawDate = expense?.date || expense?.createdAt || expense?.created_at || expense?.timestamp;
  if (!rawDate) return null;
  if (typeof rawDate === "string") {
    const match = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
    if (match) {
      const [, year, month, day] = match;
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }
  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getLocalMonthValue = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const getPreviousMonthValue = (monthValue) => {
  const match = monthValue.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const [, year, month] = match;
  const date = new Date(Number(year), Number(month) - 2, 1);
  return getLocalMonthValue(date);
};

const getExpenseAmount = (expense) => {
  const amount = Number(expense?.amount);
  return Number.isFinite(amount) ? Math.abs(amount) : 0;
};

export const getExpenseMonthComparison = (expenses, monthValue, matchesFilters = () => true) => {
  const previousMonthValue = getPreviousMonthValue(monthValue);
  if (!previousMonthValue) return { text: "No previous data", direction: null };

  const totals = (Array.isArray(expenses) ? expenses : []).reduce((result, expense) => {
    if (!matchesFilters(expense)) return result;
    const date = getExpenseDate(expense);
    if (!date) return result;
    const expenseMonth = getLocalMonthValue(date);
    if (expenseMonth === monthValue) result.current += getExpenseAmount(expense);
    if (expenseMonth === previousMonthValue) result.previous += getExpenseAmount(expense);
    return result;
  }, { current: 0, previous: 0 });

  if (totals.previous === 0) return { text: "No previous data", direction: null };

  const percentChange = ((totals.current - totals.previous) / totals.previous) * 100;
  if (!Number.isFinite(percentChange)) return { text: "No previous data", direction: null };

  const direction = percentChange > 0 ? "up" : percentChange < 0 ? "down" : null;
  const arrow = direction === "up" ? "↑ " : direction === "down" ? "↓ " : "";
  return {
    text: `${arrow}${Math.abs(percentChange).toFixed(1)}% vs previous month`,
    direction
  };
};

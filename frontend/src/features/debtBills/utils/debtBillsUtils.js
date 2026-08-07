export const parseAmount = (value) => {
  if (value == null) return 0;
  const numeric = String(value).replace(/[^0-9.-]+/g, "");
  const parsed = Number(numeric);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const parseDateValue = (value) => {
  if (!value) return null;
  const directParse = new Date(value);
  if (!Number.isNaN(directParse.getTime())) {
    return directParse;
  }
  const fallback = new Date(`${value} ${new Date().getFullYear()}`);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

const daysBetween = (from, to) => {
  if (!from || !to) return null;
  const diff = to.getTime() - from.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const getDebtStatus = ({ status, remainingBalance, nextPaymentDate }) => {
  if (remainingBalance <= 0) return "Paid";
  const now = new Date();
  if (!nextPaymentDate) return status || "On Track";

  if (nextPaymentDate < now) return "Overdue";
  const daysUntil = daysBetween(now, nextPaymentDate);
  if (daysUntil <= 7) return "Due Soon";
  if (daysUntil <= 30) return "Upcoming";
  return "On Track";
};

export const getBillStatus = ({ status, nextBillingDate }) => {
  const normalizedStatus = String(status || "").trim();
  const now = new Date();
  const parsedDate = nextBillingDate;

  if (normalizedStatus.toLowerCase() === "cancelled") return "Cancelled";
  if (normalizedStatus.toLowerCase() === "paused") return "Paused";
  if (normalizedStatus.toLowerCase() === "overdue") return "Overdue";

  if (parsedDate) {
    if (parsedDate < now) return "Overdue";
    const daysUntil = daysBetween(now, parsedDate);
    if (daysUntil <= 7) return "Upcoming";
    return "Active";
  }

  return normalizedStatus || "Active";
};

export const normalizeDebtItems = (items = []) => {
  return items.map((item) => {
    const amountDueValue = parseAmount(item.amountDue);
    const remainingBalanceValue = parseAmount(item.remainingBalance);
    const originalBalanceValue = parseAmount(item.originalBalance ?? item.remainingBalance ?? 0);
    const nextPaymentDateValue = parseDateValue(item.nextPaymentDate);
    const status = getDebtStatus({ status: item.status, remainingBalance: remainingBalanceValue, nextPaymentDate: nextPaymentDateValue });
    const repaymentPercentage = originalBalanceValue > 0 ? `${Math.round(((originalBalanceValue - remainingBalanceValue) / originalBalanceValue) * 100)}%` : "0%";

    return {
      ...item,
      amountDueValue,
      remainingBalanceValue,
      originalBalanceValue,
      nextPaymentDateValue,
      status,
      repaymentPercentage,
    };
  });
};

export const normalizeBillItems = (items = []) => {
  return items.map((item) => {
    const amountValue = parseAmount(item.amount);
    const nextBillingDateValue = parseDateValue(item.nextBillingDate);
    const status = getBillStatus({ status: item.status, nextBillingDate: nextBillingDateValue });
    const billingCycle = item.billingCycle || "Monthly";

    return {
      ...item,
      amountValue,
      nextBillingDateValue,
      status,
      billingCycle,
    };
  });
};

const billingCycleToMonthly = (amount, cycle) => {
  switch (String(cycle).toLowerCase()) {
    case "weekly":
      return amount * 52 / 12;
    case "yearly":
      return amount / 12;
    default:
      return amount;
  }
};

export const getDebtSummary = (debtItems = []) => {
  const totalDebt = debtItems.reduce((sum, item) => sum + (item.originalBalanceValue || 0), 0);
  const outstandingBalance = debtItems.reduce((sum, item) => sum + (item.remainingBalanceValue || 0), 0);
  const overdueAmount = debtItems.reduce((sum, item) => {
    const isOverdue = item.status === "Overdue";
    return sum + (isOverdue ? (item.amountDueValue || 0) : 0);
  }, 0);
  const totalPaid = totalDebt - outstandingBalance;

  const nextPaymentDate = debtItems
    .filter((item) => item.nextPaymentDateValue && item.status !== "Paid")
    .sort((a, b) => a.nextPaymentDateValue - b.nextPaymentDateValue)[0]?.nextPaymentDateValue || null;

  const repaymentPercentage = totalDebt > 0 ? Math.round((totalPaid / totalDebt) * 100) : 0;
  const remainingBalance = outstandingBalance;

  return {
    totalDebt,
    outstandingBalance,
    overdueAmount,
    totalPaid,
    nextPaymentDate,
    repaymentPercentage,
    remainingBalance,
  };
};

export const getBillSummary = (billItems = []) => {
  const activeSubscriptions = billItems.filter((item) => item.status === "Active").length;
  const upcomingBills = billItems.filter((item) => item.status === "Upcoming").length;
  const monthlyRecurringCost = billItems.reduce((sum, item) => {
    if (item.status === "Cancelled") return sum;
    return sum + billingCycleToMonthly(item.amountValue || 0, item.billingCycle);
  }, 0);
  const estimatedAnnualCost = monthlyRecurringCost * 12;

  return {
    activeSubscriptions,
    upcomingBills,
    monthlyRecurringCost,
    estimatedAnnualCost,
  };
};

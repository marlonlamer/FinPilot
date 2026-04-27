const prisma = require("../prisma/client");

const getReports = async (userId, opts = {}) => {
  const months = Number(opts.months ?? 6);
  const top = Number(opts.top ?? 10);
  const now = new Date();
  const start = opts.startDate ? new Date(opts.startDate) : new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  // Expenses by category
  const expensesByCategory = await prisma.expense.groupBy({
    by: ["category"],
    where: { userId, date: { gte: start } },
    _sum: { amount: true }
  });

  // Monthly comparison for last `months`
  const monthBuckets = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthBuckets.push({ key, label: d.toLocaleString("default", { month: "short", year: "numeric" }), expenses: 0, incomes: 0 });
  }

  const [recentExpenses, recentIncomes, topExpenses] = await Promise.all([
    prisma.expense.findMany({ where: { userId, date: { gte: start } } }),
    prisma.income.findMany({ where: { userId, date: { gte: start } } }),
    prisma.expense.findMany({ where: { userId, date: { gte: start } }, orderBy: { amount: "desc" }, take: top })
  ]);

  const monthKey = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  recentExpenses.forEach((e) => {
    const k = monthKey(e.date);
    const idx = monthBuckets.findIndex((m) => m.key === k);
    if (idx >= 0) monthBuckets[idx].expenses += e.amount;
  });
  recentIncomes.forEach((i) => {
    const k = monthKey(i.date);
    const idx = monthBuckets.findIndex((m) => m.key === k);
    if (idx >= 0) monthBuckets[idx].incomes += i.amount;
  });

  return {
    expensesByCategory: expensesByCategory.map((c) => ({ category: c.category, total: (c._sum && c._sum.amount) || 0 })),
    monthlyComparison: monthBuckets,
    topExpenses: topExpenses.map((e) => ({ id: e.id, title: e.title, amount: e.amount, category: e.category, date: e.date }))
  };
};

module.exports = { getReports };

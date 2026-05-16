const prisma = require("../prisma/client");

const getDashboard = async (userId) => {
  const [totalExpensesAgg, totalIncomeAgg, savingsList, expensesByCategory] = await Promise.all([
    prisma.expense.aggregate({ _sum: { amount: true }, where: { userId } }),
    prisma.income.aggregate({ _sum: { amount: true }, where: { userId } }),
    prisma.savings.findMany({ where: { userId } }),
    prisma.expense.groupBy({ by: ["category"], where: { userId }, _sum: { amount: true } })
  ]);

  const totalExpenses = (totalExpensesAgg._sum && totalExpensesAgg._sum.amount) || 0;
  const totalIncome = (totalIncomeAgg._sum && totalIncomeAgg._sum.amount) || 0;
  // derive total savings from transactions (source of truth) to avoid stale stored `currentAmount`
  const savingsAgg = await prisma.savingsTransaction.aggregate({ where: { userId }, _sum: { amount: true } });
  const totalSavings = (savingsAgg && savingsAgg._sum && savingsAgg._sum.amount) ? Number(savingsAgg._sum.amount) : 0;

  // Monthly summary for last 6 months
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({ key, label: d.toLocaleString("default", { month: "short", year: "numeric" }), expenses: 0, incomes: 0 });
  }

  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const [recentExpenses, recentIncomes] = await Promise.all([
    prisma.expense.findMany({ where: { userId, date: { gte: start } } }),
    prisma.income.findMany({ where: { userId, date: { gte: start } } })
  ]);

  const monthKey = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  recentExpenses.forEach((e) => {
    const k = monthKey(e.date);
    const idx = months.findIndex((m) => m.key === k);
    if (idx >= 0) months[idx].expenses += e.amount;
  });
  recentIncomes.forEach((i) => {
    const k = monthKey(i.date);
    const idx = months.findIndex((m) => m.key === k);
    if (idx >= 0) months[idx].incomes += i.amount;
  });

  // Recent transactions (merge expenses + incomes)
  const [latestExpenses, latestIncomes] = await Promise.all([
    prisma.expense.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 10 }),
    prisma.income.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 10 })
  ]);

  const transactions = [
    ...latestExpenses.map((e) => ({ id: e.id, type: "expense", title: e.title, amount: e.amount, category: e.category, date: e.date })),
    ...latestIncomes.map((i) => ({ id: i.id, type: "income", title: i.title, amount: i.amount, source: i.source, date: i.date }))
  ];
  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    totals: { totalExpenses, totalIncome, totalSavings },
    savings: savingsList,
    expensesByCategory: expensesByCategory.map((c) => ({ category: c.category, total: (c._sum && c._sum.amount) || 0 })),
    monthlySummary: months,
    recentTransactions: transactions.slice(0, 10)
  };
};

module.exports = { getDashboard };

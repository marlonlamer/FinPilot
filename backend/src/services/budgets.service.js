const defaultPrisma = require('../prisma/client');

async function recalcMonthlyTotals(userId, month, prismaClient) {
  const db = prismaClient || defaultPrisma;
  userId = Number(userId);
  if (!month) {
    const d = new Date();
    month = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  }

  // fetch budgets for the month
  const budgets = await db.budget.findMany({ where: { userId, month } });

  let totalBudget = 0;
  let totalSpent = 0;

  for (const b of budgets) {
    const limit = Number(b.budgetLimit || 0);
    totalBudget += limit;
    let spent = (b.budgetSpent != null) ? Number(b.budgetSpent || 0) : null;
    if (spent === null) {
      const start = new Date(`${month}-01T00:00:00Z`);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      const agg = await db.expense.aggregate({ where: { userId, category: String(b.category || '').trim(), date: { gte: start, lt: end } }, _sum: { amount: true } });
      spent = Number(agg._sum.amount || 0);
    }
    totalSpent += spent;
  }

  const totalRemaining = totalBudget - totalSpent;

  // persist into user row
  await db.user.updateMany({ where: { id: userId }, data: { monthlyBudget: totalBudget, monthlySpent: totalSpent, monthlyBudgetRemaining: totalRemaining } });

  return { totalMonthlyBudget: totalBudget, totalBudgetSpent: totalSpent, totalBudgetRemaining: totalRemaining };
}

module.exports = { recalcMonthlyTotals };

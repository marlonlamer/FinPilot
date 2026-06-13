const prisma = require("../prisma/client");
const { recalcUserAggregates } = require('./userAggregates.service');
const { recalcMonthlyTotals } = require('./budgets.service');

const getAllExpenses = async (userId, month) => {
  const where = { userId };
  if (month) {
    const start = new Date(`${month}-01T00:00:00Z`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    where.date = { gte: start, lt: end };
  }
  return prisma.expense.findMany({
    where,
    orderBy: { date: "desc" }
  });
};

const createExpense = async ({
  title,
  amount,
  category,
  userId
}) => {
  return prisma.$transaction(async (tx) => {
    const created = await tx.expense.create({ data: { title, amount: Number(amount), category, userId } });
    // Decrease user's available balance by expense amount
    await tx.user.updateMany({ where: { id: Number(userId) }, data: { availableBalance: { increment: -Number(amount) } } });
    // Optionally update monthlySpent if expense is in current month
    try {
      const d = created.date ? new Date(created.date) : new Date();
      const now = new Date();
      if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
        await tx.user.updateMany({ where: { id: Number(userId) }, data: { monthlySpent: { increment: Number(amount) } } });
      }
    } catch (e) { }
    // Update budget aggregates for the category/month
    try {
      const d = created.date ? new Date(created.date) : new Date();
      const month = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const budget = await tx.budget.findFirst({ where: { userId: Number(userId), category, month } });
      if (budget) {
        const newSpent = Number(budget.budgetSpent || 0) + Number(amount);
        const newRemaining = Number(budget.budgetLimit || 0) - newSpent;
        await tx.budget.update({ where: { id: budget.id }, data: { budgetSpent: { increment: Number(amount) }, budgetRemaining: newRemaining } });
      }
      // Recalculate monthly totals (persist to user row) using tx
      try { await recalcMonthlyTotals(userId, month, tx); } catch (e) { console.warn('Failed to recalc monthly totals after createExpense', e); }
    } catch (e) { console.warn('Failed to update budget aggregates on createExpense', e); }
    // Recalculate derived aggregates
    try { await recalcUserAggregates(userId, tx); } catch (e) { /* non-fatal */ }
    return created;
  });
};

const deleteExpense = async (id, userId) => {
  return prisma.$transaction(async (tx) => {
    const deleted = await tx.expense.delete({ where: { id: Number(id), userId } });
    // Refund the amount to available balance
    await tx.user.updateMany({ where: { id: Number(userId) }, data: { availableBalance: { increment: Number(deleted.amount) } } });
    try {
      const d = deleted.date ? new Date(deleted.date) : new Date();
      const now = new Date();
      if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
        await tx.user.updateMany({ where: { id: Number(userId) }, data: { monthlySpent: { increment: -Number(deleted.amount) } } });
      }
    } catch (e) {}
    // Update budget aggregates for the category/month (decrement spent)
    try {
      const d = deleted.date ? new Date(deleted.date) : new Date();
      const month = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const budget = await tx.budget.findFirst({ where: { userId: Number(userId), category: deleted.category, month } });
      if (budget) {
        const newSpent = Math.max(0, Number(budget.budgetSpent || 0) - Number(deleted.amount));
        const newRemaining = Number(budget.budgetLimit || 0) - newSpent;
        await tx.budget.update({ where: { id: budget.id }, data: { budgetSpent: newSpent, budgetRemaining: newRemaining } });
      }
      try { await recalcMonthlyTotals(userId, month, tx); } catch (e) { console.warn('Failed to recalc monthly totals after deleteExpense', e); }
    } catch (e) { console.warn('Failed to update budget aggregates on deleteExpense', e); }
    try { await recalcUserAggregates(userId, tx); } catch (e) {}
    return deleted;
  });
};

const updateExpense = async (id, data, userId) => {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.expense.findUnique({ where: { id: Number(id) } });
    if (!existing || existing.userId !== Number(userId)) throw new Error('Expense not found or not permitted');
    const result = await tx.expense.updateMany({ where: { id: Number(id), userId }, data: { title: data.title, amount: data.amount != null ? Number(data.amount) : undefined, category: data.category, date: data.date ? new Date(data.date) : undefined } });
    if (result.count === 0) throw new Error('Expense not found or not permitted');
    const updated = await tx.expense.findUnique({ where: { id: Number(id) } });
    // availableBalance should change by old - new (since expense reduces available)
    const delta = Number(existing.amount || 0) - Number(updated.amount || 0);
    if (delta !== 0) await tx.user.updateMany({ where: { id: Number(userId) }, data: { availableBalance: { increment: Number(delta) } } });
    try {
      const now = new Date();
      const oldDate = existing.date ? new Date(existing.date) : null;
      const newDate = updated.date ? new Date(updated.date) : null;
      const oldInMonth = oldDate && oldDate.getFullYear() === now.getFullYear() && oldDate.getMonth() === now.getMonth();
      const newInMonth = newDate && newDate.getFullYear() === now.getFullYear() && newDate.getMonth() === now.getMonth();
      if (oldInMonth || newInMonth) {
        // adjust monthlySpent by (old - new) if both in month, or add/subtract accordingly
        const deltaMonthly = (oldInMonth ? Number(existing.amount || 0) : 0) - (newInMonth ? Number(updated.amount || 0) : 0);
        if (deltaMonthly !== 0) await tx.user.updateMany({ where: { id: Number(userId) }, data: { monthlySpent: { increment: Number(deltaMonthly) } } });
      }
    } catch (e) {}
    // Update budget aggregates: handle possible category/month changes
    try {
      const oldDate = existing.date ? new Date(existing.date) : new Date();
      const newDate = updated.date ? new Date(updated.date) : new Date();
      const oldMonth = `${oldDate.getFullYear()}-${String(oldDate.getMonth()+1).padStart(2,'0')}`;
      const newMonth = `${newDate.getFullYear()}-${String(newDate.getMonth()+1).padStart(2,'0')}`;
      const oldCategory = existing.category;
      const newCategory = updated.category;
      const oldAmount = Number(existing.amount || 0);
      const newAmount = Number(updated.amount || 0);

      // If category/month unchanged, adjust by (new - old)
      if (oldCategory === newCategory && oldMonth === newMonth) {
        const budget = await tx.budget.findFirst({ where: { userId: Number(userId), category: newCategory, month: newMonth } });
        if (budget) {
          const newSpent = Math.max(0, Number(budget.budgetSpent || 0) - oldAmount + newAmount);
          const newRemaining = Number(budget.budgetLimit || 0) - newSpent;
          await tx.budget.update({ where: { id: budget.id }, data: { budgetSpent: newSpent, budgetRemaining: newRemaining } });
        }
      } else {
        // decrement old budget
        const oldBudget = await tx.budget.findFirst({ where: { userId: Number(userId), category: oldCategory, month: oldMonth } });
        if (oldBudget) {
          const newSpentOld = Math.max(0, Number(oldBudget.budgetSpent || 0) - oldAmount);
          const newRemainingOld = Number(oldBudget.budgetLimit || 0) - newSpentOld;
          await tx.budget.update({ where: { id: oldBudget.id }, data: { budgetSpent: newSpentOld, budgetRemaining: newRemainingOld } });
        }
        // increment new budget
        const newBudget = await tx.budget.findFirst({ where: { userId: Number(userId), category: newCategory, month: newMonth } });
          if (newBudget) {
            const newSpentNew = Number(newBudget.budgetSpent || 0) + newAmount;
            const newRemainingNew = Number(newBudget.budgetLimit || 0) - newSpentNew;
            await tx.budget.update({ where: { id: newBudget.id }, data: { budgetSpent: newSpentNew, budgetRemaining: newRemainingNew } });
          }
        }
        // Recalc totals for affected months (inside same try so oldMonth/newMonth are in scope)
        try { await recalcMonthlyTotals(userId, oldMonth, tx); if (newMonth !== oldMonth) await recalcMonthlyTotals(userId, newMonth, tx); } catch (e) { console.warn('Failed to recalc monthly totals after updateExpense', e); }
      } catch (e) { console.warn('Failed to update budget aggregates on updateExpense', e); }
      try { await recalcUserAggregates(userId, tx); } catch (e) {}
    return updated;
  });
};

module.exports = {
  getAllExpenses,
  createExpense,
  deleteExpense
  ,updateExpense
};


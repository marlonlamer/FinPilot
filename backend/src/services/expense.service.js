const prisma = require("../prisma/client");
const { recalcUserAggregates } = require('./userAggregates.service');

const getAllExpenses = async (userId) => {
  return prisma.expense.findMany({
    where: { userId },
    orderBy: { date: "desc" }
  });
};

const createExpense = async ({
  title,
  amount,
  category,
  userId
}) => {
  const created = await prisma.expense.create({ data: { title, amount: Number(amount), category, userId } });
  // Decrease user's available balance by expense amount
  await prisma.user.updateMany({ where: { id: Number(userId) }, data: { availableBalance: { increment: -Number(amount) } } });
  // Optionally update monthlySpent if expense is in current month
  try {
    const d = created.date ? new Date(created.date) : new Date();
    const now = new Date();
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
      await prisma.user.updateMany({ where: { id: Number(userId) }, data: { monthlySpent: { increment: Number(amount) } } });
    }
  } catch (e) { }
  // Recalculate derived aggregates
  try { await recalcUserAggregates(userId); } catch (e) { /* non-fatal */ }

  // Update budget aggregates for the category/month
  try {
    const d = created.date ? new Date(created.date) : new Date();
    const month = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const budget = await prisma.budget.findFirst({ where: { userId: Number(userId), category, month } });
    if (budget) {
      const newSpent = Number(budget.budgetSpent || 0) + Number(amount);
      const newRemaining = Number(budget.budgetLimit || 0) - newSpent;
      await prisma.budget.update({ where: { id: budget.id }, data: { budgetSpent: { increment: Number(amount) }, budgetRemaining: newRemaining } });
    }
  } catch (e) { console.warn('Failed to update budget aggregates on createExpense', e); }
  return created;
};

const deleteExpense = async (id, userId) => {
  const deleted = await prisma.expense.delete({ where: { id: Number(id), userId } });
  // Refund the amount to available balance
  await prisma.user.updateMany({ where: { id: Number(userId) }, data: { availableBalance: { increment: Number(deleted.amount) } } });
  try {
    const d = deleted.date ? new Date(deleted.date) : new Date();
    const now = new Date();
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
      await prisma.user.updateMany({ where: { id: Number(userId) }, data: { monthlySpent: { increment: -Number(deleted.amount) } } });
    }
  } catch (e) {}
  try { await recalcUserAggregates(userId); } catch (e) {}
  // Update budget aggregates for the category/month (decrement spent)
  try {
    const d = deleted.date ? new Date(deleted.date) : new Date();
    const month = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const budget = await prisma.budget.findFirst({ where: { userId: Number(userId), category: deleted.category, month } });
    if (budget) {
      const newSpent = Math.max(0, Number(budget.budgetSpent || 0) - Number(deleted.amount));
      const newRemaining = Number(budget.budgetLimit || 0) - newSpent;
      await prisma.budget.update({ where: { id: budget.id }, data: { budgetSpent: newSpent, budgetRemaining: newRemaining } });
    }
  } catch (e) { console.warn('Failed to update budget aggregates on deleteExpense', e); }
  return deleted;
};

const updateExpense = async (id, data, userId) => {
  const existing = await prisma.expense.findUnique({ where: { id: Number(id) } });
  if (!existing || existing.userId !== Number(userId)) throw new Error('Expense not found or not permitted');
  const result = await prisma.expense.updateMany({ where: { id: Number(id), userId }, data: { title: data.title, amount: data.amount != null ? Number(data.amount) : undefined, category: data.category, date: data.date ? new Date(data.date) : undefined } });
  if (result.count === 0) throw new Error('Expense not found or not permitted');
  const updated = await prisma.expense.findUnique({ where: { id: Number(id) } });
  // availableBalance should change by old - new (since expense reduces available)
  const delta = Number(existing.amount || 0) - Number(updated.amount || 0);
  if (delta !== 0) await prisma.user.updateMany({ where: { id: Number(userId) }, data: { availableBalance: { increment: Number(delta) } } });
  try {
    const now = new Date();
    const oldDate = existing.date ? new Date(existing.date) : null;
    const newDate = updated.date ? new Date(updated.date) : null;
    const oldInMonth = oldDate && oldDate.getFullYear() === now.getFullYear() && oldDate.getMonth() === now.getMonth();
    const newInMonth = newDate && newDate.getFullYear() === now.getFullYear() && newDate.getMonth() === now.getMonth();
    if (oldInMonth || newInMonth) {
      // adjust monthlySpent by (old - new) if both in month, or add/subtract accordingly
      const deltaMonthly = (oldInMonth ? Number(existing.amount || 0) : 0) - (newInMonth ? Number(updated.amount || 0) : 0);
      if (deltaMonthly !== 0) await prisma.user.updateMany({ where: { id: Number(userId) }, data: { monthlySpent: { increment: Number(deltaMonthly) } } });
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
      const budget = await prisma.budget.findFirst({ where: { userId: Number(userId), category: newCategory, month: newMonth } });
      if (budget) {
        const newSpent = Math.max(0, Number(budget.budgetSpent || 0) - oldAmount + newAmount);
        const newRemaining = Number(budget.budgetLimit || 0) - newSpent;
        await prisma.budget.update({ where: { id: budget.id }, data: { budgetSpent: newSpent, budgetRemaining: newRemaining } });
      }
    } else {
      // decrement old budget
      const oldBudget = await prisma.budget.findFirst({ where: { userId: Number(userId), category: oldCategory, month: oldMonth } });
      if (oldBudget) {
        const newSpentOld = Math.max(0, Number(oldBudget.budgetSpent || 0) - oldAmount);
        const newRemainingOld = Number(oldBudget.budgetLimit || 0) - newSpentOld;
        await prisma.budget.update({ where: { id: oldBudget.id }, data: { budgetSpent: newSpentOld, budgetRemaining: newRemainingOld } });
      }
      // increment new budget
      const newBudget = await prisma.budget.findFirst({ where: { userId: Number(userId), category: newCategory, month: newMonth } });
      if (newBudget) {
        const newSpentNew = Number(newBudget.budgetSpent || 0) + newAmount;
        const newRemainingNew = Number(newBudget.budgetLimit || 0) - newSpentNew;
        await prisma.budget.update({ where: { id: newBudget.id }, data: { budgetSpent: newSpentNew, budgetRemaining: newRemainingNew } });
      }
    }
  } catch (e) { console.warn('Failed to update budget aggregates on updateExpense', e); }
      try { await recalcUserAggregates(userId); } catch (e) {}
  return updated;
};

module.exports = {
  getAllExpenses,
  createExpense,
  deleteExpense
  ,updateExpense
};


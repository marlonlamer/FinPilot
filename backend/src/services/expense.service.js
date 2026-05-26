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
      try { await recalcUserAggregates(userId); } catch (e) {}
  return updated;
};

module.exports = {
  getAllExpenses,
  createExpense,
  deleteExpense
  ,updateExpense
};


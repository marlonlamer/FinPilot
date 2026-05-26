const prisma = require("../prisma/client");
const { recalcUserAggregates } = require('./userAggregates.service');

const getAllIncomes = async (userId) => {
  return prisma.income.findMany({ 
    where: { userId },
    orderBy: { date: "desc" } 
  });
};

const createIncome = async ({
  title,
  amount,
  source,
  userId
}) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const created = await prisma.income.create({ data: { title, amount: Number(amount), source, userId } });
  // Increase user's available balance by income amount
  await prisma.user.updateMany({ where: { id: Number(userId) }, data: { availableBalance: { increment: Number(amount) } } });
  try { await recalcUserAggregates(userId); } catch (e) {}
  return created;
};

const deleteIncome = async (id, userId) => {
  // delete returns the deleted record so we can adjust availableBalance
  const deleted = await prisma.income.delete({ where: { id: Number(id), userId } });
  await prisma.user.updateMany({ where: { id: Number(userId) }, data: { availableBalance: { increment: -Number(deleted.amount) } } });
  try { await recalcUserAggregates(userId); } catch (e) {}
  return deleted;
};

const updateIncome = async (id, data, userId) => {
  const existing = await prisma.income.findUnique({ where: { id: Number(id) } });
  if (!existing || existing.userId !== Number(userId)) throw new Error('Income not found or not permitted');
  const result = await prisma.income.updateMany({ where: { id: Number(id), userId }, data: { title: data.title, amount: data.amount != null ? Number(data.amount) : undefined, source: data.source, date: data.date ? new Date(data.date) : undefined } });
  if (result.count === 0) throw new Error('Income not found or not permitted');
  const updated = await prisma.income.findUnique({ where: { id: Number(id) } });
  // adjust user's available balance by delta (new - old)
  const delta = Number(updated.amount || 0) - Number(existing.amount || 0);
  if (delta !== 0) await prisma.user.updateMany({ where: { id: Number(userId) }, data: { availableBalance: { increment: Number(delta) } } });
  try { await recalcUserAggregates(userId); } catch (e) {}
  return updated;
};

module.exports = { getAllIncomes, createIncome, deleteIncome };
module.exports.updateIncome = updateIncome;

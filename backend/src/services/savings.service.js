const prisma = require("../prisma/client");

const getAllSavings = async (userId) => {
  const list = await prisma.savings.findMany({ where: { userId }, orderBy: { startDate: "desc" } });
  // Recalculate currentAmount from transactions (single source of truth)
  const results = await Promise.all(list.map(async (s) => {
    const sum = await getSavingsBalance(userId, s.id);
    return { ...s, currentAmount: sum };
  }));
  return results;
};

const createSavings = async ({
  name,
  targetAmount,
  currentAmount,
  startDate,
  targetDate,
  userId
}) => {
  return prisma.savings.create({
    data: {
      name,
      targetAmount: Number(targetAmount),
      // initial currentAmount kept for backward compatibility but authoritative balance comes from transactions
      currentAmount: currentAmount != null ? Number(currentAmount) : 0,
      startDate: startDate ? new Date(startDate) : undefined,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      history: JSON.stringify([]),
      userId
    }
  });
};

const deleteSavings = async (id, userId) => {
  const result = await prisma.savings.deleteMany({ where: { id: Number(id), userId } });
  if (result.count === 0) throw new Error("Savings not found or not permitted");
  return;
};

const updateSavings = async (id, data, userId) => {
  // support adding a history entry atomically
  if (data.historyEntry) {
    const existing = await prisma.savings.findUnique({ where: { id: Number(id) } });
    if (!existing || existing.userId !== userId) throw new Error("Savings not found or not permitted");
    const existingHistory = Array.isArray(existing.history) ? existing.history : (existing.history ? JSON.parse(existing.history) : []);
    const nextHistory = [...existingHistory, data.historyEntry];
    const result = await prisma.savings.updateMany({
      where: { id: Number(id), userId },
      data: {
        currentAmount: data.currentAmount != null ? Number(data.currentAmount) : undefined,
        history: JSON.stringify(nextHistory)
      }
    });
    if (result.count === 0) throw new Error("Savings not found or not permitted");
    return prisma.savings.findUnique({ where: { id: Number(id) } });
  }

  const result = await prisma.savings.updateMany({
    where: { id: Number(id), userId },
    data: {
      name: data.name,
      targetAmount: data.targetAmount != null ? Number(data.targetAmount) : undefined,
      currentAmount: data.currentAmount != null ? Number(data.currentAmount) : undefined,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      targetDate: data.targetDate ? new Date(data.targetDate) : undefined
    }
  });
  if (result.count === 0) throw new Error("Savings not found or not permitted");
  return prisma.savings.findUnique({ where: { id: Number(id) } });
};

const addHistoryEntry = async (id, entry, userId) => {
  const existing = await prisma.savings.findUnique({ where: { id: Number(id) } });
  if (!existing || existing.userId !== userId) throw new Error("Savings not found or not permitted");
  const existingHistory = Array.isArray(existing.history) ? existing.history : (existing.history ? JSON.parse(existing.history) : []);
  const nextHistory = [...existingHistory, entry];
  const nextAmount = (Number(existing.currentAmount || 0) + Number(entry.amount || 0));
  const result = await prisma.savings.updateMany({ where: { id: Number(id), userId }, data: { history: JSON.stringify(nextHistory), currentAmount: nextAmount } });
  if (result.count === 0) throw new Error("Savings not found or not permitted");
  return prisma.savings.findUnique({ where: { id: Number(id) } });
};

// New: create a transaction record (deposit/withdraw) and keep transactions as source of truth
const addTransaction = async ({ savingsId, type, amount, note, userId }) => {
  if (!['deposit', 'withdraw'].includes(type)) throw new Error('Invalid transaction type');
  if (!userId) throw new Error('userId required');
  const signed = type === 'deposit' ? Number(amount) : -Math.abs(Number(amount));
  return prisma.savingsTransaction.create({ data: { savingsId: savingsId ? Number(savingsId) : undefined, userId: Number(userId), amount: Number(signed), type, note } });
};

// Sum transactions to compute balance. If savingsId omitted, compute total for user.
const getSavingsBalance = async (userId, savingsId) => {
  const where = { userId: Number(userId) };
  if (savingsId != null) where.savingsId = Number(savingsId);
  const agg = await prisma.savingsTransaction.aggregate({ _sum: { amount: true }, where });
  return (agg && agg._sum && agg._sum.amount) ? Number(agg._sum.amount) : 0;
};

// fetch transactions (history) for a user, optionally filtered by savingsId
const getTransactions = async (userId, savingsId) => {
  const where = { userId: Number(userId) };
  if (savingsId != null) where.savingsId = Number(savingsId);
  const list = await prisma.savingsTransaction.findMany({ where, orderBy: { date: 'desc' } });
  return list.map(t => ({ ...t, date: t.date ? t.date.toISOString() : null }));
};

module.exports = {
  getAllSavings,
  createSavings,
  deleteSavings
};

module.exports.updateSavings = updateSavings;
module.exports.addHistoryEntry = addHistoryEntry;
module.exports.addTransaction = addTransaction;
module.exports.getSavingsBalance = getSavingsBalance;
module.exports.getTransactions = getTransactions;

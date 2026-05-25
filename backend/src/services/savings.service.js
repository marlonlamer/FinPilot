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

const deleteSavings = async (id, userId, restoreAvailable = false) => {
  const sid = Number(id);
  const uid = Number(userId);
  const existing = await prisma.savings.findUnique({ where: { id: sid } });
  if (!existing || existing.userId !== uid) throw new Error("Savings not found or not permitted");

  // compute authoritative balance from transactions
  const balance = await getSavingsBalance(uid, sid);

  // Transactionally delete related transactions and the savings record.
  // This covers cases where the DB doesn't have ON DELETE CASCADE yet.
  await prisma.$transaction(async (tx) => {
    await tx.savingsTransaction.deleteMany({ where: { savingsId: sid, userId: uid } });
    await tx.savings.delete({ where: { id: sid } });
    if (restoreAvailable && Number(balance) !== 0) {
      await tx.user.updateMany({ where: { id: uid }, data: { availableBalance: { increment: Number(balance) } } });
    }
    // reduce user's totalSavings by the removed balance
    if (Number(balance) !== 0) {
      await tx.user.updateMany({ where: { id: uid }, data: { totalSavings: { increment: Number(-balance) } } });
    }
  });
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
  const created = await prisma.savingsTransaction.create({ data: { savingsId: savingsId ? Number(savingsId) : undefined, userId: Number(userId), amount: Number(signed), type, note } });
  // update savings currentAmount and user's available balance
  if (created.savingsId) {
    const balance = await getSavingsBalance(userId, created.savingsId);
    await prisma.savings.updateMany({ where: { id: Number(created.savingsId), userId: Number(userId) }, data: { currentAmount: balance } });
  }
  // availableBalance: deposit reduces available, withdraw increases it
  const deltaAvail = type === 'deposit' ? -Math.abs(Number(amount)) : Math.abs(Number(amount));
  await prisma.user.updateMany({ where: { id: Number(userId) }, data: { availableBalance: { increment: Number(deltaAvail) } } });
  // Update user's totalSavings: deposit increases, withdraw decreases
  const deltaTotal = signed; // signed already has + for deposit, - for withdraw
  if (deltaTotal !== 0) await prisma.user.updateMany({ where: { id: Number(userId) }, data: { totalSavings: { increment: Number(deltaTotal) } } });
  return created;
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

// Update a transaction's amount and note. `amount` should be a positive number
// representing the magnitude; we'll preserve the transaction `type` sign.
const updateTransaction = async (transactionId, { amount, note }, userId) => {
  const existing = await prisma.savingsTransaction.findUnique({ where: { id: Number(transactionId) } });
  if (!existing || existing.userId !== Number(userId)) throw new Error('Transaction not found or not permitted');
  if (amount == null) throw new Error('Amount is required');
  if (Number(amount) < 0) throw new Error('Amount cannot be negative');
  const signed = existing.type === 'deposit' ? Number(amount) : -Math.abs(Number(amount));
  const updated = await prisma.savingsTransaction.update({ where: { id: Number(transactionId) }, data: { amount: Number(signed), note: note || null } });
  // refresh aggregate currentAmount on related savings (if any)
  if (updated.savingsId) {
    const balance = await getSavingsBalance(userId, updated.savingsId);
    await prisma.savings.updateMany({ where: { id: Number(updated.savingsId), userId: Number(userId) }, data: { currentAmount: balance } });
  }
  // adjust user's availableBalance by delta: -(newSigned - oldSigned)
  const oldSigned = Number(existing.amount || 0);
  const newSigned = Number(updated.amount || 0);
  const deltaAvail = -(newSigned - oldSigned);
  if (deltaAvail !== 0) await prisma.user.updateMany({ where: { id: Number(userId) }, data: { availableBalance: { increment: Number(deltaAvail) } } });
  // adjust user's totalSavings by deltaTotal = (newSigned - oldSigned)
  const deltaTotal = (newSigned - oldSigned);
  if (deltaTotal !== 0) await prisma.user.updateMany({ where: { id: Number(userId) }, data: { totalSavings: { increment: Number(deltaTotal) } } });
  return updated;
};

// Delete a transaction and refresh related savings currentAmount
const deleteTransaction = async (transactionId, userId) => {
  const existing = await prisma.savingsTransaction.findUnique({ where: { id: Number(transactionId) } });
  if (!existing || existing.userId !== Number(userId)) throw new Error('Transaction not found or not permitted');
  const deleted = await prisma.savingsTransaction.delete({ where: { id: Number(transactionId) } });
  if (deleted.savingsId) {
    const balance = await getSavingsBalance(userId, deleted.savingsId);
    await prisma.savings.updateMany({ where: { id: Number(deleted.savingsId), userId: Number(userId) }, data: { currentAmount: balance } });
  }
  // when deleted, previous signed amount should be reversed to availableBalance
  const oldSigned = Number(existing.amount || 0);
  if (oldSigned !== 0) await prisma.user.updateMany({ where: { id: Number(userId) }, data: { availableBalance: { increment: Number(oldSigned) } } });
  // also remove that amount from user's totalSavings
  if (oldSigned !== 0) await prisma.user.updateMany({ where: { id: Number(userId) }, data: { totalSavings: { increment: Number(-oldSigned) } } });
  return deleted;
};

module.exports.updateTransaction = updateTransaction;
module.exports.deleteTransaction = deleteTransaction;

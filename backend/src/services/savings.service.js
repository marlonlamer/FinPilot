const prisma = require("../prisma/client");

const getAllSavings = async (userId) => {
  return prisma.savings.findMany({
    where: { userId },
    orderBy: { startDate: "desc" }
  });
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
      currentAmount: currentAmount != null ? Number(currentAmount) : 0,
      startDate: startDate ? new Date(startDate) : undefined,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      history: [],
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
    const nextHistory = Array.isArray(existing.history) ? [...existing.history, data.historyEntry] : [data.historyEntry];
    const result = await prisma.savings.updateMany({
      where: { id: Number(id), userId },
      data: {
        currentAmount: data.currentAmount != null ? Number(data.currentAmount) : undefined,
        history: nextHistory
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
  const nextHistory = Array.isArray(existing.history) ? [...existing.history, entry] : [entry];
  const nextAmount = (Number(existing.currentAmount || 0) + Number(entry.amount || 0));
  const result = await prisma.savings.updateMany({ where: { id: Number(id), userId }, data: { history: nextHistory, currentAmount: nextAmount } });
  if (result.count === 0) throw new Error("Savings not found or not permitted");
  return prisma.savings.findUnique({ where: { id: Number(id) } });
};

module.exports = {
  getAllSavings,
  createSavings,
  deleteSavings
};

module.exports.updateSavings = updateSavings;
module.exports.addHistoryEntry = addHistoryEntry;

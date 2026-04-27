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
      userId
    }
  });
};

const deleteSavings = async (id, userId) => {
  return prisma.savings.delete({
    where: {
      id: Number(id),
      userId
    }
  });
};

const updateSavings = async (id, data, userId) => {
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

module.exports = {
  getAllSavings,
  createSavings,
  deleteSavings
};

module.exports.updateSavings = updateSavings;

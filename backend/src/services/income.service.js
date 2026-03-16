const prisma = require("../prisma/client");

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

  return prisma.income.create({
    data: {
      title,
      amount: Number(amount),
      source,
      userId
    }
  });
};

const deleteIncome = async (id, userId) => {
  return prisma.income.delete({
    where: {
      id: Number(id),
      userId 
    }
  });
};

const updateIncome = async (id, data, userId) => {
  const result = await prisma.income.updateMany({
    where: { id: Number(id), userId },
    data: {
      title: data.title,
      amount: data.amount != null ? Number(data.amount) : undefined,
      source: data.source,
      date: data.date ? new Date(data.date) : undefined
    }
  });
  if (result.count === 0) throw new Error("Income not found or not permitted");
  return prisma.income.findUnique({ where: { id: Number(id) } });
};

module.exports = { getAllIncomes, createIncome, deleteIncome };
module.exports.updateIncome = updateIncome;

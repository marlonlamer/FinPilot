const prisma = require("../prisma/client");

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
  return prisma.expense.create({
    data: {
      title,
      amount: Number(amount),
      category,
      userId
    }
  });
};

const deleteExpense = async (id, userId) => {
  return prisma.expense.delete({
    where: {
      id: Number(id),
      userId
    }
  });
};

const updateExpense = async (id, data, userId) => {
  const result = await prisma.expense.updateMany({
    where: { id: Number(id), userId },
    data: {
      title: data.title,
      amount: data.amount != null ? Number(data.amount) : undefined,
      category: data.category,
      date: data.date ? new Date(data.date) : undefined
    }
  });
  if (result.count === 0) throw new Error("Expense not found or not permitted");
  return prisma.expense.findUnique({ where: { id: Number(id) } });
};

module.exports = {
  getAllExpenses,
  createExpense,
  deleteExpense
  ,updateExpense
};


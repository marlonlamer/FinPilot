const prisma = require("../prisma/client");

const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const serializeDebt = (debt) => {
  if (!debt) return null;

  return {
    ...debt,
    originalAmount: debt.originalAmount != null ? Number(debt.originalAmount) : null,
    remainingBalance: debt.remainingBalance != null ? Number(debt.remainingBalance) : null,
    minimumPayment: debt.minimumPayment != null ? Number(debt.minimumPayment) : null
  };
};

const buildDebtPayload = (data) => {
  const payload = {};

  if (data.name != null) payload.name = String(data.name).trim();
  if (data.debtType != null) payload.debtType = String(data.debtType).trim();
  if (data.originalAmount != null) payload.originalAmount = Number(data.originalAmount);
  if (data.remainingBalance != null) payload.remainingBalance = Number(data.remainingBalance);
  if (data.minimumPayment != null) payload.minimumPayment = data.minimumPayment === "" ? null : Number(data.minimumPayment);
  if (data.dueDate != null) payload.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  if (data.paymentFrequency != null) payload.paymentFrequency = data.paymentFrequency === "" ? null : String(data.paymentFrequency).trim();
  if (data.status != null) payload.status = String(data.status).trim();
  if (data.notes != null) payload.notes = data.notes === "" ? null : String(data.notes).trim();
  if (data.account != null) payload.account = data.account === "" ? null : String(data.account).trim();

  return payload;
};

const validateDebtPayload = (payload) => {
  if (payload.name != null && payload.name === "") {
    throw createError("Name is required", 400);
  }

  if (payload.debtType != null && payload.debtType === "") {
    throw createError("Debt type is required", 400);
  }

  if (payload.originalAmount != null && payload.originalAmount < 0) {
    throw createError("Original amount cannot be negative", 400);
  }

  if (payload.remainingBalance != null && payload.remainingBalance < 0) {
    throw createError("Remaining balance cannot be negative", 400);
  }

  if (payload.minimumPayment != null && payload.minimumPayment < 0) {
    throw createError("Minimum payment cannot be negative", 400);
  }
};

const getAllDebts = async (userId) => {
  const debts = await prisma.debt.findMany({
    where: { userId: Number(userId) },
    orderBy: { createdAt: "desc" }
  });

  return debts.map(serializeDebt);
};

const getDebtById = async (id, userId) => {
  const debt = await prisma.debt.findUnique({ where: { id: Number(id) } });

  if (!debt) return null;

  if (debt.userId !== Number(userId)) {
    throw createError("Debt not found or not permitted", 403);
  }

  return serializeDebt(debt);
};

const createDebt = async (data, userId) => {
  const payload = buildDebtPayload(data);
  validateDebtPayload(payload);

  if (payload.name == null || payload.name === "") {
    throw createError("Name is required", 400);
  }

  if (payload.debtType == null || payload.debtType === "") {
    throw createError("Debt type is required", 400);
  }

  if (payload.originalAmount == null) {
    throw createError("Original amount is required", 400);
  }

  if (payload.remainingBalance == null) {
    payload.remainingBalance = payload.originalAmount;
  }

  const created = await prisma.debt.create({
    data: {
      ...payload,
      userId: Number(userId)
    }
  });

  return serializeDebt(created);
};

const updateDebt = async (id, data, userId) => {
  const existing = await prisma.debt.findUnique({ where: { id: Number(id) } });

  if (!existing) {
    throw createError("Debt not found", 404);
  }

  if (existing.userId !== Number(userId)) {
    throw createError("Debt not found or not permitted", 403);
  }

  const payload = buildDebtPayload(data);
  validateDebtPayload(payload);

  if (Object.keys(payload).length === 0) {
    return serializeDebt(existing);
  }

  const updated = await prisma.debt.update({
    where: { id: Number(id) },
    data: payload
  });

  return serializeDebt(updated);
};

const deleteDebt = async (id, userId) => {
  const existing = await prisma.debt.findUnique({ where: { id: Number(id) } });

  if (!existing) {
    throw createError("Debt not found", 404);
  }

  if (existing.userId !== Number(userId)) {
    throw createError("Debt not found or not permitted", 403);
  }

  await prisma.debt.delete({ where: { id: Number(id) } });

  return { success: true };
};

module.exports = {
  getAllDebts,
  getDebtById,
  createDebt,
  updateDebt,
  deleteDebt
};

const prisma = require("../prisma/client");
const { recalcUserAggregates } = require("./userAggregates.service");

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

const serializeDebtPayment = (payment) => {
  if (!payment) return null;

  return {
    ...payment,
    amount: payment.amount != null ? Number(payment.amount) : null
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

const getAllDebts = async (userId, query = {}) => {
  const where = { userId: Number(userId) };

  if (query.status && String(query.status).trim() !== "") {
    where.status = String(query.status).trim();
  }

  if (query.debtType && String(query.debtType).trim() !== "") {
    where.debtType = String(query.debtType).trim();
  }

  if (query.dueBefore) {
    const dueBeforeDate = new Date(query.dueBefore);
    if (!Number.isNaN(dueBeforeDate.getTime())) {
      where.dueDate = { lte: dueBeforeDate };
    }
  }

  const debts = await prisma.debt.findMany({
    where,
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

  await recalcUserAggregates(userId);

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

  await recalcUserAggregates(userId);

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

  await recalcUserAggregates(userId);

  return { success: true };
};

const payDebt = async (id, data, userId) => {
  const debtId = Number(id);
  const uid = Number(userId);

  if (data.amount == null || data.amount === "") {
    throw createError("Payment amount is required", 400);
  }

  const amount = Number(data.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw createError("Payment amount must be a positive number", 400);
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.debt.findUnique({ where: { id: debtId } });

    if (!existing) {
      throw createError("Debt not found", 404);
    }

    if (existing.userId !== uid) {
      throw createError("Debt not found or not permitted", 403);
    }

    const currentBalance = Number(existing.remainingBalance);
    if (amount > currentBalance) {
      throw createError("Payment amount cannot exceed remaining balance", 400);
    }

    const newBalance = Math.max(0, currentBalance - amount);
    const newStatus = newBalance === 0 ? "paid" : existing.status;

    let paymentDate = new Date();
    if (data.date != null && data.date !== "") {
      paymentDate = new Date(data.date);
      if (Number.isNaN(paymentDate.getTime())) {
        throw createError("Invalid payment date", 400);
      }
    }

    const payment = await tx.debtPayment.create({
      data: {
        debtId,
        userId: uid,
        amount,
        date: paymentDate,
        notes: data.notes ? String(data.notes).trim() : null
      }
    });

    const updatedDebt = await tx.debt.update({
      where: { id: debtId },
      data: {
        remainingBalance: newBalance,
        status: newStatus
      }
    });

    // Decrement user's available balance by payment amount
    await tx.user.updateMany({
      where: { id: uid },
      data: { availableBalance: { increment: -amount } }
    });

    await recalcUserAggregates(uid, tx);

    const updatedUser = await tx.user.findUnique({ where: { id: uid } });

    return {
      payment: serializeDebtPayment(payment),
      debt: serializeDebt(updatedDebt),
      availableBalance: updatedUser && updatedUser.availableBalance != null ? Number(updatedUser.availableBalance) : 0
    };
  });
};

const getDebtsSummary = async (userId) => {
  const uid = Number(userId);

  const [totalDebtsCount, activeDebtsCount, paidDebtsCount, totalOriginalAgg, totalRemainingAgg, totalMinimumAgg] = await Promise.all([
    prisma.debt.count({ where: { userId: uid } }),
    prisma.debt.count({ where: { userId: uid, status: { not: "paid" } } }),
    prisma.debt.count({ where: { userId: uid, status: "paid" } }),
    prisma.debt.aggregate({ where: { userId: uid }, _sum: { originalAmount: true } }),
    prisma.debt.aggregate({ where: { userId: uid, status: { not: "paid" } }, _sum: { remainingBalance: true } }),
    prisma.debt.aggregate({ where: { userId: uid, status: { not: "paid" } }, _sum: { minimumPayment: true } })
  ]);

  return {
    totalDebtsCount,
    activeDebtsCount,
    paidDebtsCount,
    totalOriginalAmount: totalOriginalAgg._sum && totalOriginalAgg._sum.originalAmount != null ? Number(totalOriginalAgg._sum.originalAmount) : 0,
    totalRemainingBalance: totalRemainingAgg._sum && totalRemainingAgg._sum.remainingBalance != null ? Number(totalRemainingAgg._sum.remainingBalance) : 0,
    totalMinimumPayment: totalMinimumAgg._sum && totalMinimumAgg._sum.minimumPayment != null ? Number(totalMinimumAgg._sum.minimumPayment) : 0
  };
};

module.exports = {
  getAllDebts,
  getDebtById,
  createDebt,
  updateDebt,
  deleteDebt,
  payDebt,
  getDebtsSummary
};

const prisma = require("../prisma/client");
const { recalcUserAggregates } = require("./userAggregates.service");
const { recalcMonthlyTotals } = require("./budgets.service");

const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const serializeBill = (bill) => {
  if (!bill) return null;

  return {
    ...bill,
    amount: bill.amount != null ? Number(bill.amount) : null
  };
};

const buildBillPayload = (data) => {
  const payload = {};

  if (data.name != null) payload.name = String(data.name).trim();
  if (data.category != null) payload.category = String(data.category).trim();
  if (data.amount != null) payload.amount = Number(data.amount);
  if (data.billingFrequency != null) payload.billingFrequency = data.billingFrequency === "" ? "monthly" : String(data.billingFrequency).trim();
  if (data.nextBillingDate != null) payload.nextBillingDate = data.nextBillingDate ? new Date(data.nextBillingDate) : null;
  if (data.paymentMethod != null) payload.paymentMethod = data.paymentMethod === "" ? null : String(data.paymentMethod).trim();
  if (data.autoPay != null) payload.autoPay = Boolean(data.autoPay);
  if (data.status != null) payload.status = String(data.status).trim();
  if (data.notes != null) payload.notes = data.notes === "" ? null : String(data.notes).trim();
  if (data.account != null) payload.account = data.account === "" ? null : String(data.account).trim();

  return payload;
};

const validateBillPayload = (payload) => {
  if (payload.name != null && payload.name === "") {
    throw createError("Name is required", 400);
  }

  if (payload.category != null && payload.category === "") {
    throw createError("Category is required", 400);
  }

  if (payload.amount != null && payload.amount < 0) {
    throw createError("Amount cannot be negative", 400);
  }
};

const computeNextBillingDate = (currentDate, frequency) => {
  const base = currentDate ? new Date(currentDate) : new Date();
  const next = new Date(base);
  switch (String(frequency).toLowerCase()) {
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "quarterly": {
      const targetMonth = next.getMonth() + 3;
      next.setMonth(targetMonth);
      if (next.getMonth() !== targetMonth % 12) {
        next.setDate(0); // Month-end clamp
      }
      break;
    }
    case "yearly": {
      const origMonth = next.getMonth();
      next.setFullYear(next.getFullYear() + 1);
      if (next.getMonth() !== origMonth) {
        next.setDate(0); // Leap-year clamp
      }
      break;
    }
    case "monthly":
    default: {
      const origDay = next.getDate();
      next.setMonth(next.getMonth() + 1);
      if (next.getDate() !== origDay) {
        next.setDate(0); // Month-end clamp
      }
      break;
    }
  }
  return next;
};

const getAllBills = async (userId, query = {}) => {
  const where = { userId: Number(userId) };

  if (query.status && String(query.status).trim() !== "") {
    where.status = String(query.status).trim();
  }

  if (query.category && String(query.category).trim() !== "") {
    where.category = String(query.category).trim();
  }

  if (query.upcoming === "true" || query.upcoming === true) {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    where.nextBillingDate = { gte: now, lte: in30Days };
  }

  if (query.dueBefore) {
    const dueBeforeDate = new Date(query.dueBefore);
    if (!Number.isNaN(dueBeforeDate.getTime())) {
      where.nextBillingDate = { ...(where.nextBillingDate || {}), lte: dueBeforeDate };
    }
  }

  const bills = await prisma.bill.findMany({
    where,
    orderBy: { createdAt: "desc" }
  });

  return bills.map(serializeBill);
};

const getBillById = async (id, userId) => {
  const bill = await prisma.bill.findUnique({ where: { id: Number(id) } });

  if (!bill) return null;

  if (bill.userId !== Number(userId)) {
    throw createError("Bill not found or not permitted", 403);
  }

  return serializeBill(bill);
};

const createBill = async (data, userId) => {
  const payload = buildBillPayload(data);
  validateBillPayload(payload);

  if (payload.name == null || payload.name === "") {
    throw createError("Name is required", 400);
  }

  if (payload.category == null || payload.category === "") {
    throw createError("Category is required", 400);
  }

  if (payload.amount == null) {
    throw createError("Amount is required", 400);
  }

  const created = await prisma.bill.create({
    data: {
      ...payload,
      userId: Number(userId)
    }
  });

  return serializeBill(created);
};

const updateBill = async (id, data, userId) => {
  const existing = await prisma.bill.findUnique({ where: { id: Number(id) } });

  if (!existing) {
    throw createError("Bill not found", 404);
  }

  if (existing.userId !== Number(userId)) {
    throw createError("Bill not found or not permitted", 403);
  }

  const payload = buildBillPayload(data);
  validateBillPayload(payload);

  if (Object.keys(payload).length === 0) {
    return serializeBill(existing);
  }

  const updated = await prisma.bill.update({
    where: { id: Number(id) },
    data: payload
  });

  return serializeBill(updated);
};

const deleteBill = async (id, userId) => {
  const existing = await prisma.bill.findUnique({ where: { id: Number(id) } });

  if (!existing) {
    throw createError("Bill not found", 404);
  }

  if (existing.userId !== Number(userId)) {
    throw createError("Bill not found or not permitted", 403);
  }

  await prisma.bill.delete({ where: { id: Number(id) } });

  return { success: true };
};

const payBill = async (id, data, userId) => {
  const billId = Number(id);
  const uid = Number(userId);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.bill.findUnique({ where: { id: billId } });

    if (!existing) {
      throw createError("Bill not found", 404);
    }

    if (existing.userId !== uid) {
      throw createError("Bill not found or not permitted", 403);
    }

    let payAmount;
    if (data && data.amount != null && data.amount !== "") {
      payAmount = Number(data.amount);
      if (!Number.isFinite(payAmount) || payAmount <= 0) {
        throw createError("Payment amount must be a positive number", 400);
      }
    } else {
      payAmount = Number(existing.amount);
      if (!Number.isFinite(payAmount) || payAmount <= 0) {
        throw createError("Bill amount is invalid", 400);
      }
    }

    let paymentDate = new Date();
    if (data && data.date != null && data.date !== "") {
      paymentDate = new Date(data.date);
      if (Number.isNaN(paymentDate.getTime())) {
        throw createError("Invalid payment date", 400);
      }
    }

    const nextBillingDate = computeNextBillingDate(existing.nextBillingDate, existing.billingFrequency);

    const updatedBill = await tx.bill.update({
      where: { id: billId },
      data: {
        nextBillingDate,
        status: "active",
        updatedAt: new Date()
      }
    });

    // Create Expense entry for bill payment
    const createdExpense = await tx.expense.create({
      data: {
        title: existing.name,
        amount: payAmount,
        category: existing.category,
        userId: uid,
        date: paymentDate
      }
    });

    // Update user available balance
    await tx.user.updateMany({
      where: { id: uid },
      data: { availableBalance: { increment: -payAmount } }
    });

    // Update monthlySpent if paymentDate is in current month
    const now = new Date();
    if (paymentDate.getFullYear() === now.getFullYear() && paymentDate.getMonth() === now.getMonth()) {
      await tx.user.updateMany({
        where: { id: uid },
        data: { monthlySpent: { increment: payAmount } }
      });
    }

    // Update budget aggregates for category/month if exists
    const monthStr = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
    const budget = await tx.budget.findFirst({
      where: { userId: uid, category: existing.category, month: monthStr }
    });
    if (budget) {
      const newSpent = Number(budget.budgetSpent || 0) + payAmount;
      const newRemaining = Number(budget.budgetLimit || 0) - newSpent;
      await tx.budget.update({
        where: { id: budget.id },
        data: { budgetSpent: { increment: payAmount }, budgetRemaining: newRemaining }
      });
      await recalcMonthlyTotals(uid, monthStr, tx);
    }

    await recalcUserAggregates(uid, tx);

    return {
      bill: serializeBill(updatedBill),
      expense: createdExpense
    };
  });
};

const getBillsSummary = async (userId) => {
  const uid = Number(userId);

  const [totalBillsCount, autoPayCount, allBills] = await Promise.all([
    prisma.bill.count({ where: { userId: uid } }),
    prisma.bill.count({ where: { userId: uid, autoPay: true } }),
    prisma.bill.findMany({ where: { userId: uid, status: { not: "inactive" } } })
  ]);

  let totalMonthlyCommitment = 0;
  allBills.forEach((b) => {
    const amt = Number(b.amount || 0);
    const freq = String(b.billingFrequency || "monthly").toLowerCase();
    switch (freq) {
      case "weekly":
        totalMonthlyCommitment += amt * 4.33;
        break;
      case "quarterly":
        totalMonthlyCommitment += amt / 3;
        break;
      case "yearly":
        totalMonthlyCommitment += amt / 12;
        break;
      case "monthly":
      default:
        totalMonthlyCommitment += amt;
        break;
    }
  });

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const upcomingBills7Days = [];
  const upcomingBills30Days = [];
  let totalUpcoming7DaysAmount = 0;
  let totalUpcoming30DaysAmount = 0;

  allBills.forEach((b) => {
    if (b.nextBillingDate) {
      const d = new Date(b.nextBillingDate);
      if (d >= now && d <= in7Days) {
        upcomingBills7Days.push(b);
        totalUpcoming7DaysAmount += Number(b.amount || 0);
      }
      if (d >= now && d <= in30Days) {
        upcomingBills30Days.push(b);
        totalUpcoming30DaysAmount += Number(b.amount || 0);
      }
    }
  });

  return {
    totalBillsCount,
    totalMonthlyCommitment: Number(totalMonthlyCommitment.toFixed(2)),
    autoPayCount,
    totalUpcoming7DaysAmount: Number(totalUpcoming7DaysAmount.toFixed(2)),
    totalUpcoming30DaysAmount: Number(totalUpcoming30DaysAmount.toFixed(2)),
    upcomingBills7Days: upcomingBills7Days.map(serializeBill),
    upcomingBills30Days: upcomingBills30Days.map(serializeBill)
  };
};

module.exports = {
  getAllBills,
  getBillById,
  createBill,
  updateBill,
  deleteBill,
  payBill,
  getBillsSummary,
  computeNextBillingDate
};

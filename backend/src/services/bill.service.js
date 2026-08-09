const prisma = require("../prisma/client");

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

const getAllBills = async (userId) => {
  const bills = await prisma.bill.findMany({
    where: { userId: Number(userId) },
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

module.exports = {
  getAllBills,
  getBillById,
  createBill,
  updateBill,
  deleteBill
};

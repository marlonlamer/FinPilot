const debtService = require("../services/debt.service");

const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getDebts = async (req, res) => {
  try {
    const debts = await debtService.getAllDebts(req.userId, req.query);
    res.json(debts);
  } catch (error) {
    console.error("Get debts error:", error);
    res.status(error.statusCode || 500).json({ error: error.message || "Failed to fetch debts" });
  }
};

const getDebtSummary = async (req, res) => {
  try {
    const summary = await debtService.getDebtsSummary(req.userId);
    res.json(summary);
  } catch (error) {
    console.error("Get debt summary error:", error);
    res.status(error.statusCode || 500).json({ error: error.message || "Failed to fetch debt summary" });
  }
};

const getDebtById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw createError("Invalid debt id", 400);
    }

    const debt = await debtService.getDebtById(id, req.userId);
    if (!debt) {
      return res.status(404).json({ error: "Debt not found" });
    }

    res.json(debt);
  } catch (error) {
    console.error("Get debt error:", error);
    res.status(error.statusCode || 500).json({ error: error.message || "Failed to fetch debt" });
  }
};

const createDebt = async (req, res) => {
  try {
    const { name, debtType, originalAmount, remainingBalance, minimumPayment, dueDate, paymentFrequency, status, notes, account } = req.body;

    if (!name || String(name).trim() === "") {
      throw createError("Name is required", 400);
    }

    if (!debtType || String(debtType).trim() === "") {
      throw createError("Debt type is required", 400);
    }

    if (originalAmount == null || originalAmount === "") {
      throw createError("Original amount is required", 400);
    }

    const debt = await debtService.createDebt({
      name,
      debtType,
      originalAmount,
      remainingBalance,
      minimumPayment,
      dueDate,
      paymentFrequency,
      status,
      notes,
      account
    }, req.userId);

    res.status(201).json(debt);
  } catch (error) {
    console.error("Create debt error:", error);
    res.status(error.statusCode || 500).json({ error: error.message || "Failed to create debt" });
  }
};

const updateDebt = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw createError("Invalid debt id", 400);
    }

    const debt = await debtService.updateDebt(id, req.body, req.userId);
    res.json(debt);
  } catch (error) {
    console.error("Update debt error:", error);
    res.status(error.statusCode || 500).json({ error: error.message || "Failed to update debt" });
  }
};

const deleteDebt = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw createError("Invalid debt id", 400);
    }

    await debtService.deleteDebt(id, req.userId);
    res.json({ message: "Debt deleted" });
  } catch (error) {
    console.error("Delete debt error:", error);
    res.status(error.statusCode || 500).json({ error: error.message || "Failed to delete debt" });
  }
};

const payDebt = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw createError("Invalid debt id", 400);
    }

    const result = await debtService.payDebt(id, req.body, req.userId);
    res.json(result);
  } catch (error) {
    console.error("Pay debt error:", error);
    res.status(error.statusCode || 500).json({ error: error.message || "Failed to process debt payment" });
  }
};

module.exports = {
  getDebts,
  getDebtSummary,
  getDebtById,
  createDebt,
  updateDebt,
  deleteDebt,
  payDebt
};

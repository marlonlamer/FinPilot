const billService = require("../services/bill.service");

const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getBills = async (req, res) => {
  try {
    const bills = await billService.getAllBills(req.userId);
    res.json(bills);
  } catch (error) {
    console.error("Get bills error:", error);
    res.status(error.statusCode || 500).json({ error: error.message || "Failed to fetch bills" });
  }
};

const getBillById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw createError("Invalid bill id", 400);
    }

    const bill = await billService.getBillById(id, req.userId);
    if (!bill) {
      return res.status(404).json({ error: "Bill not found" });
    }

    res.json(bill);
  } catch (error) {
    console.error("Get bill error:", error);
    res.status(error.statusCode || 500).json({ error: error.message || "Failed to fetch bill" });
  }
};

const createBill = async (req, res) => {
  try {
    const { name, category, amount, billingFrequency, nextBillingDate, paymentMethod, autoPay, status, notes, account } = req.body;

    if (!name || String(name).trim() === "") {
      throw createError("Name is required", 400);
    }

    if (!category || String(category).trim() === "") {
      throw createError("Category is required", 400);
    }

    if (amount == null || amount === "") {
      throw createError("Amount is required", 400);
    }

    const bill = await billService.createBill({
      name,
      category,
      amount,
      billingFrequency,
      nextBillingDate,
      paymentMethod,
      autoPay,
      status,
      notes,
      account
    }, req.userId);

    res.status(201).json(bill);
  } catch (error) {
    console.error("Create bill error:", error);
    res.status(error.statusCode || 500).json({ error: error.message || "Failed to create bill" });
  }
};

const updateBill = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw createError("Invalid bill id", 400);
    }

    const bill = await billService.updateBill(id, req.body, req.userId);
    res.json(bill);
  } catch (error) {
    console.error("Update bill error:", error);
    res.status(error.statusCode || 500).json({ error: error.message || "Failed to update bill" });
  }
};

const deleteBill = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw createError("Invalid bill id", 400);
    }

    await billService.deleteBill(id, req.userId);
    res.json({ message: "Bill deleted" });
  } catch (error) {
    console.error("Delete bill error:", error);
    res.status(error.statusCode || 500).json({ error: error.message || "Failed to delete bill" });
  }
};

module.exports = {
  getBills,
  getBillById,
  createBill,
  updateBill,
  deleteBill
};

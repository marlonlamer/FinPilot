const savingsService = require("../services/savings.service");

const getSavings = async (req, res) => {
  try {
    const savings = await savingsService.getAllSavings(req.userId);
    const parsed = (savings || []).map(s => ({
      ...s,
      history: typeof s.history === 'string' ? (s.history ? JSON.parse(s.history) : []) : (s.history || [])
    }));
    res.json(parsed);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch savings" });
  }
};

const deposit = async (req, res) => {
  try {
    const { savingsId, amount, note } = req.body;
    if (amount == null) return res.status(400).json({ error: 'Amount is required' });
    await savingsService.addTransaction({ savingsId, type: 'deposit', amount: Number(amount), note: note || null, userId: req.userId });
    const balance = await savingsService.getSavingsBalance(req.userId, savingsId);
    res.json({ balance, savingsId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to deposit' });
  }
};

const withdraw = async (req, res) => {
  try {
    const { savingsId, amount, note } = req.body;
    if (amount == null) return res.status(400).json({ error: 'Amount is required' });
    // ensure user has sufficient balance for this savings if savingsId provided
    if (savingsId) {
      const current = await savingsService.getSavingsBalance(req.userId, savingsId);
      if (Number(amount) > Number(current)) return res.status(400).json({ error: 'Insufficient saved amount' });
    }
    await savingsService.addTransaction({ savingsId, type: 'withdraw', amount: Number(amount), note: note || null, userId: req.userId });
    const balance = await savingsService.getSavingsBalance(req.userId, savingsId);
    res.json({ balance, savingsId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to withdraw' });
  }
};

const getBalance = async (req, res) => {
  try {
    const paramUserId = Number(req.params.userId);
    if (paramUserId !== req.userId) return res.status(403).json({ error: 'Forbidden' });
    // Optionally support query ?savingsId=...
    const savingsId = req.query.savingsId ? Number(req.query.savingsId) : undefined;
    if (savingsId) {
      const balance = await savingsService.getSavingsBalance(req.userId, savingsId);
      return res.json({ total: balance, perSavings: [{ savingsId, balance }] });
    }
    // return total and per-savings breakdown
    const savingsList = await savingsService.getAllSavings(req.userId);
    const per = await Promise.all(savingsList.map(async (s) => ({ savingsId: s.id, balance: await savingsService.getSavingsBalance(req.userId, s.id) })));
    const total = per.reduce((acc, p) => acc + Number(p.balance || 0), 0);
    res.json({ total, perSavings: per });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
};

const getHistory = async (req, res) => {
  try {
    const paramUserId = Number(req.params.userId);
    if (paramUserId !== req.userId) return res.status(403).json({ error: 'Forbidden' });
    const savingsId = req.query.savingsId ? Number(req.query.savingsId) : undefined;
    const list = await savingsService.getTransactions(req.userId, savingsId);
    res.json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch savings history' });
  }
};

const updateTransaction = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { amount, note } = req.body;
    if (amount == null) return res.status(400).json({ error: 'Amount is required' });
    if (Number(amount) < 0) return res.status(400).json({ error: 'Amount cannot be negative' });
    const updated = await savingsService.updateTransaction(id, { amount: Number(amount), note: note || null }, req.userId);
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const id = Number(req.params.id);
    await savingsService.deleteTransaction(id, req.userId);
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
};

const createSavings = async (req, res) => {
  const { name, targetAmount, currentAmount, startDate, targetDate } = req.body;

  if (!name || targetAmount == null) {
    return res.status(400).json({ error: "Name and targetAmount are required" });
  }

  try {
    const savings = await savingsService.createSavings({
      name,
      targetAmount: Number(targetAmount),
      currentAmount: currentAmount != null ? Number(currentAmount) : 0,
      startDate: startDate || undefined,
      targetDate: targetDate || undefined,
      userId: req.userId
    });
    const parsed = { ...savings, history: typeof savings.history === 'string' ? (savings.history ? JSON.parse(savings.history) : []) : (savings.history || []) };
    res.status(201).json(parsed);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create savings" });
  }
};

const deleteSavings = async (req, res) => {
  try {
    await savingsService.deleteSavings(req.params.id, req.userId);
    res.json({ message: "Savings deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete savings" });
  }
};

const updateSavings = async (req, res) => {
  const { name, targetAmount, currentAmount, startDate, targetDate, historyEntry } = req.body;
  try {
    if (historyEntry) {
      const updated = await savingsService.updateSavings(req.params.id, { historyEntry, currentAmount }, req.userId);
      const parsed = { ...updated, history: typeof updated.history === 'string' ? (updated.history ? JSON.parse(updated.history) : []) : (updated.history || []) };
      return res.json(parsed);
    }

    const updated = await savingsService.updateSavings(req.params.id, {
      name: name || undefined,
      targetAmount,
      currentAmount,
      startDate,
      targetDate
    }, req.userId);
    const parsed = { ...updated, history: typeof updated.history === 'string' ? (updated.history ? JSON.parse(updated.history) : []) : (updated.history || []) };
    res.json(parsed);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update savings" });
  }
};

module.exports = {
  getSavings,
  createSavings,
  deleteSavings,
  updateSavings
};

module.exports.deposit = deposit;
module.exports.withdraw = withdraw;
module.exports.getBalance = getBalance;
module.exports.getHistory = getHistory;
module.exports.updateTransaction = updateTransaction;
module.exports.deleteTransaction = deleteTransaction;

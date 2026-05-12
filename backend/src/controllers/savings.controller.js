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

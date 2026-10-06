const incomeService = require("../services/income.service");
const { parseRecurrence } = require("../utils/recurrence");

const getIncomes = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({error: "Unauthorized"});
    }

    const month = req.query.month || null;
    const incomes = await incomeService.getAllIncomes(req.userId, month);
    res.json(incomes);
  } catch (error) {
    console.error("Fetch incomes error:", error);
    res.status(500).json({ error: "Failed to fetch incomes" });
  }
};

const createIncome = async (req, res) => {
  // Map frontend fields: frontend may send category/notes/date; use source + amount as required
  const { amount, source, date, category, isRecurring, recurrenceFrequency, recurrenceEndDate } = req.body;

  if (!amount || !source) {
    return res.status(400).json({ error: "Amount and source are required" });
  }

  const recurrence = parseRecurrence({ isRecurring, recurrenceFrequency, recurrenceEndDate });
  if (recurrence.error) return res.status(400).json({ error: recurrence.error });

  try {
    const income = await incomeService.createIncome({
      title: category || "",
      amount: Number(amount),
      source,
      userId: req.userId,
      date: date || undefined,
      ...recurrence.value
    });

    res.status(201).json(income);
  } catch (error) {
    console.error("Create income error:", error);
    res.status(500).json({ error: "Failed to create income" });
  }
};

const deleteIncome = async (req, res) => {
  try {
    await incomeService.deleteIncome(req.params.id, req.userId);
    res.json({ message: "Income deleted" });
  } catch (error) {
    console.error("Delete income error:", error);
    res.status(500).json({ error: "Failed to delete income" });
  }
};

const updateIncome = async (req, res) => {
  const { amount, source, date, category, isRecurring, recurrenceFrequency, recurrenceEndDate } = req.body;
  
  const recurrence = parseRecurrence({ isRecurring, recurrenceFrequency, recurrenceEndDate });
  if (recurrence.error) return res.status(400).json({ error: recurrence.error });

  try {
    const updated = await incomeService.updateIncome(req.params.id, {
      title: category || undefined,
      amount,
      source,
      date,
      ...recurrence.value
    }, req.userId);
    res.json(updated);
  } catch (error) {
    console.error("Update income error:", error);
    res.status(500).json({ error: "Failed to update income" });
  }
};

module.exports = {
  getIncomes,
  createIncome,
  deleteIncome,
  updateIncome
};

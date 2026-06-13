const expenseService = require("../services/expense.service");


const getExpenses = async (req, res) => {
  try {
    // accept optional month=YYYY-MM
    const month = req.query.month || null;
    const expenses = await expenseService.getAllExpenses(req.userId, month);
    res.json(expenses);
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
};

const createExpense = async (req, res) => {
  // Frontend may send description/source/notes; map description -> title
  const { description, amount, category, date } = req.body;

  if (!amount) {
    return res.status(400).json({ error: "Amount is required" });
  }

  try {
    const expense = await expenseService.createExpense({
      title: description || "",
      amount: Number(amount),
      category: category || "",
      userId: req.userId,
      date: date || undefined
    });
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: "Failed to create expense" });
  }
};

const deleteExpense = async (req, res) => {
  try {
    await expenseService.deleteExpense(req.params.id, req.userId);
    res.json({ message: "Expense deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete expense" });
  }
};

const updateExpense = async (req, res) => {
  const { description, amount, category, date } = req.body;
  try {
    const updated = await expenseService.updateExpense(req.params.id, {
      title: description || undefined,
      amount,
      category,
      date
    }, req.userId);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update expense" });
  }
};

module.exports = {
  getExpenses,
  createExpense,
  deleteExpense,
  updateExpense
};

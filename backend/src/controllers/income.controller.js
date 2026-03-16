const incomeService = require("../services/income.service");

const getIncomes = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({error: "Unauthorized"});
    }

    const incomes = await incomeService.getAllIncomes(req.userId);
    res.json(incomes);
  } catch (error) {
    console.error("Fetch incomes error:", error);
    res.status(500).json({ error: "Failed to fetch incomes" });
  }
};

const createIncome = async (req, res) => {
  // Map frontend fields: frontend may send category/notes/date; use source + amount as required
  const { amount, source, date, category } = req.body;

  if (!amount || !source) {
    return res.status(400).json({ error: "Amount and source are required" });
  }

  try {
    const income = await incomeService.createIncome({
      title: category || "",
      amount: Number(amount),
      source,
      userId: req.userId,
      date: date || undefined
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
  const { amount, source, date, category } = req.body;
  try {
    const updated = await incomeService.updateIncome(req.params.id, {
      title: category || undefined,
      amount,
      source,
      date
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

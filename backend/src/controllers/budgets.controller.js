const prisma = require("../prisma/client");

const listBudgets = async (req, res) => {
  try {
    const userId = Number(req.userId);
    const items = await prisma.budget.findMany({ where: { userId } });
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to list budgets' });
  }
};

const createBudget = async (req, res) => {
  try {
    const userId = Number(req.userId);
    const { category, amount } = req.body;
    if (!category || category.trim() === "") return res.status(400).json({ error: 'Category is required' });
    const num = Number(amount || 0);
    const created = await prisma.budget.create({ data: { userId, category: String(category).trim(), amount: num } });
    res.status(201).json(created);
  } catch (error) {
    console.error(error);
    if (String(error).includes('Unique constraint failed')) return res.status(400).json({ error: 'Budget for this category already exists' });
    res.status(500).json({ error: 'Failed to create budget' });
  }
};

const updateBudget = async (req, res) => {
  try {
    const userId = Number(req.userId);
    const id = Number(req.params.id);
    const { category, amount } = req.body;
    const existing = await prisma.budget.findUnique({ where: { id } });
    if (!existing || Number(existing.userId) !== userId) return res.status(404).json({ error: 'Budget not found' });
    const data = {};
    if (category != null) data.category = String(category).trim();
    if (amount != null) data.amount = Number(amount);
    const updated = await prisma.budget.update({ where: { id }, data });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update budget' });
  }
};

const deleteBudget = async (req, res) => {
  try {
    const userId = Number(req.userId);
    const id = Number(req.params.id);
    const existing = await prisma.budget.findUnique({ where: { id } });
    if (!existing || Number(existing.userId) !== userId) return res.status(404).json({ error: 'Budget not found' });
    await prisma.budget.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
};

module.exports = { listBudgets, createBudget, updateBudget, deleteBudget };

const prisma = require("../prisma/client");
const { recalcMonthlyTotals } = require('../services/budgets.service');

const listBudgets = async (req, res) => {
  try {
    const userId = Number(req.userId);
    // allow optional month query param (YYYY-MM); default to current month
    const month = req.query.month || (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; })();
    const items = await prisma.budget.findMany({ where: { userId, month } });
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to list budgets' });
  }
};

const budgetSummary = async (req, res) => {
  try {
    const userId = Number(req.userId);
    const month = req.query.month || (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; })();
    const totals = await recalcMonthlyTotals(userId, month);
    res.json(totals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to compute budget summary' });
  }
};

const createBudget = async (req, res) => {
  try {
    const userId = Number(req.userId);
    const { category, budgetLimit, month } = req.body;
    if (!category || category.trim() === "") return res.status(400).json({ error: 'Category is required' });
    const limit = Number(budgetLimit || 0);
    const m = month || `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`;

    // compute existing spent for this user/category/month
    const start = new Date(`${m}-01T00:00:00Z`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    const spentAggregate = await prisma.expense.aggregate({ where: { userId, category: String(category).trim(), date: { gte: start, lt: end } }, _sum: { amount: true } });
    const spent = Number(spentAggregate._sum.amount || 0);
    const remaining = limit - spent;

    const created = await prisma.budget.create({ data: { userId, category: String(category).trim(), budgetLimit: limit, budgetSpent: spent, budgetRemaining: remaining, month: m } });
    // Recalculate and persist monthly totals for user
    try { await recalcMonthlyTotals(userId, m); } catch (e) { console.warn('Failed to recalc monthly totals after createBudget', e); }
    res.status(201).json(created);
  } catch (error) {
    console.error(error);
    if (String(error).includes('Unique constraint failed')) return res.status(400).json({ error: 'Budget for this category already exists for the month' });
    res.status(500).json({ error: 'Failed to create budget' });
  }
};

const updateBudget = async (req, res) => {
  try {
    const userId = Number(req.userId);
    const id = Number(req.params.id);
    const { category, budgetLimit } = req.body;
    const existing = await prisma.budget.findUnique({ where: { id } });
    if (!existing || Number(existing.userId) !== userId) return res.status(404).json({ error: 'Budget not found' });
    const data = {};
    if (category != null) data.category = String(category).trim();
    if (budgetLimit != null) data.budgetLimit = Number(budgetLimit);
    // if budgetLimit changed, recalc remaining (guard existing spent)
    if (budgetLimit != null) {
      const spent = Number(existing.budgetSpent || 0);
      const limit = Number(budgetLimit || 0);
      data.budgetRemaining = limit - spent;
    }
    const updated = await prisma.budget.update({ where: { id }, data });
    try { await recalcMonthlyTotals(userId, existing.month || (new Date().getFullYear() + '-' + String(new Date().getMonth()+1).padStart(2,'0'))); } catch (e) { console.warn('Failed to recalc monthly totals after updateBudget', e); }
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
    try { await recalcMonthlyTotals(userId, existing.month || (new Date().getFullYear() + '-' + String(new Date().getMonth()+1).padStart(2,'0'))); } catch (e) { console.warn('Failed to recalc monthly totals after deleteBudget', e); }
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
};

module.exports = { listBudgets, createBudget, updateBudget, deleteBudget, budgetSummary };

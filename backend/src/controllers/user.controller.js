const prisma = require("../prisma/client");

const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || String(name).trim() === "") return res.status(400).json({ error: "Name is required" });

    const updated = await prisma.user.update({ where: { id: Number(req.userId) }, data: { name: String(name).trim() } });
    res.json({ id: updated.id, email: updated.email, name: updated.name });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: Number(req.userId) } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, email: user.email, name: user.name, availableBalance: user.availableBalance || 0, monthlyBudget: user.monthlyBudget || 0, monthlySpent: user.monthlySpent || 0, totalSavings: user.totalSavings || 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

const updateBudget = async (req, res) => {
  try {
    const { monthlyBudget, monthlySpent } = req.body;
    const data = {};
    if (monthlyBudget != null) data.monthlyBudget = Number(monthlyBudget);
    if (monthlySpent != null) data.monthlySpent = Number(monthlySpent);
    const updated = await prisma.user.update({ where: { id: Number(req.userId) }, data });
    res.json({ id: updated.id, monthlyBudget: updated.monthlyBudget, monthlySpent: updated.monthlySpent, availableBalance: updated.availableBalance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update budget' });
  }
};

module.exports = { updateProfile, getUser, updateBudget };

const prisma = require("../prisma/client");
const bcrypt = require("bcrypt");

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

const deleteBudget = async (req, res) => {
  try {
    const updated = await prisma.user.update({ where: { id: Number(req.userId) }, data: { monthlyBudget: null } });
    res.json({ id: updated.id, monthlyBudget: updated.monthlyBudget, monthlySpent: updated.monthlySpent, availableBalance: updated.availableBalance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete monthly budget' });
  }
};

const deleteAccount = async (req, res) => {
  const userId = Number(req.userId);
  const password = req.body && req.body.password;

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (typeof password !== "string" || password.length === 0) {
    return res.status(400).json({ error: "Current password is required" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true }
    });
    if (!user) return res.status(404).json({ error: "Account not found" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: "Current password is incorrect" });

    await prisma.$transaction(async (tx) => {
      const savings = await tx.savings.findMany({
        where: { userId },
        select: { id: true }
      });
      const savingsIds = savings.map(({ id }) => id);

      if (savingsIds.length > 0) {
        await tx.savingsTransaction.updateMany({
          where: {
            savingsId: { in: savingsIds },
            userId: { not: userId }
          },
          data: { savingsId: null }
        });
      }

      await tx.savingsTransaction.deleteMany({ where: { userId } });
      await tx.expense.deleteMany({ where: { userId } });
      await tx.income.deleteMany({ where: { userId } });
      await tx.budget.deleteMany({ where: { userId } });
      await tx.savings.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });

    return res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Failed to delete account", error);
    return res.status(500).json({ error: "Unable to delete account. Please try again." });
  }
};

module.exports = { updateProfile, getUser, updateBudget, deleteBudget, deleteAccount };

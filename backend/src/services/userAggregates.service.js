const prisma = require('../prisma/client');

async function recalcUserAggregates(userId) {
  const id = Number(userId);
  if (!id) throw new Error('userId required');

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error('User not found');

  const monthlyBudgetRemaining = (user.monthlyBudget || 0) - (user.monthlySpent || 0);
  const totalNetWorth = (user.availableBalance || 0) + (user.totalSavings || 0);

  await prisma.user.updateMany({ where: { id }, data: { monthlyBudgetRemaining, totalNetWorth } });
  return { monthlyBudgetRemaining, totalNetWorth };
}

async function recalcAllUsers() {
  const users = await prisma.user.findMany({ select: { id: true } });
  await Promise.all(users.map(u => recalcUserAggregates(u.id)));
}

module.exports = { recalcUserAggregates, recalcAllUsers };

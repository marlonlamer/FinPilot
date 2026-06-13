const defaultPrisma = require('../prisma/client');

async function recalcUserAggregates(userId, prismaClient) {
  const db = prismaClient || defaultPrisma;
  const id = Number(userId);
  if (!id) throw new Error('userId required');

  const user = await db.user.findUnique({ where: { id } });
  if (!user) throw new Error('User not found');

  const monthlyBudgetRemaining = (user.monthlyBudget || 0) - (user.monthlySpent || 0);
  const totalNetWorth = (user.availableBalance || 0) + (user.totalSavings || 0);

  await db.user.updateMany({ where: { id }, data: { monthlyBudgetRemaining, totalNetWorth } });
  return { monthlyBudgetRemaining, totalNetWorth };
}

async function recalcAllUsers(prismaClient) {
  const db = prismaClient || defaultPrisma;
  const users = await db.user.findMany({ select: { id: true } });
  await Promise.all(users.map(u => recalcUserAggregates(u.id, db)));
}

module.exports = { recalcUserAggregates, recalcAllUsers };

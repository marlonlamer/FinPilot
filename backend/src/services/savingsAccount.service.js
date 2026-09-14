const prisma = require("../prisma/client");

const getAllAccounts = (userId) => prisma.savingsAccount.findMany({
  where: { userId: Number(userId) },
  orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }]
});

const createAccount = async (data, userId) => {
  const uid = Number(userId);
  return prisma.$transaction(async (tx) => {
    if (data.isPrimary) {
      await tx.savingsAccount.updateMany({ where: { userId: uid }, data: { isPrimary: false } });
    }
    return tx.savingsAccount.create({ data: { ...data, userId: uid } });
  });
};

const updateAccount = async (id, data, userId) => {
  const accountId = Number(id);
  const uid = Number(userId);
  return prisma.$transaction(async (tx) => {
    const existing = await tx.savingsAccount.findFirst({ where: { id: accountId, userId: uid } });
    if (!existing) return null;

    if (data.isPrimary) {
      await tx.savingsAccount.updateMany({ where: { userId: uid, id: { not: accountId } }, data: { isPrimary: false } });
    }

    return tx.savingsAccount.update({
      where: { id: accountId },
      data
    });
  });
};

const deleteAccount = async (id, userId) => {
  const result = await prisma.savingsAccount.deleteMany({
    where: { id: Number(id), userId: Number(userId) }
  });
  return result.count > 0;
};

module.exports = { getAllAccounts, createAccount, updateAccount, deleteAccount };


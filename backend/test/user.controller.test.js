const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const bcrypt = require("bcrypt");
const prisma = require("../src/prisma/client");
const { deleteAccount } = require("../src/controllers/user.controller");
const authMiddleware = require("../src/middleware/auth.middleware");

const originalFindUnique = prisma.user.findUnique;
const originalTransaction = prisma.$transaction;
const correctPassword = "correct-password";
let passwordHash;

before(async () => {
  process.env.JWT_SECRET = "account-deletion-test-secret";
  passwordHash = await bcrypt.hash(correctPassword, 4);
});

after(() => {
  prisma.user.findUnique = originalFindUnique;
  prisma.$transaction = originalTransaction;
});

const createResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  }
});

const createTransaction = (calls) => ({
  savings: {
    findMany: async (args) => {
      calls.push(["savings.findMany", args]);
      return [{ id: 51 }];
    },
    deleteMany: async (args) => calls.push(["savings.deleteMany", args])
  },
  savingsTransaction: {
    updateMany: async (args) => calls.push(["savingsTransaction.updateMany", args]),
    deleteMany: async (args) => calls.push(["savingsTransaction.deleteMany", args])
  },
  expense: { deleteMany: async (args) => calls.push(["expense.deleteMany", args]) },
  income: { deleteMany: async (args) => calls.push(["income.deleteMany", args]) },
  budget: { deleteMany: async (args) => calls.push(["budget.deleteMany", args]) },
  user: { delete: async (args) => calls.push(["user.delete", args]) }
});

test("deletes only the authenticated user's account records after password confirmation", async () => {
  const calls = [];
  prisma.user.findUnique = async (args) => {
    assert.deepEqual(args, { where: { id: 5 }, select: { password: true } });
    return { password: passwordHash };
  };
  prisma.$transaction = async (callback) => callback(createTransaction(calls));

  const response = createResponse();
  await deleteAccount({
    userId: 5,
    body: { password: correctPassword, userId: 99 }
  }, response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { message: "Account deleted successfully" });
  assert.deepEqual(calls, [
    ["savings.findMany", { where: { userId: 5 }, select: { id: true } }],
    ["savingsTransaction.updateMany", {
      where: { savingsId: { in: [51] }, userId: { not: 5 } },
      data: { savingsId: null }
    }],
    ["savingsTransaction.deleteMany", { where: { userId: 5 } }],
    ["expense.deleteMany", { where: { userId: 5 } }],
    ["income.deleteMany", { where: { userId: 5 } }],
    ["budget.deleteMany", { where: { userId: 5 } }],
    ["savings.deleteMany", { where: { userId: 5 } }],
    ["user.delete", { where: { id: 5 } }]
  ]);
});

test("rejects an incorrect current password without starting deletion", async () => {
  let transactionStarted = false;
  prisma.user.findUnique = async () => ({ password: passwordHash });
  prisma.$transaction = async () => {
    transactionStarted = true;
  };

  const response = createResponse();
  await deleteAccount({ userId: 5, body: { password: "wrong-password" } }, response);

  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.body, { error: "Current password is incorrect" });
  assert.equal(transactionStarted, false);
});

test("rejects deletion when the current password is missing", async () => {
  const response = createResponse();
  await deleteAccount({ userId: 5, body: {} }, response);

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, { error: "Current password is required" });
});

test("reports a transaction failure without returning success", async () => {
  prisma.user.findUnique = async () => ({ password: passwordHash });
  prisma.$transaction = async () => {
    throw new Error("simulated transaction failure");
  };
  const originalError = console.error;
  console.error = () => {};

  try {
    const response = createResponse();
    await deleteAccount({ userId: 5, body: { password: correctPassword } }, response);
    assert.equal(response.statusCode, 500);
    assert.deepEqual(response.body, {
      error: "Unable to delete account. Please try again."
    });
  } finally {
    console.error = originalError;
  }
});

test("rejects unauthenticated requests in the existing auth middleware", () => {
  const response = createResponse();
  let nextCalled = false;

  authMiddleware({ headers: {} }, response, () => {
    nextCalled = true;
  });

  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.body, { error: "Unauthorized" });
  assert.equal(nextCalled, false);
});

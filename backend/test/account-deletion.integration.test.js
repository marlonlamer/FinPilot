const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const { randomUUID } = require("node:crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../src/prisma/client");
const app = require("../src/app");

const TEST_DATABASE = {
  database: "finpilot_test",
  host: "127.0.0.1",
  port: 55432,
  user: "finpilot_test"
};
const password = "integration-test-password";
const testUserIds = new Set();
let server;
let baseUrl;

const assertTestDatabase = async () => {
  const rows = await prisma.$queryRaw`
    SELECT current_database() AS database,
           host(inet_server_addr()) AS host,
           inet_server_port() AS port,
           current_user AS "user"
  `;
  assert.deepEqual(rows[0], TEST_DATABASE, "Refusing database operation outside finpilot_test");
};

const createUser = async (label) => {
  await assertTestDatabase();
  const user = await prisma.user.create({
    data: {
      name: `Integration ${label}`,
      email: `account-deletion-${randomUUID()}@example.test`,
      password: await bcrypt.hash(password, 4)
    }
  });
  testUserIds.add(user.id);
  return user;
};

const createFinancialRecords = async (userId) => {
  await assertTestDatabase();
  const savings = await prisma.savings.create({
    data: { name: "Integration savings", targetAmount: 500, userId }
  });
  const records = await Promise.all([
    prisma.expense.create({
      data: { title: "Integration expense", amount: 25, category: "Test", userId }
    }),
    prisma.income.create({
      data: { title: "Integration income", amount: 75, source: "Test", userId }
    }),
    prisma.savingsTransaction.create({
      data: { savingsId: savings.id, userId, amount: 10, type: "deposit" }
    }),
    prisma.budget.create({
      data: { userId, category: "Integration", month: "2099-01", budgetLimit: 100 }
    })
  ]);
  return { savings, expense: records[0], income: records[1], transaction: records[2], budget: records[3] };
};

const cleanupTestUsers = async () => {
  for (const userId of testUserIds) {
    await assertTestDatabase();
    await prisma.$transaction(async (tx) => {
      const savings = await tx.savings.findMany({ where: { userId }, select: { id: true } });
      if (savings.length > 0) {
        await tx.savingsTransaction.updateMany({
          where: { savingsId: { in: savings.map(({ id }) => id) } },
          data: { savingsId: null }
        });
      }
      await tx.savingsTransaction.deleteMany({ where: { userId } });
      await tx.expense.deleteMany({ where: { userId } });
      await tx.income.deleteMany({ where: { userId } });
      await tx.budget.deleteMany({ where: { userId } });
      await tx.savings.deleteMany({ where: { userId } });
      await tx.user.deleteMany({ where: { id: userId } });
    });
  }
  testUserIds.clear();
};

const deletionRequest = async (token, body = { password }) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${baseUrl}/api/user/account`, {
    method: "DELETE",
    headers,
    body: JSON.stringify(body)
  });
};

const makeToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "5m" });

before(async () => {
  await assertTestDatabase();
  await new Promise((resolve, reject) => {
    server = app.listen(0, "127.0.0.1");
    server.once("listening", resolve);
    server.once("error", reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  try {
    await cleanupTestUsers();
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
  }
});

test("account deletion endpoint against isolated PostgreSQL", async (t) => {
  await t.test("deletes the authenticated account and all owned financial records", async () => {
    const user = await createUser("success");
    const records = await createFinancialRecords(user.id);

    await assertTestDatabase();
    const response = await deletionRequest(makeToken(user.id));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { message: "Account deleted successfully" });

    const [deletedUser, expenses, incomes, savings, transactions, budgets] = await Promise.all([
      prisma.user.findUnique({ where: { id: user.id } }),
      prisma.expense.findMany({ where: { userId: user.id } }),
      prisma.income.findMany({ where: { userId: user.id } }),
      prisma.savings.findMany({ where: { userId: user.id } }),
      prisma.savingsTransaction.findMany({ where: { userId: user.id } }),
      prisma.budget.findMany({ where: { userId: user.id } })
    ]);
    assert.equal(deletedUser, null);
    assert.deepEqual([expenses, incomes, savings, transactions, budgets], [[], [], [], [], []]);
    assert.ok(records.expense.id && records.income.id && records.transaction.id && records.budget.id);
  });

  await t.test("rejects an incorrect password and preserves the account's records", async () => {
    const user = await createUser("wrong-password");
    await createFinancialRecords(user.id);

    await assertTestDatabase();
    const response = await deletionRequest(makeToken(user.id), { password: "incorrect-password" });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: "Current password is incorrect" });
    assert.ok(await prisma.user.findUnique({ where: { id: user.id } }));
    assert.equal(await prisma.expense.count({ where: { userId: user.id } }), 1);
    assert.equal(await prisma.income.count({ where: { userId: user.id } }), 1);
  });

  await t.test("rejects an unauthenticated request without deleting records", async () => {
    const user = await createUser("unauthenticated");
    await createFinancialRecords(user.id);

    await assertTestDatabase();
    const response = await deletionRequest(null);
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: "Unauthorized" });
    assert.ok(await prisma.user.findUnique({ where: { id: user.id } }));
    assert.equal(await prisma.expense.count({ where: { userId: user.id } }), 1);
  });

  await t.test("deleting one account preserves another user's financial records", async () => {
    const owner = await createUser("owner");
    const other = await createUser("other-user");
    await createFinancialRecords(owner.id);
    const otherRecords = await createFinancialRecords(other.id);

    await assertTestDatabase();
    const response = await deletionRequest(makeToken(owner.id));
    assert.equal(response.status, 200);
    assert.ok(await prisma.user.findUnique({ where: { id: other.id } }));
    assert.equal(await prisma.expense.count({ where: { userId: other.id } }), 1);
    assert.equal(await prisma.income.count({ where: { userId: other.id } }), 1);
    assert.equal(await prisma.savings.findUnique({ where: { id: otherRecords.savings.id } }).then(Boolean), true);
    assert.equal(await prisma.savingsTransaction.count({ where: { userId: other.id } }), 1);
    assert.equal(await prisma.budget.count({ where: { userId: other.id } }), 1);
  });

  await t.test("preserves another user's transaction when its savings owner is deleted", async () => {
    const owner = await createUser("savings-owner");
    const transactionOwner = await createUser("transaction-owner");
    const { savings } = await createFinancialRecords(owner.id);
    const transaction = await prisma.savingsTransaction.create({
      data: {
        savingsId: savings.id,
        userId: transactionOwner.id,
        amount: 42,
        type: "deposit",
        note: "Cross-user relation integration fixture"
      }
    });

    await assertTestDatabase();
    const response = await deletionRequest(makeToken(owner.id));
    assert.equal(response.status, 200);

    const preservedTransaction = await prisma.savingsTransaction.findUnique({
      where: { id: transaction.id }
    });
    assert.ok(preservedTransaction);
    assert.equal(preservedTransaction.userId, transactionOwner.id);
    assert.equal(preservedTransaction.savingsId, null);
    assert.ok(await prisma.user.findUnique({ where: { id: transactionOwner.id } }));
  });

  await t.test("rolls back all deletion changes when a database trigger fails", async () => {
    const user = await createUser("rollback");
    const records = await createFinancialRecords(user.id);
    const suffix = randomUUID().replace(/-/g, "");
    const functionName = `fp_test_fail_income_${suffix}`;
    const triggerName = `fp_test_fail_income_trigger_${suffix}`;
    let triggerInstalled = false;

    await assertTestDatabase();
    await prisma.$executeRawUnsafe(`
      CREATE FUNCTION "${functionName}"() RETURNS trigger
      LANGUAGE plpgsql AS $$
      BEGIN
        IF OLD."userId" = ${Number(user.id)} THEN
          RAISE EXCEPTION 'intentional account deletion rollback test';
        END IF;
        RETURN OLD;
      END;
      $$
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER "${triggerName}"
      BEFORE DELETE ON "Income"
      FOR EACH ROW EXECUTE FUNCTION "${functionName}"()
    `);
    triggerInstalled = true;

    try {
      await assertTestDatabase();
      const originalConsoleError = console.error;
      console.error = () => {};
      let response;
      try {
        response = await deletionRequest(makeToken(user.id));
      } finally {
        console.error = originalConsoleError;
      }
      assert.equal(response.status, 500);
      assert.deepEqual(await response.json(), {
        error: "Unable to delete account. Please try again."
      });

      const [stillExists, expense, income, savings, transaction, budget] = await Promise.all([
        prisma.user.findUnique({ where: { id: user.id } }),
        prisma.expense.findUnique({ where: { id: records.expense.id } }),
        prisma.income.findUnique({ where: { id: records.income.id } }),
        prisma.savings.findUnique({ where: { id: records.savings.id } }),
        prisma.savingsTransaction.findUnique({ where: { id: records.transaction.id } }),
        prisma.budget.findUnique({ where: { id: records.budget.id } })
      ]);
      assert.ok(stillExists);
      assert.ok(expense);
      assert.ok(income);
      assert.ok(savings);
      assert.ok(transaction);
      assert.ok(budget);
    } finally {
      if (triggerInstalled) {
        await assertTestDatabase();
        await prisma.$executeRawUnsafe(`DROP TRIGGER "${triggerName}" ON "Income"`);
      }
      await assertTestDatabase();
      await prisma.$executeRawUnsafe(`DROP FUNCTION "${functionName}"()`);
    }
  });

  await t.test("deleted credentials can no longer authenticate", async () => {
    const user = await createUser("login-after-delete");
    await assertTestDatabase();
    const response = await deletionRequest(makeToken(user.id));
    assert.equal(response.status, 200);

    await assertTestDatabase();
    const login = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, password })
    });
    assert.equal(login.status, 401);
    assert.deepEqual(await login.json(), { error: "Invalid credentials" });
  });
});

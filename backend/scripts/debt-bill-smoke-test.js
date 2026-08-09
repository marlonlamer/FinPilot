const assert = require('assert');

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:5000';

async function request(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch (error) {
    body = text;
  }
  return { status: res.status, body };
}

async function registerOrLoginUser(name, email) {
  const registerRes = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password: 'secret123' })
  });

  if (registerRes.status === 201 || registerRes.status === 200) {
    return registerRes.body;
  }

  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'secret123' })
  });

  if (loginRes.status !== 200) {
    throw new Error(`Registration/login failed: ${JSON.stringify(loginRes.body)}`);
  }

  return loginRes.body;
}

(async () => {
  const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const userA = await registerOrLoginUser('DebtTesterA', `debtusera_${uniqueSuffix}@example.com`);
  const userB = await registerOrLoginUser('DebtTesterB', `debtuserb_${uniqueSuffix}@example.com`);

  const headersA = { Authorization: `Bearer ${userA.token}` };
  const headersB = { Authorization: `Bearer ${userB.token}` };

  const createDebtRes = await request('/api/debts', {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      name: 'Car Loan',
      debtType: 'loan',
      originalAmount: 1200,
      remainingBalance: 900,
      minimumPayment: 45,
      dueDate: '2026-09-01T00:00:00.000Z',
      paymentFrequency: 'monthly',
      status: 'active',
      notes: 'Test debt',
      account: 'Bank'
    })
  });
  assert.strictEqual(createDebtRes.status, 201, `Create debt failed: ${JSON.stringify(createDebtRes.body)}`);
  const debtId = createDebtRes.body.id;

  const listDebtRes = await request('/api/debts', { headers: headersA });
  assert.strictEqual(listDebtRes.status, 200, `List debts failed: ${JSON.stringify(listDebtRes.body)}`);
  assert.ok(Array.isArray(listDebtRes.body));

  const getDebtRes = await request(`/api/debts/${debtId}`, { headers: headersA });
  assert.strictEqual(getDebtRes.status, 200, `Get debt failed: ${JSON.stringify(getDebtRes.body)}`);
  assert.strictEqual(getDebtRes.body.id, debtId);

  const updateDebtRes = await request(`/api/debts/${debtId}`, {
    method: 'PUT',
    headers: headersA,
    body: JSON.stringify({ remainingBalance: 850, status: 'paying' })
  });
  assert.strictEqual(updateDebtRes.status, 200, `Update debt failed: ${JSON.stringify(updateDebtRes.body)}`);
  assert.strictEqual(updateDebtRes.body.remainingBalance, 850);

  const unauthorizedGetDebtRes = await request(`/api/debts/${debtId}`, { headers: headersB });
  assert.strictEqual(unauthorizedGetDebtRes.status, 403, `Expected 403 for unauthorized debt get, got ${unauthorizedGetDebtRes.status}`);

  const unauthorizedUpdateDebtRes = await request(`/api/debts/${debtId}`, {
    method: 'PUT',
    headers: headersB,
    body: JSON.stringify({ remainingBalance: 1 })
  });
  assert.strictEqual(unauthorizedUpdateDebtRes.status, 403, `Expected 403 for unauthorized debt update, got ${unauthorizedUpdateDebtRes.status}`);

  const unauthorizedDeleteDebtRes = await request(`/api/debts/${debtId}`, { method: 'DELETE', headers: headersB });
  assert.strictEqual(unauthorizedDeleteDebtRes.status, 403, `Expected 403 for unauthorized debt delete, got ${unauthorizedDeleteDebtRes.status}`);

  const deleteDebtRes = await request(`/api/debts/${debtId}`, { method: 'DELETE', headers: headersA });
  assert.strictEqual(deleteDebtRes.status, 200, `Delete debt failed: ${JSON.stringify(deleteDebtRes.body)}`);

  const createBillRes = await request('/api/bills', {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      name: 'Electricity',
      category: 'utilities',
      amount: 89.5,
      billingFrequency: 'monthly',
      nextBillingDate: '2026-09-15T00:00:00.000Z',
      paymentMethod: 'card',
      autoPay: true,
      status: 'active',
      notes: 'Test bill',
      account: 'Checking'
    })
  });
  assert.strictEqual(createBillRes.status, 201, `Create bill failed: ${JSON.stringify(createBillRes.body)}`);
  const billId = createBillRes.body.id;

  const listBillRes = await request('/api/bills', { headers: headersA });
  assert.strictEqual(listBillRes.status, 200, `List bills failed: ${JSON.stringify(listBillRes.body)}`);
  assert.ok(Array.isArray(listBillRes.body));

  const getBillRes = await request(`/api/bills/${billId}`, { headers: headersA });
  assert.strictEqual(getBillRes.status, 200, `Get bill failed: ${JSON.stringify(getBillRes.body)}`);
  assert.strictEqual(getBillRes.body.id, billId);

  const updateBillRes = await request(`/api/bills/${billId}`, {
    method: 'PUT',
    headers: headersA,
    body: JSON.stringify({ amount: 95.25, status: 'pending' })
  });
  assert.strictEqual(updateBillRes.status, 200, `Update bill failed: ${JSON.stringify(updateBillRes.body)}`);
  assert.strictEqual(updateBillRes.body.amount, 95.25);

  const unauthorizedGetBillRes = await request(`/api/bills/${billId}`, { headers: headersB });
  assert.strictEqual(unauthorizedGetBillRes.status, 403, `Expected 403 for unauthorized bill get, got ${unauthorizedGetBillRes.status}`);

  const unauthorizedUpdateBillRes = await request(`/api/bills/${billId}`, {
    method: 'PUT',
    headers: headersB,
    body: JSON.stringify({ amount: 1 })
  });
  assert.strictEqual(unauthorizedUpdateBillRes.status, 403, `Expected 403 for unauthorized bill update, got ${unauthorizedUpdateBillRes.status}`);

  const unauthorizedDeleteBillRes = await request(`/api/bills/${billId}`, { method: 'DELETE', headers: headersB });
  assert.strictEqual(unauthorizedDeleteBillRes.status, 403, `Expected 403 for unauthorized bill delete, got ${unauthorizedDeleteBillRes.status}`);

  const deleteBillRes = await request(`/api/bills/${billId}`, { method: 'DELETE', headers: headersA });
  assert.strictEqual(deleteBillRes.status, 200, `Delete bill failed: ${JSON.stringify(deleteBillRes.body)}`);

  const expensesRes = await request('/api/expenses', { headers: headersA });
  assert.strictEqual(expensesRes.status, 200, `Expenses API failed: ${JSON.stringify(expensesRes.body)}`);
  const incomesRes = await request('/api/incomes', { headers: headersA });
  assert.strictEqual(incomesRes.status, 200, `Incomes API failed: ${JSON.stringify(incomesRes.body)}`);
  const savingsRes = await request('/api/savings', { headers: headersA });
  assert.strictEqual(savingsRes.status, 200, `Savings API failed: ${JSON.stringify(savingsRes.body)}`);
  const budgetsRes = await request('/api/budgets', { headers: headersA });
  assert.strictEqual(budgetsRes.status, 200, `Budgets API failed: ${JSON.stringify(budgetsRes.body)}`);
  const dashboardRes = await request('/api/dashboard', { headers: headersA });
  assert.strictEqual(dashboardRes.status, 200, `Dashboard API failed: ${JSON.stringify(dashboardRes.body)}`);
  const reportsRes = await request('/api/reports', { headers: headersA });
  assert.strictEqual(reportsRes.status, 200, `Reports API failed: ${JSON.stringify(reportsRes.body)}`);

  console.log('Debt and bill API smoke test passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

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

  const meBeforeRes = await request('/api/user/me', { headers: headersA });
  assert.strictEqual(meBeforeRes.status, 200);
  const balanceBefore = Number(meBeforeRes.body.availableBalance || 0);
  const monthlySpentBefore = Number(meBeforeRes.body.monthlySpent || 0);

  const expensesBeforeRes = await request('/api/expenses', { headers: headersA });
  assert.strictEqual(expensesBeforeRes.status, 200);
  const expenseCountBefore = Array.isArray(expensesBeforeRes.body) ? expensesBeforeRes.body.length : 0;

  // --- 1. DEBT CRUD & FILTERING ---
  const createDebtRes = await request('/api/debts', {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      name: 'Car Loan',
      debtType: 'loan',
      originalAmount: 1000,
      remainingBalance: 1000,
      minimumPayment: 50,
      dueDate: '2026-09-01T00:00:00.000Z',
      paymentFrequency: 'monthly',
      status: 'active',
      notes: 'Test debt',
      account: 'Bank'
    })
  });
  assert.strictEqual(createDebtRes.status, 201, `Create debt failed: ${JSON.stringify(createDebtRes.body)}`);
  const debtId = createDebtRes.body.id;

  const dashboardWithDebtRes = await request('/api/dashboard', { headers: headersA });
  assert.strictEqual(dashboardWithDebtRes.status, 200);
  assert.strictEqual(dashboardWithDebtRes.body.totals.totalDebt, 1000);
  const netWorthBeforePay = Number(dashboardWithDebtRes.body.totals.totalNetWorth);

  // List & Filtering
  const listDebtRes = await request('/api/debts?status=active', { headers: headersA });
  assert.strictEqual(listDebtRes.status, 200, `List debts failed: ${JSON.stringify(listDebtRes.body)}`);
  assert.ok(Array.isArray(listDebtRes.body));
  assert.strictEqual(listDebtRes.body.length, 1);

  // Get Debt detail
  const getDebtRes = await request(`/api/debts/${debtId}`, { headers: headersA });
  assert.strictEqual(getDebtRes.status, 200, `Get debt failed: ${JSON.stringify(getDebtRes.body)}`);
  assert.strictEqual(getDebtRes.body.id, debtId);

  // --- 2. DEBT PAYMENTS & SUMMARY ---
  // Partial Debt Payment
  const partialPayRes = await request(`/api/debts/${debtId}/pay`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({ amount: 300, notes: 'Partial payment 1' })
  });
  assert.strictEqual(partialPayRes.status, 200, `Partial pay debt failed: ${JSON.stringify(partialPayRes.body)}`);
  assert.strictEqual(partialPayRes.body.debt.remainingBalance, 700);
  assert.strictEqual(partialPayRes.body.debt.status, 'active');
  assert.ok(partialPayRes.body.payment, 'DebtPayment record expected');
  assert.strictEqual(partialPayRes.body.payment.amount, 300);
  assert.strictEqual(partialPayRes.body.payment.debtId, debtId);
  assert.strictEqual(partialPayRes.body.availableBalance, balanceBefore - 300);

  const meAfterPartialRes = await request('/api/user/me', { headers: headersA });
  assert.strictEqual(meAfterPartialRes.status, 200);
  assert.strictEqual(Number(meAfterPartialRes.body.availableBalance), balanceBefore - 300);
  assert.strictEqual(Number(meAfterPartialRes.body.monthlySpent), monthlySpentBefore, 'Debt payment must not increase monthlySpent');

  const expensesAfterPartialRes = await request('/api/expenses', { headers: headersA });
  assert.strictEqual(expensesAfterPartialRes.status, 200);
  const expenseCountAfterPartial = Array.isArray(expensesAfterPartialRes.body) ? expensesAfterPartialRes.body.length : 0;
  assert.strictEqual(expenseCountAfterPartial, expenseCountBefore, 'Debt payment must not create Expense records');

  const dashboardAfterPartialRes = await request('/api/dashboard', { headers: headersA });
  assert.strictEqual(dashboardAfterPartialRes.status, 200);
  assert.strictEqual(dashboardAfterPartialRes.body.totals.totalDebt, 700);
  assert.strictEqual(
    Number(dashboardAfterPartialRes.body.totals.totalNetWorth),
    netWorthBeforePay,
    'Net worth should not change on debt payment (balance and liability both decrease equally)'
  );

  // Overpayment Rejection
  const overPayRes = await request(`/api/debts/${debtId}/pay`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({ amount: 9999 })
  });
  assert.strictEqual(overPayRes.status, 400, `Expected 400 for debt overpayment, got ${overPayRes.status}`);

  // Invalid amount rejection
  const invalidPayRes = await request(`/api/debts/${debtId}/pay`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({ amount: 'not-a-number' })
  });
  assert.strictEqual(invalidPayRes.status, 400, `Expected 400 for invalid debt payment amount, got ${invalidPayRes.status}`);

  // Cross-user Debt Payment Rejection
  const unauthPayRes = await request(`/api/debts/${debtId}/pay`, {
    method: 'POST',
    headers: headersB,
    body: JSON.stringify({ amount: 100 })
  });
  assert.strictEqual(unauthPayRes.status, 403, `Expected 403 for unauthorized debt pay, got ${unauthPayRes.status}`);

  // Full Debt Payment (reaching 0 balance)
  const fullPayRes = await request(`/api/debts/${debtId}/pay`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({ amount: 700, notes: 'Final payoff' })
  });
  assert.strictEqual(fullPayRes.status, 200, `Full pay debt failed: ${JSON.stringify(fullPayRes.body)}`);
  assert.strictEqual(fullPayRes.body.debt.remainingBalance, 0);
  assert.strictEqual(fullPayRes.body.debt.status, 'paid');
  assert.ok(fullPayRes.body.payment);

  // Debt Summary
  const debtSummaryRes = await request('/api/debts/summary', { headers: headersA });
  assert.strictEqual(debtSummaryRes.status, 200, `Debt summary failed: ${JSON.stringify(debtSummaryRes.body)}`);
  assert.strictEqual(debtSummaryRes.body.totalDebtsCount, 1);
  assert.strictEqual(debtSummaryRes.body.paidDebtsCount, 1);
  assert.strictEqual(debtSummaryRes.body.activeDebtsCount, 0);
  assert.strictEqual(debtSummaryRes.body.totalRemainingBalance, 0);

  // Unauthorized Operations on Debt
  const unauthorizedGetDebtRes = await request(`/api/debts/${debtId}`, { headers: headersB });
  assert.strictEqual(unauthorizedGetDebtRes.status, 403);
  const unauthorizedUpdateDebtRes = await request(`/api/debts/${debtId}`, { method: 'PUT', headers: headersB, body: JSON.stringify({ remainingBalance: 1 }) });
  assert.strictEqual(unauthorizedUpdateDebtRes.status, 403);
  const unauthorizedDeleteDebtRes = await request(`/api/debts/${debtId}`, { method: 'DELETE', headers: headersB });
  assert.strictEqual(unauthorizedDeleteDebtRes.status, 403);

  // Clean up Debt
  const deleteDebtRes = await request(`/api/debts/${debtId}`, { method: 'DELETE', headers: headersA });
  assert.strictEqual(deleteDebtRes.status, 200, `Delete debt failed: ${JSON.stringify(deleteDebtRes.body)}`);

  // --- 3. BILL CRUD, PAYMENTS, RECURRENCE & SUMMARY ---
  const initialNextBilling = '2026-09-15T00:00:00.000Z';
  const createBillRes = await request('/api/bills', {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      name: 'Electricity',
      category: 'utilities',
      amount: 100.0,
      billingFrequency: 'monthly',
      nextBillingDate: initialNextBilling,
      paymentMethod: 'card',
      autoPay: true,
      status: 'active',
      notes: 'Test bill',
      account: 'Checking'
    })
  });
  assert.strictEqual(createBillRes.status, 201, `Create bill failed: ${JSON.stringify(createBillRes.body)}`);
  const billId = createBillRes.body.id;

  const createBill2Res = await request('/api/bills', {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      name: 'Water',
      category: 'utilities',
      amount: 45.0,
      billingFrequency: 'monthly',
      nextBillingDate: initialNextBilling,
      autoPay: false,
      status: 'active'
    })
  });
  assert.strictEqual(createBill2Res.status, 201);
  const bill2Id = createBill2Res.body.id;

  // List & Filtering
  const listBillRes = await request('/api/bills?category=utilities', { headers: headersA });
  assert.strictEqual(listBillRes.status, 200, `List bills failed: ${JSON.stringify(listBillRes.body)}`);
  assert.ok(Array.isArray(listBillRes.body));
  assert.strictEqual(listBillRes.body.length, 2);

  const meBeforeBillPayRes = await request('/api/user/me', { headers: headersA });
  const balanceBeforeBillPay = Number(meBeforeBillPayRes.body.availableBalance);
  const monthlySpentBeforeBillPay = Number(meBeforeBillPayRes.body.monthlySpent);

  const expensesBeforeBillPayRes = await request('/api/expenses', { headers: headersA });
  const expenseCountBeforeBillPay = Array.isArray(expensesBeforeBillPayRes.body) ? expensesBeforeBillPayRes.body.length : 0;

  // Bill Payment with explicit amount & Recurrence Test
  const payBillRes = await request(`/api/bills/${billId}/pay`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({ amount: 100.0 })
  });
  assert.strictEqual(payBillRes.status, 200, `Pay bill failed: ${JSON.stringify(payBillRes.body)}`);
  assert.ok(payBillRes.body.bill);
  assert.ok(payBillRes.body.expense);
  assert.strictEqual(payBillRes.body.expense.amount, 100.0);
  assert.strictEqual(payBillRes.body.expense.title, 'Electricity');
  const newBillingDate = new Date(payBillRes.body.bill.nextBillingDate);
  assert.strictEqual(newBillingDate.getMonth(), (new Date(initialNextBilling).getMonth() + 1) % 12);

  const meAfterBillPayRes = await request('/api/user/me', { headers: headersA });
  assert.strictEqual(Number(meAfterBillPayRes.body.availableBalance), balanceBeforeBillPay - 100);
  assert.strictEqual(Number(meAfterBillPayRes.body.monthlySpent), monthlySpentBeforeBillPay + 100);

  const expensesAfterBillPayRes = await request('/api/expenses', { headers: headersA });
  const expenseCountAfterBillPay = Array.isArray(expensesAfterBillPayRes.body) ? expensesAfterBillPayRes.body.length : 0;
  assert.strictEqual(expenseCountAfterBillPay, expenseCountBeforeBillPay + 1);

  // Bill Payment with omitted amount (uses bill.amount)
  const payBill2Res = await request(`/api/bills/${bill2Id}/pay`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({})
  });
  assert.strictEqual(payBill2Res.status, 200, `Pay bill (omitted amount) failed: ${JSON.stringify(payBill2Res.body)}`);
  assert.strictEqual(payBill2Res.body.expense.amount, 45.0);

  // Invalid bill payment amount rejection
  const invalidBillPayRes = await request(`/api/bills/${bill2Id}/pay`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({ amount: -5 })
  });
  assert.strictEqual(invalidBillPayRes.status, 400, `Expected 400 for invalid bill payment amount, got ${invalidBillPayRes.status}`);

  // Cross-user Bill Payment Rejection
  const unauthBillPayRes = await request(`/api/bills/${billId}/pay`, {
    method: 'POST',
    headers: headersB,
    body: JSON.stringify({})
  });
  assert.strictEqual(unauthBillPayRes.status, 403, `Expected 403 for unauthorized bill pay, got ${unauthBillPayRes.status}`);

  // Bill Summary
  const billSummaryRes = await request('/api/bills/summary', { headers: headersA });
  assert.strictEqual(billSummaryRes.status, 200, `Bill summary failed: ${JSON.stringify(billSummaryRes.body)}`);
  assert.strictEqual(billSummaryRes.body.totalBillsCount, 2);
  assert.strictEqual(billSummaryRes.body.autoPayCount, 1);
  assert.ok('totalUpcoming7DaysAmount' in billSummaryRes.body);

  // Clean up Bills
  const deleteBillRes = await request(`/api/bills/${billId}`, { method: 'DELETE', headers: headersA });
  assert.strictEqual(deleteBillRes.status, 200, `Delete bill failed: ${JSON.stringify(deleteBillRes.body)}`);
  const deleteBill2Res = await request(`/api/bills/${bill2Id}`, { method: 'DELETE', headers: headersA });
  assert.strictEqual(deleteBill2Res.status, 200);

  // --- 4. SYSTEM-WIDE INTEGRATION & NET WORTH ---
  const dashboardRes = await request('/api/dashboard', { headers: headersA });
  assert.strictEqual(dashboardRes.status, 200, `Dashboard API failed: ${JSON.stringify(dashboardRes.body)}`);
  assert.ok('totalNetWorth' in dashboardRes.body.totals);
  assert.ok('totalDebt' in dashboardRes.body.totals);
  assert.strictEqual(dashboardRes.body.totals.totalDebt, 0);

  const reportsRes = await request('/api/reports', { headers: headersA });
  assert.strictEqual(reportsRes.status, 200, `Reports API failed: ${JSON.stringify(reportsRes.body)}`);

  console.log('Debt and bill API smoke test passed successfully!');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

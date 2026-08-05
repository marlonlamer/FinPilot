import React, { useMemo, useState } from "react";
import BudgetOverview from "../../features/budgets/components/BudgetOverview";
import TransactionFeed from "../../components/TransactionFeed/TransactionFeed";
import "./ExpensesModule.css";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import ExpenseDistribution from "../../components/ExpenseDistribution/ExpenseDistribution";
import ExpensesHeader from "../../features/expenses/components/ExpensesHeader";
import ExpenseStats from "../../features/expenses/components/ExpenseStats";

export default function Expenses({ expenses = [], form, setForm, handleSubmit, expenseModalOpen, setExpenseModalOpen, monthlyBudget, percentBudgetUsed, budgetRemaining, budgetColor, COLORS, editingExpenseId, cancelExpenseEdit, budgets, budgetsMeta = {}, onBudgetsUpdated = () => {}, selectedYear, selectedMonth, currencySymbol = "₱", formatCurrency }) {
  const lastMonthTotal = useMemo(() => {
    let prevMonth = selectedMonth - 1;
    let prevYear = selectedYear;
    if (prevMonth < 0) { prevMonth = 11; prevYear = selectedYear - 1; }
    return expenses.reduce((s, it) => {
      if (!it.date) return s;
      const d = new Date(it.date);
      if (d.getFullYear() === prevYear && d.getMonth() === prevMonth) return s + (Number(it.amount) || 0);
      return s;
    }, 0);
  }, [expenses, selectedYear, selectedMonth]);

  const monthlyTotal = useMemo(() => expenses.reduce((s, it) => {
    if (!it.date) return s;
    const d = new Date(it.date);
    if (d.getFullYear() === selectedYear && d.getMonth() === selectedMonth) return s + (Number(it.amount) || 0);
    return s;
  }, 0), [expenses, selectedYear, selectedMonth]);

  const monthlyDisplay = formatCurrency ? formatCurrency(monthlyTotal) : `${currencySymbol}${monthlyTotal.toFixed(2)}`;
  const lastMonthDisplay = formatCurrency ? formatCurrency(lastMonthTotal) : `${currencySymbol}${lastMonthTotal.toFixed(2)}`;

  const byCategory = useMemo(() => {
    const map = {};
    expenses.forEach(it => {
      const d = it.date ? new Date(it.date) : null;
      if (!d || d.getFullYear() !== selectedYear || d.getMonth() !== selectedMonth) return;
      const key = it.category || "Uncategorized";
      map[key] = (map[key] || 0) + (Number(it.amount) || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses, selectedYear, selectedMonth]);

  // pieData is now computed inside ExpenseDistribution

  const lastSixMonthsData = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({ key, date: d, label: new Intl.DateTimeFormat("en", { month: "short" }).format(d), value: 0 });
    }
    const map = {};
    expenses.forEach(exp => {
      const d = exp.date ? new Date(exp.date) : null;
      if (!d || isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[key] = (map[key] || 0) + Number(exp.amount || 0);
    });
    return months.map(m => ({ month: m.label, value: Number(map[m.key] || 0) }));
  }, [expenses]);

  const budgetStatus = useMemo(() => {
    if (!budgets) return [];
    return Object.entries(budgets).map(([cat, b]) => {
      const spent = byCategory.find(([c]) => c === cat)?.[1] || 0;
      const pct = b > 0 ? (spent / b) * 100 : null;
      return { category: cat, budget: b, spent, percent: pct };
    }).sort((a, b) => (b.percent || 0) - (a.percent || 0));
  }, [budgets, byCategory]);

  const overBudgetCategories = useMemo(() => {
    if (!budgetStatus) return [];
    return budgetStatus.filter(s => s.budget > 0 && s.spent > s.budget);
  }, [budgetStatus]);

  const recurring = useMemo(() => expenses.filter(e => e.recurring), [expenses]);
  const nonRecurring = useMemo(() => expenses.filter(e => !e.recurring), [expenses]);
  const [externalAddOpen, setExternalAddOpen] = useState(false);

  const handleAddExpense = () => {
    setForm(prev => ({ ...prev, date: new Date().toISOString().slice(0, 10) }));
    setExpenseModalOpen(true);
  };

  const handleAddBudget = () => {
    setExternalAddOpen(true);
    setTimeout(() => {
      const el = document.querySelector('.budget-list') || document.querySelector('.budget-overview');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <div className="expenses-root">
      <ExpensesHeader onAddExpense={handleAddExpense} onAddBudget={handleAddBudget} />

      <div className="analytics-row">
        <div className="card trend-card">
          <div className="card-label">6‑Month Expense Trend</div>
          <div className="chart-small">
            <ResponsiveContainer>
              <LineChart data={lastSixMonthsData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => (formatCurrency ? formatCurrency(v) : (v.toFixed ? `${currencySymbol}${v.toFixed(0)}` : v))} />
                <Tooltip formatter={(value) => (formatCurrency ? formatCurrency(value) : `${currencySymbol}${Number(value).toFixed(2)}`)} />
                <Line type="monotone" dataKey="value" stroke="#FF6B6B" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card category-card">
          <div className="card-label">Expenses by Category</div>
          <div className="chart-small center">
            <ExpenseDistribution
              expenses={expenses}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              currencySymbol={currencySymbol}
              formatCurrency={formatCurrency}
            />
          </div>
        </div>
      </div>

      {overBudgetCategories.length > 0 && (
        <div className="budget-alert">
          <strong>Budget Alert:</strong> You've exceeded budgets for {overBudgetCategories.map(c => c.category).join(", ")}
        </div>
      )}

      <ExpenseStats
        monthlyDisplay={monthlyDisplay}
        lastMonthDisplay={lastMonthDisplay}
      />

      {expenseModalOpen && (
        <div className="modal-overlay" onClick={() => (editingExpenseId ? cancelExpenseEdit() : setExpenseModalOpen(false))}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-headers">
                <div className="modal-title">{editingExpenseId ? "Edit Expense" : "Add Expense"}</div>
                <div className="modal-sub">Track where your money went</div>
              </div>
              <button className="btn btn-ghost" onClick={() => (editingExpenseId ? cancelExpenseEdit() : setExpenseModalOpen(false))}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="form-grid">
              <label className="form-label">Amount</label>
              <div className="input-with-prefix">
                <div className="currency-prefix">{currencySymbol}</div>
                <input className="modern-input" placeholder="0.00" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
              <label className="form-label">Category</label>
               <select className="modern-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                <option value="">Select category</option>
                <option value="Food">🍔 Food</option>
                <option value="Transportation">🚗 Transportation</option>
                <option value="Rent">🏠 Rent</option>
                <option value="Shopping">🛍️ Shopping</option>
                <option value="Bills">💡 Bills</option>
                <option value="Health">🩺 Health</option>
                <option value="Entertainment">🎬 Entertainment</option>
                <option value="Education">🎓 Education</option>
                <option value="Other">➕ Other</option>
              </select>
              <label className="form-label">Description</label>
               <input className="modern-input form-full" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <label className="form-label">Source of Fund</label>
               <input className="modern-input" placeholder="Enter source of fund" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} />
              <label className="form-label">Date</label>
               <input className="modern-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              <select className="modern-input" value={form.paymentMethod || ""} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
                <option value="">Select payment method</option>
                <option value="Cash">💵 Cash</option>
                <option value="Credit Card">💳 Credit Card</option>
                <option value="Debit Card">🏧 Debit Card</option>
                <option value="Bank Transfer">🏦 Bank Transfer</option>
                <option value="Mobile Wallet">📱 Mobile Wallet</option>
              </select>
              <label className="form-label">Payment method</label>
              <div className="recurring-row">
                <label className="recurring-toggle">
                  <input type="checkbox" checked={!!form.recurring} onChange={e => setForm({ ...form, recurring: e.target.checked })} />
                  <span>Recurring</span>
                </label>
                {form.recurring && (
                  <>
                    <label className="form-label">Recurrence</label>
                    <select className="modern-input small-select" value={form.recurrence || "monthly"} onChange={e => setForm({ ...form, recurrence: e.target.value })}>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </>
                )}
              </div>
              <label className="form-label">Notes(Optional)</label>
              <input className="modern-input form-full" placeholder="Enter a helpful message" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              <div className="modal-footer form-full">
                <button type="button" className="btn" onClick={() => (editingExpenseId ? cancelExpenseEdit() : setExpenseModalOpen(false))}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingExpenseId ? "Save Changes" : "Add Expense"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <h3 className="section-title">Budget Status</h3>
      <BudgetOverview
        monthlyBudget={monthlyBudget}
        percentBudgetUsed={percentBudgetUsed}
        budgetRemaining={budgetRemaining}
        budgetColor={budgetColor}
        overBudgetCategories={overBudgetCategories}
        COLORS={COLORS}
        currencySymbol={currencySymbol}
        formatCurrency={formatCurrency}
        budgets={budgets}
        budgetsMeta={budgetsMeta}
        onBudgetsUpdated={onBudgetsUpdated}
        externalAddOpen={externalAddOpen}
        showAddButton={false}
        onExternalAddHandled={() => setExternalAddOpen(false)}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
      />

      <h3 className="section-title">Recurring Expenses</h3>
      {recurring.length > 0 ? (
        <TransactionFeed transactions={recurring.map(e => ({ ...e, type: 'expense' }))} currencySymbol={currencySymbol} formatCurrency={formatCurrency} />
      ) : (
        <div className="muted">No recurring expenses set.</div>
      )}

      <h3 className="section-title">Recent Expenses</h3>
      <TransactionFeed transactions={nonRecurring.map(e => ({ ...e, type: 'expense' }))} currencySymbol={currencySymbol} formatCurrency={formatCurrency} />
    </div>
  );
}

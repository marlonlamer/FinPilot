import React, { useMemo } from "react";
import TransactionFeed from "../../../components/TransactionFeed/TransactionFeed";
import "./ExpensesModule.css";
import ExpensesHeader from "../components/ExpensesHeader";
import ExpenseStats from "../components/ExpenseStats";
import ExpensesAnalytics from "../components/ExpensesAnalytics";
import { EXPENSE_CATEGORIES } from "../../../constants/expenseCategories";

export default function ExpensesPage({ expenses = [], expenseHistory, form, setForm, handleSubmit, expenseModalOpen, setExpenseModalOpen, editingExpenseId, cancelExpenseEdit, selectedYear, selectedMonth, currencySymbol = "₱", formatCurrency }) {
  const previousPeriod = useMemo(() => {
    let month = selectedMonth - 1;
    let year = selectedYear;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
    return { month, year };
  }, [selectedYear, selectedMonth]);

  const lastMonthTotal = useMemo(() => {
    return expenses.reduce((s, it) => {
      if (!it.date) return s;
      const d = new Date(it.date);
      if (Number.isNaN(d.getTime())) return s;
      if (d.getFullYear() === previousPeriod.year && d.getMonth() === previousPeriod.month) return s + (Number(it.amount) || 0);
      return s;
    }, 0);
  }, [expenses, previousPeriod]);

  const monthlyTotal = useMemo(() => expenses.reduce((s, it) => {
    if (!it.date) return s;
    const d = new Date(it.date);
    if (Number.isNaN(d.getTime())) return s;
    if (d.getFullYear() === selectedYear && d.getMonth() === selectedMonth) return s + (Number(it.amount) || 0);
    return s;
  }, 0), [expenses, selectedYear, selectedMonth]);

  const monthlyExpenseCount = useMemo(() => expenses.reduce((count, it) => {
    if (!it.date) return count;
    const d = new Date(it.date);
    if (Number.isNaN(d.getTime())) return count;
    return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth ? count + 1 : count;
  }, 0), [expenses, selectedYear, selectedMonth]);

  const averageExpense = monthlyExpenseCount > 0 ? monthlyTotal / monthlyExpenseCount : 0;
  const monthlyDisplay = formatCurrency ? formatCurrency(monthlyTotal) : `${currencySymbol}${monthlyTotal.toFixed(2)}`;
  const averageExpenseDisplay = formatCurrency ? formatCurrency(averageExpense) : `${currencySymbol}${averageExpense.toFixed(2)}`;
  const comparison = useMemo(() => {
    if (lastMonthTotal <= 0) return { text: "No previous-month data", direction: null };
    const change = ((monthlyTotal - lastMonthTotal) / lastMonthTotal) * 100;
    if (!Number.isFinite(change)) return { text: "No previous-month data", direction: null };
    if (change === 0) return { text: "No change vs previous month", direction: null };
    const direction = change < 0 ? "down" : "up";
    const arrow = change < 0 ? "↓" : "↑";
    return {
      text: `${arrow} ${Math.abs(change).toFixed(1)}% vs previous month`,
      direction
    };
  }, [monthlyTotal, lastMonthTotal]);

  const handleAddExpense = () => {
    setForm(prev => ({ ...prev, date: new Date().toISOString().slice(0, 10) }));
    setExpenseModalOpen(true);
  };

  return (
    <div className="expenses-root">
      <ExpensesHeader onAddExpense={handleAddExpense} />

      <ExpenseStats
        monthlyDisplay={monthlyDisplay}
        averageExpenseDisplay={averageExpenseDisplay}
        comparisonText={comparison.text}
        comparisonDirection={comparison.direction}
      />

      <main className="expenses-content">
        <ExpensesAnalytics
          expenses={expenses}
          trendExpenses={expenseHistory}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          formatCurrency={formatCurrency}
          currencySymbol={currencySymbol}
        />
        <h3 className="section-title">Recent Expenses</h3>
        <TransactionFeed transactions={expenses.map(e => ({ ...e, type: 'expense' }))} currencySymbol={currencySymbol} formatCurrency={formatCurrency} />
      </main>

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
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                ))}
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
    </div>
  );
}

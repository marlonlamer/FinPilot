import React, { useCallback, useMemo, useState } from "react";
import TransactionFeed from "../../../components/TransactionFeed/TransactionFeed";
import "./ExpensesModule.css";
import ExpensesHeader from "../components/ExpensesHeader";
import ExpenseStats from "../components/ExpenseStats";
import ExpensesAnalytics from "../components/ExpensesAnalytics";
import { EXPENSE_CATEGORIES } from "../../../constants/expenseCategories";

const normalizeFilterValue = (value) => String(value ?? "").trim().toLowerCase();

const getExpenseDate = (expense) => {
  const rawDate = expense?.date || expense?.createdAt || expense?.created_at || expense?.timestamp;
  if (!rawDate) return null;
  if (typeof rawDate === "string") {
    const match = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
    if (match) {
      const [, year, month, day] = match;
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }
  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getLocalMonthValue = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
const getExpenseAmount = (expense) => {
  const amount = Number(expense?.amount);
  return Number.isFinite(amount) ? Math.abs(amount) : 0;
};

export default function ExpensesPage({ expenses = [], expenseHistory, form, setForm, handleSubmit, expenseModalOpen, setExpenseModalOpen, editingExpenseId, cancelExpenseEdit, currencySymbol = "₱", formatCurrency }) {
  const [now] = useState(() => new Date());
  const [timeframe, setTimeframe] = useState("month");
  const [selectedMonthValue, setSelectedMonthValue] = useState(() => getLocalMonthValue(now));
  const [selectedYearValue, setSelectedYearValue] = useState(() => String(now.getFullYear()));
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [minimumAmount, setMinimumAmount] = useState("");
  const [maximumAmount, setMaximumAmount] = useState("");

  const sourceExpenses = Array.isArray(expenseHistory) ? expenseHistory : expenses;
  const categories = useMemo(() => {
    const values = new Map(EXPENSE_CATEGORIES.map(({ value, label }) => [normalizeFilterValue(value), label]));
    sourceExpenses.forEach((expense) => {
      const category = String(expense?.category ?? "").trim();
      if (category && !values.has(normalizeFilterValue(category))) values.set(normalizeFilterValue(category), category);
    });
    return [...values.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [sourceExpenses]);

  const accounts = useMemo(() => {
    const values = sourceExpenses
      .map(expense => expense.paymentSource || expense.paymentSourceAccount || expense.account || expense.source)
      .filter(Boolean)
      .map(value => String(value).trim());
    return [...new Set(values)].sort((a, b) => a.localeCompare(b));
  }, [sourceExpenses]);

  const years = useMemo(() => {
    const values = sourceExpenses
      .map(getExpenseDate)
      .filter(Boolean)
      .map(date => date.getFullYear());
    values.push(now.getFullYear(), Number(selectedYearValue));
    return [...new Set(values)].sort((a, b) => b - a);
  }, [sourceExpenses, selectedYearValue, now]);

  const matchesNonTimeFilters = useCallback((expense) => {
    if (!Number.isFinite(Number(expense?.amount))) return false;
    const category = normalizeFilterValue(expense.category || "Uncategorized");
    const account = normalizeFilterValue(expense.paymentSource || expense.paymentSourceAccount || expense.account || expense.source);
    const amount = getExpenseAmount(expense);
    return (selectedCategory === "all" || category === selectedCategory) &&
      (selectedAccount === "all" || account === selectedAccount) &&
      (minimumAmount === "" || amount >= Number(minimumAmount)) &&
      (maximumAmount === "" || amount <= Number(maximumAmount));
  }, [selectedCategory, selectedAccount, minimumAmount, maximumAmount]);

  const filteredExpenses = useMemo(() => sourceExpenses.filter((expense) => {
    if (!matchesNonTimeFilters(expense)) return false;
    if (timeframe === "all") return true;
    const date = getExpenseDate(expense);
    if (!date) return false;
    if (timeframe === "month") return getLocalMonthValue(date) === selectedMonthValue;
    return date.getFullYear() === Number(selectedYearValue);
  }), [sourceExpenses, timeframe, selectedMonthValue, selectedYearValue, matchesNonTimeFilters]);

  const filteredTotal = useMemo(() => filteredExpenses.reduce((total, expense) => total + getExpenseAmount(expense), 0), [filteredExpenses]);
  const averageExpense = filteredExpenses.length > 0 ? filteredTotal / filteredExpenses.length : 0;
  const monthlyDisplay = formatCurrency ? formatCurrency(filteredTotal) : `${currencySymbol}${filteredTotal.toFixed(2)}`;
  const averageExpenseDisplay = formatCurrency ? formatCurrency(averageExpense) : `${currencySymbol}${averageExpense.toFixed(2)}`;
  const primaryLabel = timeframe === "all"
    ? "All Time"
    : timeframe === "year"
      ? `${selectedYearValue} Total`
      : new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(`${selectedMonthValue}-01T00:00:00`));
  const supportText = timeframe === "month" && filteredExpenses.length > 0
    ? `${filteredExpenses.length} transaction${filteredExpenses.length === 1 ? "" : "s"}`
    : timeframe === "all"
      ? "Across all available records"
      : "In selected period";

  const resetFilters = () => {
    setTimeframe("month");
    setSelectedMonthValue(getLocalMonthValue(now));
    setSelectedYearValue(String(now.getFullYear()));
    setSelectedCategory("all");
    setSelectedAccount("all");
    setMinimumAmount("");
    setMaximumAmount("");
  };

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
        primaryLabel={primaryLabel}
        comparisonText={supportText}
      />

      <div className="expenses-dashboard-layout">
        <ExpensesAnalytics
          expenses={filteredExpenses}
          trendExpenses={expenseHistory}
          formatCurrency={formatCurrency}
          currencySymbol={currencySymbol}
        />

        <aside className="expenses-filter-card">
          <div className="expenses-filter-header"><h3>Filters</h3></div>
          <div className="expenses-filter-stack">
            <label className="expenses-filter-field">
              <span>Timeframe</span>
              <select className="expenses-filter-select" value={timeframe} onChange={(event) => setTimeframe(event.target.value)}>
                <option value="all">All Time</option>
                <option value="month">By Month</option>
                <option value="year">By Year</option>
              </select>
            </label>

            {timeframe === "month" && (
              <label className="expenses-filter-field">
                <span>Month</span>
                <input className="expenses-filter-input" type="month" value={selectedMonthValue} onChange={(event) => setSelectedMonthValue(event.target.value)} />
              </label>
            )}

            {timeframe === "year" && (
              <label className="expenses-filter-field">
                <span>Year</span>
                <select className="expenses-filter-select" value={selectedYearValue} onChange={(event) => setSelectedYearValue(event.target.value)}>
                  {years.map(year => <option key={year} value={String(year)}>{year}</option>)}
                </select>
              </label>
            )}

            <label className="expenses-filter-field">
              <span>Category</span>
              <select className="expenses-filter-select" value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
                <option value="all">All Categories</option>
                {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>

            <label className="expenses-filter-field">
              <span>Account / Payment Source</span>
              <select className="expenses-filter-select" value={selectedAccount} onChange={(event) => setSelectedAccount(event.target.value)}>
                <option value="all">All Accounts</option>
                {accounts.map(account => <option key={account} value={normalizeFilterValue(account)}>{account}</option>)}
              </select>
            </label>

            <div className="expenses-filter-range">
              <label className="expenses-filter-field">
                <span>Minimum Amount</span>
                <input className="expenses-filter-input" type="number" min="0" value={minimumAmount} onChange={(event) => setMinimumAmount(event.target.value)} placeholder="₱0" />
              </label>
              <label className="expenses-filter-field">
                <span>Maximum Amount</span>
                <input className="expenses-filter-input" type="number" min="0" value={maximumAmount} onChange={(event) => setMaximumAmount(event.target.value)} placeholder="No limit" />
              </label>
            </div>

            {(timeframe !== "month" || selectedMonthValue !== getLocalMonthValue(now) || selectedCategory !== "all" || selectedAccount !== "all" || minimumAmount !== "" || maximumAmount !== "") && (
              <button type="button" className="expenses-filter-reset" onClick={resetFilters}>Clear filters</button>
            )}
          </div>
        </aside>

        <main className="expenses-transactions">
          <h3 className="section-title">Expense Transactions</h3>
          <TransactionFeed transactions={filteredExpenses.map(e => ({ ...e, type: 'expense' }))} currencySymbol={currencySymbol} formatCurrency={formatCurrency} />
        </main>
      </div>

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

import React, { useCallback, useMemo, useState } from "react";
import TransactionFeed from "../../../components/TransactionFeed/TransactionFeed";
import "./ExpensesModule.css";
import ExpensesHeader from "../components/ExpensesHeader";
import ExpenseStats from "../components/ExpenseStats";
import ExpensesAnalytics from "../components/ExpensesAnalytics";
import { EXPENSE_CATEGORIES } from "../../../constants/expenseCategories";
import AddTransactionModal from "../../transactions/components/AddTransactionModal";
import ViewTransactionModal from "../../transactions/components/ViewTransactionModal";
import ConfirmModal from "../../../components/ConfirmModal/ConfirmModal";
import {
  getExpenseDate,
  getExpenseMonthComparison,
  getLocalMonthValue
} from "../utils/expenseMonthComparison";
import {
  getExpenseDateRange,
  getIsoWeekValue,
  getLocalDateValue,
  isDateWithinRange
} from "../utils/expenseDateFilters";
import { matchesExpenseMerchant } from "../utils/expenseMerchantFilter";

const normalizeFilterValue = (value) => String(value ?? "").trim().toLowerCase();

const getExpenseAmount = (expense) => {
  const amount = Number(expense?.amount);
  return Number.isFinite(amount) ? Math.abs(amount) : 0;
};

export default function ExpensesPage({ expenses = [], expenseHistory, form, expenseModalOpen, setExpenseModalOpen, editingExpenseId, cancelExpenseEdit, openEditExpense, deleteExpense, onCreateExpense, onUpdateExpense, currencySymbol = "₱", formatCurrency }) {
  const [now] = useState(() => new Date());
  const [timeframe, setTimeframe] = useState("month");
  const [selectedDayValue, setSelectedDayValue] = useState(() => getLocalDateValue(now));
  const [selectedWeekValue, setSelectedWeekValue] = useState(() => getIsoWeekValue(now));
  const [selectedMonthValue, setSelectedMonthValue] = useState(() => getLocalMonthValue(now));
  const [selectedYearValue, setSelectedYearValue] = useState(() => String(now.getFullYear()));
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [merchantSearch, setMerchantSearch] = useState("");
  const [viewedExpense, setViewedExpense] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

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

  const selectedDateRange = useMemo(() => getExpenseDateRange({
    timeframe,
    dayValue: selectedDayValue,
    weekValue: selectedWeekValue,
    monthValue: selectedMonthValue,
    yearValue: selectedYearValue
  }), [timeframe, selectedDayValue, selectedWeekValue, selectedMonthValue, selectedYearValue]);

  const matchesNonTimeFilters = useCallback((expense) => {
    if (!Number.isFinite(Number(expense?.amount))) return false;
    const category = normalizeFilterValue(expense.category || "Uncategorized");
    const account = normalizeFilterValue(expense.paymentSource || expense.paymentSourceAccount || expense.account || expense.source);
    return (selectedCategory === "all" || category === selectedCategory) &&
      (selectedAccount === "all" || account === selectedAccount) &&
      matchesExpenseMerchant(expense, merchantSearch);
  }, [selectedCategory, selectedAccount, merchantSearch]);

  const filteredExpenses = useMemo(() => sourceExpenses.filter((expense) => {
    if (!matchesNonTimeFilters(expense)) return false;
    if (timeframe === "all") return true;
    const date = getExpenseDate(expense);
    return isDateWithinRange(date, selectedDateRange);
  }), [sourceExpenses, timeframe, selectedDateRange, matchesNonTimeFilters]);

  const filteredTotal = useMemo(() => filteredExpenses.reduce((total, expense) => total + getExpenseAmount(expense), 0), [filteredExpenses]);
  const averageExpense = filteredExpenses.length > 0 ? filteredTotal / filteredExpenses.length : 0;
  const monthlyDisplay = formatCurrency ? formatCurrency(filteredTotal) : `${currencySymbol}${filteredTotal.toFixed(2)}`;
  const averageExpenseDisplay = formatCurrency ? formatCurrency(averageExpense) : `${currencySymbol}${averageExpense.toFixed(2)}`;
  const comparisonSummary = useMemo(() => {
    return getExpenseMonthComparison(sourceExpenses, selectedMonthValue, matchesNonTimeFilters);
  }, [sourceExpenses, selectedMonthValue, matchesNonTimeFilters]);
  const editingTransaction = useMemo(() => editingExpenseId ? ({
    ...form,
    id: editingExpenseId,
    type: "expense",
    isRecurring: Boolean(form?.recurring),
    recurrenceFrequency: form?.recurrence || form?.recurrenceFrequency,
    date: form?.date
  }) : null, [editingExpenseId, form]);

  const resetFilters = () => {
    setTimeframe("month");
    setSelectedDayValue(getLocalDateValue(now));
    setSelectedWeekValue(getIsoWeekValue(now));
    setSelectedMonthValue(getLocalMonthValue(now));
    setSelectedYearValue(String(now.getFullYear()));
    setSelectedCategory("all");
    setSelectedAccount("all");
    setMerchantSearch("");
  };

  const handleAddExpense = () => {
    if (editingExpenseId) cancelExpenseEdit();
    setExpenseModalOpen(true);
  };

  const closeExpenseModal = () => {
    if (editingExpenseId) {
      cancelExpenseEdit();
      return;
    }
    setExpenseModalOpen(false);
  };

  const handleViewExpense = (expense) => {
    setViewedExpense({
      ...expense,
      type: "expense",
      merchant: expense.merchant || expense.merchantRecipient || expense.recipient || expense.description || "",
      paymentSource: expense.paymentSource || expense.paymentSourceAccount || expense.account || expense.source || "",
      isRecurring: expense.isRecurring ?? expense.recurring,
      recurrenceFrequency: expense.recurrenceFrequency || expense.recurringFrequency || expense.recurrence,
      recurrenceEndDate: expense.recurrenceEndDate || expense.recurringEndDate
    });
  };

  const confirmDeleteExpense = async () => {
    if (!pendingDelete) return;
    if (typeof deleteExpense !== "function") throw new Error("Expense deletion is unavailable.");
    await deleteExpense(pendingDelete.id);
    setPendingDelete(null);
  };

  return (
    <div className="expenses-root">
      <ExpensesHeader onAddExpense={handleAddExpense} />

      <div className="expenses-dashboard-layout">
        <ExpenseStats
          monthlyDisplay={monthlyDisplay}
          averageExpenseDisplay={averageExpenseDisplay}
          comparisonText={comparisonSummary.text}
          comparisonDirection={comparisonSummary.direction}
        />

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
                <option value="day">By Day</option>
                <option value="week">By Week</option>
                <option value="month">By Month</option>
                <option value="year">By Year</option>
              </select>
            </label>

            {timeframe === "day" && (
              <label className="expenses-filter-field">
                <span>Date</span>
                <input
                  className="expenses-filter-input"
                  type="date"
                  value={selectedDayValue}
                  onChange={(event) => setSelectedDayValue(event.target.value)}
                />
              </label>
            )}

            {timeframe === "week" && (
              <label className="expenses-filter-field">
                <span>Week</span>
                <input
                  className="expenses-filter-input"
                  type="week"
                  value={selectedWeekValue}
                  onChange={(event) => setSelectedWeekValue(event.target.value)}
                />
              </label>
            )}

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

            <label className="expenses-filter-field">
              <span>Merchant / Recipient</span>
              <input
                className="expenses-filter-input"
                type="search"
                value={merchantSearch}
                onChange={(event) => setMerchantSearch(event.target.value)}
                placeholder="Search merchant or recipient"
              />
            </label>

            {(timeframe !== "month" || selectedMonthValue !== getLocalMonthValue(now) || selectedYearValue !== String(now.getFullYear()) || selectedCategory !== "all" || selectedAccount !== "all" || merchantSearch.trim() !== "") && (
              <button type="button" className="expenses-filter-reset" onClick={resetFilters}>Clear filters</button>
            )}
          </div>
        </aside>

        <section className="expenses-transactions">
          <div className="expenses-transactions-header">
            <h3>Recent Outflow Transactions</h3>
            <span>{filteredExpenses.length} {filteredExpenses.length === 1 ? "item" : "items"}</span>
          </div>
          <TransactionFeed
            transactions={filteredExpenses.map(e => ({ ...e, type: 'expense' }))}
            currencySymbol={currencySymbol}
            formatCurrency={formatCurrency}
            openEditExpense={openEditExpense}
            onViewTransaction={handleViewExpense}
            onDeleteTransaction={setPendingDelete}
          />
        </section>
      </div>

      <AddTransactionModal
        open={expenseModalOpen}
        onClose={closeExpenseModal}
        onCreateExpense={onCreateExpense}
        onUpdateExpense={onUpdateExpense}
        editingTransaction={editingTransaction}
        defaultType="expense"
        mode="expense"
        showPaymentMethod
        currencySymbol={currencySymbol}
      />

      <ViewTransactionModal
        open={Boolean(viewedExpense)}
        transaction={viewedExpense}
        onClose={() => setViewedExpense(null)}
        currencySymbol={currencySymbol}
        formatCurrency={formatCurrency}
      />

      <ConfirmModal
        open={Boolean(pendingDelete)}
        message={`Are you sure you want to delete "${pendingDelete?.description || pendingDelete?.merchant || pendingDelete?.category || "this expense"}"? This action cannot be undone.`}
        onConfirm={confirmDeleteExpense}
        onCancel={() => setPendingDelete(null)}
        confirmLabel="Delete"
      />
    </div>
  );
}

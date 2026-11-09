import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from "recharts";
import React, { useEffect, useMemo, useState } from "react";
import ExpenseDistribution from "../../../components/ExpenseDistribution/ExpenseDistribution";
import AddTransactionModal from "../../transactions/components/AddTransactionModal";
import DashboardHeader from "../components/DashboardHeader";
import DashboardSummaryCards from "../components/DashboardSummaryCards";
import { getCurrentUser } from "../../../services/api";
import "./DashboardModule.css";

export default function Dashboard(props) {
  const {
    computedTotalSavings, 
    monthlyIncomeTotal,
    monthlyExpenseTotal,
    combinedLineData,
    overBudgetCategories,
    COLORS,
    currencySymbol = "₱",
    formatCurrency,
    totalMonthlyBudget = 0,
    totalBudgetSpent = 0,
    totalBudgetRemaining = 0,
    incomes = [],
    expenses = [],
    onCreateExpense,
    onCreateIncome
  } = props;
  const { availableBalance, selectedYear, selectedMonth } = props;

  const user = getCurrentUser() || {};
  const displayName = user.name || user.email || "";

  const [now, setNow] = useState(new Date());
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const greeting = useMemo(() => {
    const hr = now.getHours();
    if (hr >= 5 && hr < 12) return 'Good Morning';
    if (hr >= 12 && hr < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, [now]);

  const formattedDate = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(now);
    } catch {
      // fallback
      const d = now;
      return d.toLocaleDateString();
    }
  }, [now]);

  const toNumber = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const fmt = (v, digits = 2) => {
    const n = toNumber(v);
    return formatCurrency ? formatCurrency(n) : `${currencySymbol}${n.toFixed(digits)}`;
  };

  const availableBalanceDisplay = fmt(availableBalance, 2);
  const totalSavingsDisplay = fmt(computedTotalSavings, 2);
  const monthlyIncomeDisplay = fmt(monthlyIncomeTotal, 2);
  const monthlyExpensesDisplay = fmt(monthlyExpenseTotal, 2);
  const totalNetWorthDisplay = formatCurrency
    ? formatCurrency(Number(computedTotalSavings || 0) + Number(availableBalance || 0))
    : `${currencySymbol}${(Number(computedTotalSavings || 0) + Number(availableBalance || 0)).toFixed(2)}`;

  const cld = Array.isArray(combinedLineData) ? combinedLineData : [];
  const obc = Array.isArray(overBudgetCategories) ? overBudgetCategories : [];
  const selectedPeriodLabel = new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric"
  }).format(new Date(Number(selectedYear), Number(selectedMonth), 1));
  const recentActivity = useMemo(() => [
    ...(Array.isArray(incomes) ? incomes : []).map((record) => ({ ...record, type: "income" })),
    ...(Array.isArray(expenses) ? expenses : []).map((record) => ({ ...record, type: "expense" }))
  ].map((record) => {
    const date = new Date(record.date || record.createdAt || record.created_at || "");
    return {
      ...record,
      validDate: !Number.isNaN(date.getTime()),
      timestamp: date.getTime(),
      title: record.description || record.merchant || record.payer || record.category || (record.type === "income" ? "Income" : "Expense"),
      amount: Math.abs(toNumber(record.amount))
    };
  }).sort((a, b) => {
    const aTime = a.validDate ? a.timestamp : Number.NEGATIVE_INFINITY;
    const bTime = b.validDate ? b.timestamp : Number.NEGATIVE_INFINITY;
    return bTime - aTime;
  }).slice(0, 6), [incomes, expenses]);
  const budgetAmount = toNumber(totalMonthlyBudget);
  const budgetSpent = toNumber(totalBudgetSpent);
  const budgetRemaining = toNumber(totalBudgetRemaining);
  const budgetUsedPercent = budgetAmount > 0
    ? Math.min(Math.max((budgetSpent / budgetAmount) * 100, 0), 100)
    : 0;
  const money = (value) => formatCurrency ? formatCurrency(value) : `${currencySymbol}${value.toFixed(2)}`;


  return (
    <div className="dashboard-root">
      <DashboardHeader
        displayName={displayName || "there"}
        greeting={greeting}
        formattedDate={formattedDate}
        selectedPeriodLabel={selectedPeriodLabel}
        onQuickAdd={() => setQuickAddOpen(true)}
      />
  
      <DashboardSummaryCards
        availableBalanceDisplay={availableBalanceDisplay}
        totalSavingsDisplay={totalSavingsDisplay}
        monthlyIncomeDisplay={monthlyIncomeDisplay}
        monthlyExpensesDisplay={monthlyExpensesDisplay}
        totalNetWorthDisplay={totalNetWorthDisplay}
      />

      <section className="dashboard-content-grid" aria-label="Financial activity and insights">
        <article className="dashboard-panel dashboard-panel--chart">
          <div className="dashboard-panel-header">
            <div>
              <h2>Expenses vs Income</h2>
              <p>Monthly cash flow over time</p>
            </div>
          </div>
          {cld.length > 0 ? (
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cld} margin={{ top: 8, right: 12, left: 2, bottom: 0 }}>
                  <CartesianGrid stroke="#e8edf3" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 11 }} minTickGap={20} />
                  <YAxis width={72} tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(value) => formatCurrency ? formatCurrency(toNumber(value)) : `${currencySymbol}${toNumber(value).toLocaleString()}`} />
                  <Tooltip formatter={(value) => money(toNumber(value))} contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", boxShadow: "0 8px 24px rgba(15, 23, 42, .08)" }} />
                  <Legend />
                  <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#e35d6a" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="incomes" name="Income" stroke="#16a36a" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="dashboard-empty">No monthly data available.</p>
          )}
        </article>

        <article className="dashboard-panel dashboard-panel--category">
          <div className="dashboard-panel-header">
            <div>
              <h2>Spending by Category</h2>
              <p>{selectedPeriodLabel}</p>
            </div>
          </div>
          <ExpenseDistribution
            expenses={expenses}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            currencySymbol={currencySymbol}
            formatCurrency={formatCurrency}
            colors={COLORS}
            layout="stacked"
          />
        </article>

        <article className="dashboard-panel dashboard-panel--activity">
          <div className="dashboard-panel-header">
            <div>
              <h2>Recent Financial Activity</h2>
              <p>Your latest recorded transactions</p>
            </div>
          </div>
          {recentActivity.length ? (
            <ul className="dashboard-activity-list">
              {recentActivity.map((item, index) => (
                <li className="dashboard-activity-item" key={`${item.type}-${item.id || item.timestamp}-${index}`}>
                  <span className={`dashboard-activity-marker dashboard-activity-marker--${item.type}`} aria-hidden="true">
                    {item.type === "income" ? "+" : "−"}
                  </span>
                  <span className="dashboard-activity-copy">
                    <strong>{item.title}</strong>
                    <small>{item.validDate ? item.date && String(item.date).length === 10
                      ? new Date(`${item.date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                      : new Date(item.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                      : "Date unavailable"}{item.category ? ` · ${item.category}` : ""}</small>
                  </span>
                  <strong className={`dashboard-activity-amount dashboard-activity-amount--${item.type}`}>
                    {item.type === "income" ? "+" : "−"}{money(item.amount)}
                  </strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="dashboard-empty">No recent transactions to show.</p>
          )}
        </article>

        <article className="dashboard-panel dashboard-panel--budget">
          <div className="dashboard-panel-header">
            <div>
              <h2>Monthly Budget</h2>
              <p>{selectedPeriodLabel}</p>
            </div>
          </div>
          {budgetAmount > 0 ? (
            <>
              <div className="dashboard-budget-totals">
                <span>Spent <strong>{money(budgetSpent)}</strong></span>
                <span>Remaining <strong>{money(budgetRemaining)}</strong></span>
              </div>
              <div
                className="dashboard-budget-track"
                role="progressbar"
                aria-label="Monthly budget used"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(budgetUsedPercent)}
              >
                <span style={{ width: `${budgetUsedPercent}%` }} />
              </div>
              <p className="dashboard-budget-caption">
                {money(budgetSpent)} of {money(budgetAmount)} used
              </p>
              {obc.length > 0 ? (
                <div className="budget-alert">
                  <strong>Over budget:</strong> {obc.map((category) => category.category).join(", ")}
                </div>
              ) : null}
            </>
          ) : (
            <p className="dashboard-empty">No monthly budget has been set.</p>
          )}
        </article>
      </section>

      <AddTransactionModal
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onCreateExpense={onCreateExpense}
        onCreateIncome={onCreateIncome}
        mode="both"
        currencySymbol={currencySymbol}
      />
    </div>
  );
}

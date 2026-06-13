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
import ExpenseDistribution from "../../components/ExpenseDistribution/ExpenseDistribution";
import BudgetOverview from "../../components/BudgetOverview/BudgetOverview";
import { getCurrentUser } from "../../services/api";
import "./DashboardModule.css";
import React, { useEffect, useMemo, useState } from "react";

export default function Dashboard(props) {
  const {
    computedTotalSavings,
    monthlyIncomeTotal,
    monthlyExpenseTotal,
    monthlyBudget,
    combinedLineData,
    pieData,
    overBudgetCategories,
    percentBudgetUsed,
    budgetColor,
    budgetRemaining,
    COLORS,
    currencySymbol = "₱",
    formatCurrency,
    totalMonthlyBudget = 0,
    totalBudgetSpent = 0,
    totalBudgetRemaining = 0,
  } = props;
  const { availableBalance, selectedYear, selectedMonth } = props;
  const { budgets, onBudgetsUpdated, budgetsMeta } = props;

  const user = getCurrentUser() || {};
  const displayName = user.name || user.email || "";

  const [now, setNow] = useState(new Date());

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
    } catch (e) {
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

  const cld = Array.isArray(combinedLineData) ? combinedLineData : [];
  // pieData handled by ExpenseDistribution via expenses prop
  const obc = Array.isArray(overBudgetCategories) ? overBudgetCategories : [];


  return (
    <div className="dashboard-root">
      {displayName && (
        <div className="dashboard-header">
          <div className="dashboard-greeting">
            <h1>{greeting}, {displayName} <span className="wave">👋</span></h1>
            <div className="dashboard-date">{formattedDate}</div>
          </div>
          <div className="dashboard-subtext">Track your finances and stay on top of your goals.</div>
        </div>
      )}
  
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-label">Available Balance</div>
          <div className="stat-value">{fmt(availableBalance, 2)}</div>
          <div className="stat-sub" />
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Savings</div>
          <div className="stat-value">{fmt(computedTotalSavings, 2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Monthly Income</div>
          <div className="stat-value">{fmt(monthlyIncomeTotal, 2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Monthly Expenses</div>
          <div className="stat-value">{fmt(monthlyExpenseTotal, 2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Net Worth</div>
          <div className="stat-value">{formatCurrency
              ? formatCurrency(Number(computedTotalSavings || 0) + Number(availableBalance || 0))
              : `${currencySymbol}${(Number(computedTotalSavings || 0) + Number(availableBalance || 0)).toFixed(2)}`}</div>
        </div>
      </div>

      {/* Budget Overview (left) and Budgets by Category (right) */}
      <div className="budget-section" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
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
            readOnly={true}
            showAddButton={false}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            showSummary={true}
            showCategoryList={false}
          />
        </div>
        <div style={{ width: 420 }}>
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
            readOnly={true}
            showAddButton={false}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            showSummary={false}
            showCategoryList={true}
          />
        </div>
      </div>

      <div className="chart-section">
        <h2>Expenses vs Income Per Month</h2>
        {cld.length > 0 ? (
          <div className="chart-wrapper">
            <ResponsiveContainer>
              <LineChart data={cld} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => (formatCurrency ? formatCurrency(toNumber(v)) : `${currencySymbol}${toNumber(v).toFixed(0)}`)} />
                  <Tooltip formatter={(value) => (formatCurrency ? formatCurrency(toNumber(value)) : `${currencySymbol}${toNumber(value).toFixed(2)}`)} />
                <Legend />
                <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#FF6B6B" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="incomes" name="Incomes" stroke="#00C49F" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p>No monthly data available.</p>
        )}
      </div>

      <h2 className="by-category">By Category</h2>
      {obc.length > 0 && (
        <div className="budget-alert">
          <strong>Budget Alert:</strong> You have exceeded the budget for {obc.map(c => c.category).join(", ")}.
        </div>
      )}

      <div className="pie-wrapper">
        <ExpenseDistribution
          expenses={props.expenses || []}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          currencySymbol={currencySymbol}
          formatCurrency={formatCurrency}
          colors={COLORS}
        />
      </div>
    </div>
  );
}

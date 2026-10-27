import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import "./AnalyticsModule.css";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CATEGORY_COLORS = ["#0ea5a4", "#2563eb", "#8b5cf6", "#f59e0b", "#ec4899", "#64748b", "#14b8a6"];
const EMPTY_RECORDS = [];
const TIMEFRAMES = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "all", label: "All time" }
];

const getRecordDate = (record) => {
  const value = record?.date || record?.createdAt || record?.created_at || record?.timestamp;
  if (!value) return null;

  if (typeof value === "string") {
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(value);
    if (dateOnly) {
      const [, year, month, day] = dateOnly;
      const parsed = new Date(Number(year), Number(month) - 1, Number(day));
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getAmount = (record) => {
  const amount = Number(record?.amount);
  return Number.isFinite(amount) ? Math.abs(amount) : 0;
};

const formatMoney = (value, currencySymbol, formatCurrency) => {
  if (typeof formatCurrency === "function") return formatCurrency(value);
  return `${currencySymbol}${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const getMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const getPeriodLabel = (timeframe, now) => {
  if (timeframe === "monthly") {
    return now.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }
  if (timeframe === "yearly") return String(now.getFullYear());
  return "All recorded transactions";
};

function ChartEmptyState({ children }) {
  return <div className="analytics-empty" role="status">{children}</div>;
}

export default function AnalyticsPage({
  incomes,
  expenses,
  budgets = {},
  budgetSummary,
  currencySymbol = "₱",
  formatCurrency,
  dataLoading = false,
  dataUnavailable = false,
  selectedYear = new Date().getFullYear(),
  selectedMonth = new Date().getMonth()
}) {
  const [timeframe, setTimeframe] = useState("monthly");
  const currentYear = Number(selectedYear);
  const currentMonthKey = `${currentYear}-${String(Number(selectedMonth) + 1).padStart(2, "0")}`;
  const currentMonthDate = new Date(currentYear, Number(selectedMonth), 1);
  const hasTransactionData = Array.isArray(incomes) && Array.isArray(expenses);
  const incomeRecords = Array.isArray(incomes) ? incomes : EMPTY_RECORDS;
  const expenseRecords = Array.isArray(expenses) ? expenses : EMPTY_RECORDS;

  const scopedData = useMemo(() => {
    const matchesPeriod = (record) => {
      const date = getRecordDate(record);
      if (!date) return false;
      if (timeframe === "monthly") return getMonthKey(date) === currentMonthKey;
      if (timeframe === "yearly") return date.getFullYear() === currentYear;
      return true;
    };
    return {
      incomes: incomeRecords.filter(matchesPeriod),
      expenses: expenseRecords.filter(matchesPeriod)
    };
  }, [incomeRecords, expenseRecords, timeframe, currentMonthKey, currentYear]);

  const totals = useMemo(() => {
    const inflow = scopedData.incomes.reduce((sum, record) => sum + getAmount(record), 0);
    const outflow = scopedData.expenses.reduce((sum, record) => sum + getAmount(record), 0);
    return {
      inflow,
      outflow,
      net: inflow - outflow,
      savingsRate: inflow > 0 ? ((inflow - outflow) / inflow) * 100 : null
    };
  }, [scopedData]);

  const trendData = useMemo(() => {
    const totalsByKey = new Map();
    const addRecords = (records, keyName) => {
      records.forEach((record) => {
        const date = getRecordDate(record);
        if (!date) return;

        let key;
        let label;
        if (timeframe === "monthly") {
          if (getMonthKey(date) !== currentMonthKey) return;
          key = `${getMonthKey(date)}-${String(date.getDate()).padStart(2, "0")}`;
          label = String(date.getDate());
        } else if (timeframe === "yearly") {
          if (date.getFullYear() !== currentYear) return;
          key = `${currentYear}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          label = MONTHS[date.getMonth()];
        } else {
          key = getMonthKey(date);
          label = date.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
        }

        const current = totalsByKey.get(key) || { key, label, income: 0, expense: 0 };
        current[keyName] += getAmount(record);
        totalsByKey.set(key, current);
      });
    };

    addRecords(incomeRecords, "income");
    addRecords(expenseRecords, "expense");
    return [...totalsByKey.values()].sort((a, b) => a.key.localeCompare(b.key));
  }, [incomeRecords, expenseRecords, timeframe, currentMonthKey, currentYear]);

  const categoryData = useMemo(() => {
    const byCategory = new Map();
    scopedData.expenses.forEach((expense) => {
      const category = String(expense?.category || "Uncategorized").trim() || "Uncategorized";
      byCategory.set(category, (byCategory.get(category) || 0) + getAmount(expense));
    });
    return [...byCategory.entries()]
      .map(([name, value], index) => ({ name, value, color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }))
      .sort((a, b) => b.value - a.value);
  }, [scopedData]);

  const monthlyBudget = Number(budgetSummary?.totalMonthlyBudget || 0);
  const monthlyActual = expenseRecords.reduce((sum, expense) => {
    const date = getRecordDate(expense);
    return date && getMonthKey(date) === currentMonthKey ? sum + getAmount(expense) : sum;
  }, 0);
  const hasCategoryBudgets = Object.values(budgets || {}).some((amount) => Number(amount) > 0);
  const hasMonthlyBudget = Number.isFinite(monthlyBudget) && monthlyBudget > 0;
  const money = (value) => formatMoney(value, currencySymbol, formatCurrency);
  const periodLabel = getPeriodLabel(timeframe, timeframe === "monthly" ? currentMonthDate : new Date(currentYear, 0, 1));
  const noPeriodTransactions = scopedData.incomes.length === 0 && scopedData.expenses.length === 0;

  const kpis = [
    {
      label: "Total inflow",
      value: totals.inflow,
      detail: periodLabel,
      tone: "inflow"
    },
    {
      label: "Total outflow",
      value: totals.outflow,
      detail: periodLabel,
      tone: "outflow"
    },
    {
      label: "Net cash flow",
      value: totals.net,
      detail: periodLabel,
      tone: totals.net >= 0 ? "positive" : "negative"
    },
    {
      label: "Savings rate",
      value: totals.savingsRate,
      detail: totals.savingsRate == null ? "Not enough inflow data" : periodLabel,
      tone: "accent",
      percentage: true
    }
  ];

  return (
    <main className="analytics-page">
      <header className="analytics-header">
        <div>
          <p className="analytics-eyebrow">FinPilot / Reports</p>
          <h1>Financial Insights</h1>
          <p className="analytics-subtitle">A clear view of your cash flow and spending patterns.</p>
        </div>
        <div className="analytics-timeframe" aria-label="Analytics timeframe">
          {TIMEFRAMES.map((option) => (
            <button
              type="button"
              key={option.value}
              className={timeframe === option.value ? "is-active" : ""}
              onClick={() => setTimeframe(option.value)}
              aria-pressed={timeframe === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      {dataLoading ? (
        <div className="analytics-loading" role="status">Loading your financial data…</div>
      ) : dataUnavailable || !hasTransactionData ? (
        <div className="analytics-unavailable" role="status">
          Transaction data is currently unavailable. Please try again later.
        </div>
      ) : (
        <>
          <section className="analytics-kpis" aria-label={`${periodLabel} financial summary`}>
            {kpis.map((kpi) => {
              const hasValue = kpi.value != null && !noPeriodTransactions;
              const displayValue = hasValue
                ? kpi.percentage
                  ? `${kpi.value.toFixed(1)}%`
                  : money(kpi.value)
                : "—";
              return (
                <article className={`analytics-kpi analytics-kpi--${kpi.tone}`} key={kpi.label}>
                  <span className="analytics-kpi-label">{kpi.label}</span>
                  <strong className="analytics-kpi-value">{displayValue}</strong>
                  <span className="analytics-kpi-detail">
                    {noPeriodTransactions ? "No transactions for this period" : kpi.detail}
                  </span>
                </article>
              );
            })}
          </section>

          <section className="analytics-chart-grid" aria-label="Financial charts">
            <article className="analytics-panel analytics-panel--trend">
              <div className="analytics-panel-header">
                <div>
                  <h2>Inflow vs Outflow Trend</h2>
                  <p>{timeframe === "monthly" ? periodLabel : timeframe === "yearly" ? `By month · ${currentYear}` : "By month · all available history"}</p>
                </div>
                <div className="analytics-legend">
                  <span><i className="analytics-legend-dot analytics-legend-dot--inflow" />Inflow</span>
                  <span><i className="analytics-legend-dot analytics-legend-dot--outflow" />Outflow</span>
                </div>
              </div>
              {dataLoading ? (
                <ChartEmptyState>Loading trend data…</ChartEmptyState>
              ) : trendData.length ? (
                <div className="analytics-chart analytics-chart--trend">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trendData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="#e8edf3" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 11 }} minTickGap={18} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(value) => `${currencySymbol}${Number(value).toLocaleString()}`} width={72} />
                      <Tooltip
                        formatter={(value, name) => [money(value), name === "income" ? "Inflow" : "Outflow"]}
                        contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", boxShadow: "0 8px 24px rgba(15, 23, 42, .08)" }}
                      />
                      <Bar dataKey="income" name="Inflow" fill="#16a36a" radius={[4, 4, 0, 0]} maxBarSize={24} />
                      <Line dataKey="expense" name="Outflow" stroke="#e35d6a" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <ChartEmptyState>No dated transactions are available for this trend.</ChartEmptyState>
              )}
            </article>

            <article className="analytics-panel">
              <div className="analytics-panel-header">
                <div>
                  <h2>Spending by Category</h2>
                  <p>{periodLabel}</p>
                </div>
              </div>
              {categoryData.length ? (
                <div className="analytics-category-content">
                  <div className="analytics-chart analytics-chart--donut">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="84%" paddingAngle={2}>
                          {categoryData.map((item) => <Cell key={item.name} fill={item.color} />)}
                        </Pie>
                        <Tooltip formatter={(value) => money(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="analytics-category-list">
                    {categoryData.slice(0, 5).map((item) => (
                      <div className="analytics-category-row" key={item.name}>
                        <span><i style={{ backgroundColor: item.color }} />{item.name}</span>
                        <strong>{money(item.value)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <ChartEmptyState>No spending data for this period.</ChartEmptyState>
              )}
            </article>

            <article className="analytics-panel">
              <div className="analytics-panel-header">
                <div>
                  <h2>Budget vs Actual Spending</h2>
                  <p>Current month · based on your saved budget</p>
                </div>
              </div>
              {timeframe !== "monthly" ? (
                <ChartEmptyState>Budget comparisons are shown in the Monthly view.</ChartEmptyState>
              ) : hasMonthlyBudget ? (
                <>
                  <div className="analytics-budget-summary">
                    <span>Spent <strong>{money(monthlyActual)}</strong></span>
                    <span>Budget <strong>{money(monthlyBudget)}</strong></span>
                  </div>
                  <div className="analytics-chart analytics-chart--budget">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[{ name: "This month", actual: monthlyActual, budget: monthlyBudget }]} layout="vertical" margin={{ top: 12, right: 18, left: 12, bottom: 0 }} barGap={8}>
                        <CartesianGrid stroke="#e8edf3" strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(value) => `${currencySymbol}${Number(value).toLocaleString()}`} />
                        <YAxis type="category" dataKey="name" hide />
                        <Tooltip formatter={(value, name) => [money(value), name === "actual" ? "Actual" : "Budget"]} contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0" }} />
                        <Bar dataKey="budget" name="Budget" fill="#cbd5e1" radius={[0, 5, 5, 0]} barSize={14} />
                        <Bar dataKey="actual" name="Actual" fill="#0ea5a4" radius={[0, 5, 5, 0]} barSize={14} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : hasCategoryBudgets ? (
                <ChartEmptyState>Budget details are not available for the current month.</ChartEmptyState>
              ) : (
                <ChartEmptyState>No monthly budget has been set yet.</ChartEmptyState>
              )}
            </article>

            <article className="analytics-panel analytics-panel--health">
              <div className="analytics-panel-header">
                <div>
                  <h2>Financial Health</h2>
                  <p>Debt overview</p>
                </div>
                <span className="analytics-coming-soon">Not connected</span>
              </div>
              <ChartEmptyState>Debt figures aren’t available in Analytics yet. No estimates are shown.</ChartEmptyState>
            </article>
          </section>
        </>
      )}
    </main>
  );
}

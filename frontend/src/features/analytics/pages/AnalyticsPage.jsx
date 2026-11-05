import { useCallback, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { FileText } from "lucide-react";
import {
  buildCashFlowData,
  getCashFlowAvailability,
  getCashFlowRecordDate
} from "../utils/cashFlowData";
import {
  getAdjacentMonth,
  getAdjacentYear,
  isValidAnalyticsYear
} from "../utils/analyticsPeriod";
import MonthlyStatementModal from "../components/MonthlyStatementModal";
import "./AnalyticsModule.css";

const CATEGORY_COLORS = ["#0ea5a4", "#2563eb", "#8b5cf6", "#f59e0b", "#ec4899", "#64748b", "#14b8a6"];
const EMPTY_RECORDS = [];
const TIMEFRAMES = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "all", label: "All Time" }
];

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
  incomeStatus = "unavailable",
  expenseStatus = "unavailable",
  selectedYear = new Date().getFullYear(),
  selectedMonth = new Date().getMonth()
}) {
  const [timeframe, setTimeframe] = useState("monthly");
  const [statementOpen, setStatementOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(() => ({
    year: Number(selectedYear),
    month: Number(selectedMonth)
  }));
  const currentYear = selectedPeriod.year;
  const currentMonth = selectedPeriod.month;
  const [statementYear, setStatementYear] = useState(currentYear);
  const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
  const currentMonthDate = new Date(currentYear, currentMonth, 1);
  const budgetPeriodKey = `${Number(selectedYear)}-${String(Number(selectedMonth) + 1).padStart(2, "0")}`;
  const analyticsPeriodMatchesBudget = currentMonthKey === budgetPeriodKey;
  const {
    incomeAvailable,
    expenseAvailable,
    isLoading,
    showInitialLoading,
    bothUnavailable
  } = getCashFlowAvailability(incomes, expenses, incomeStatus, expenseStatus);
  const incomeRecords = Array.isArray(incomes) ? incomes : EMPTY_RECORDS;
  const expenseRecords = Array.isArray(expenses) ? expenses : EMPTY_RECORDS;

  const availableYears = useMemo(() => {
    const years = new Set([currentYear, Number(selectedYear)]);
    [...incomeRecords, ...expenseRecords].forEach((record) => {
      const date = getCashFlowRecordDate(record);
      if (date) years.add(date.getFullYear());
    });
    return [...years].filter(isValidAnalyticsYear).sort((a, b) => b - a);
  }, [incomeRecords, expenseRecords, currentYear, selectedYear]);
  const statementYears = useMemo(() => (
    [...new Set([...availableYears, new Date().getFullYear()])].sort((a, b) => b - a)
  ), [availableYears]);
  const closeStatement = useCallback(() => setStatementOpen(false), []);
  const openStatement = useCallback(() => {
    setStatementYear(currentYear);
    setStatementOpen(true);
  }, [currentYear]);

  const scopedData = useMemo(() => {
    const matchesPeriod = (record) => {
      const date = getCashFlowRecordDate(record);
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

  const trendData = useMemo(() => buildCashFlowData({
    incomes: incomeRecords,
    expenses: expenseRecords,
    timeframe,
    selectedYear: currentYear,
    selectedMonth: currentMonth
  }), [incomeRecords, expenseRecords, timeframe, currentYear, currentMonth]);

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
    const date = getCashFlowRecordDate(expense);
    return date && getMonthKey(date) === currentMonthKey ? sum + getAmount(expense) : sum;
  }, 0);
  const hasCategoryBudgets = Object.values(budgets || {}).some((amount) => Number(amount) > 0);
  const hasMonthlyBudget = Number.isFinite(monthlyBudget) && monthlyBudget > 0;
  const money = (value) => formatMoney(value, currencySymbol, formatCurrency);
  const periodLabel = getPeriodLabel(timeframe, timeframe === "monthly" ? currentMonthDate : new Date(currentYear, 0, 1));
  const noPeriodTransactions = incomeAvailable && expenseAvailable &&
    scopedData.incomes.length === 0 && scopedData.expenses.length === 0;

  const kpis = [
    {
      label: "Total inflow",
      value: incomeAvailable ? totals.inflow : null,
      detail: incomeAvailable ? periodLabel : incomeStatus === "loading" ? "Loading Income data" : "Income data unavailable",
      tone: "inflow"
    },
    {
      label: "Total outflow",
      value: expenseAvailable ? totals.outflow : null,
      detail: expenseAvailable ? periodLabel : expenseStatus === "loading" ? "Loading Expense data" : "Expense data unavailable",
      tone: "outflow"
    },
    {
      label: "Net cash flow",
      value: incomeAvailable && expenseAvailable ? totals.net : null,
      detail: incomeAvailable && expenseAvailable ? periodLabel : "Requires Income and Expense data",
      tone: incomeAvailable && expenseAvailable ? totals.net >= 0 ? "positive" : "negative" : "accent"
    },
    {
      label: "Savings rate",
      value: incomeAvailable && expenseAvailable ? totals.savingsRate : null,
      detail: incomeAvailable && expenseAvailable
        ? totals.savingsRate == null ? "Not enough inflow data" : periodLabel
        : "Requires Income and Expense data",
      tone: "accent",
      percentage: true
    }
  ];

  return (
    <main className="analytics-page">
      <header className="analytics-header">
        <div>
          <h1>Analytics</h1>
          <p className="analytics-subtitle">A clear view of your cash flow and spending patterns.</p>
        </div>
        <div className="analytics-header-controls">
          {timeframe === "monthly" ? (
            <div className="analytics-period-selector analytics-period-selector--month">
              <button
                type="button"
                className="analytics-period-nav"
                aria-label="Previous month"
                onClick={() => setSelectedPeriod((period) => getAdjacentMonth(period, -1))}
              >
                ‹
              </button>
              <label className="analytics-period-input">
                <span className="analytics-visually-hidden">Select month and year</span>
                <input
                  type="month"
                  aria-label="Select month and year"
                  value={`${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`}
                  onChange={(event) => {
                    const match = /^(\d{4})-(\d{2})$/.exec(event.target.value);
                    if (!match) return;
                    setSelectedPeriod({ year: Number(match[1]), month: Number(match[2]) - 1 });
                  }}
                />
              </label>
              <button
                type="button"
                className="analytics-period-nav"
                aria-label="Next month"
                onClick={() => setSelectedPeriod((period) => getAdjacentMonth(period, 1))}
              >
                ›
              </button>
            </div>
          ) : null}
          {timeframe === "yearly" ? (
            <div className="analytics-period-selector analytics-period-selector--year">
              <button
                type="button"
                className="analytics-period-nav"
                aria-label="Previous year"
                onClick={() => setSelectedPeriod((period) => ({ ...period, year: getAdjacentYear(period.year, -1) }))}
              >
                ‹
              </button>
              <label className="analytics-period-input">
                <span className="analytics-visually-hidden">Select year</span>
                <select
                  aria-label="Select year"
                  value={currentYear}
                  onChange={(event) => {
                    const year = Number(event.target.value);
                    if (isValidAnalyticsYear(year)) {
                      setSelectedPeriod((period) => ({ ...period, year }));
                    }
                  }}
                >
                  {availableYears.map((year) => <option value={year} key={year}>{year}</option>)}
                </select>
              </label>
              <button
                type="button"
                className="analytics-period-nav"
                aria-label="Next year"
                onClick={() => setSelectedPeriod((period) => ({ ...period, year: getAdjacentYear(period.year, 1) }))}
              >
                ›
              </button>
            </div>
          ) : null}
          <div className="analytics-timeframe" role="group" aria-label="Analytics timeframe">
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
          <button
            type="button"
            className="analytics-statement-trigger"
            onClick={openStatement}
          >
            <FileText size={17} strokeWidth={1.9} aria-hidden="true" />
            Interactive Statement
          </button>
        </div>
      </header>

      {showInitialLoading ? (
        <div className="analytics-loading" role="status">Loading your financial data…</div>
      ) : bothUnavailable ? (
        <div className="analytics-unavailable" role="status">
          Transaction data is currently unavailable. Please try again later.
        </div>
      ) : (
        <>
          {!incomeAvailable || !expenseAvailable ? (
            <div className="analytics-source-notice" role="status">
              {!incomeAvailable
                ? `Income data ${incomeStatus === "loading" ? "is still loading" : "is unavailable"}. Income totals and net cash flow are not shown.`
                : `Expense data ${expenseStatus === "loading" ? "is still loading" : "is unavailable"}. Expense totals and net cash flow are not shown.`}
            </div>
          ) : null}
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
                <div className="analytics-legend" aria-label="Cash flow chart legend">
                  {incomeAvailable ? <span><i className="analytics-legend-dot analytics-legend-dot--inflow" />Income</span> : null}
                  {expenseAvailable ? <span><i className="analytics-legend-dot analytics-legend-dot--outflow" />Expenses</span> : null}
                </div>
              </div>
              {trendData.length ? (
                <div className="analytics-chart analytics-chart--trend">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }} barGap={5}>
                      <CartesianGrid stroke="#e8edf3" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 11 }} minTickGap={18} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(value) => `${currencySymbol}${Number(value).toLocaleString()}`} width={72} />
                      <Tooltip
                        formatter={(value, name) => [money(value), name]}
                        labelFormatter={(label, payload) => payload?.[0]?.payload?.key || label}
                        contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", boxShadow: "0 8px 24px rgba(15, 23, 42, .08)" }}
                      />
                      {incomeAvailable ? <Bar dataKey="income" name="Income" fill="#16a36a" radius={[4, 4, 0, 0]} maxBarSize={26} /> : null}
                      {expenseAvailable ? <Bar dataKey="expense" name="Expenses" fill="#e35d6a" radius={[4, 4, 0, 0]} maxBarSize={26} /> : null}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : isLoading ? (
                <ChartEmptyState>Waiting for available transaction history…</ChartEmptyState>
              ) : (
                <ChartEmptyState>No dated transactions are available for this trend.</ChartEmptyState>
              )}
            </article>

            <article className="analytics-panel analytics-panel--net">
              <div className="analytics-panel-header">
                <div>
                  <h2>Net Cash Flow Trend</h2>
                  <p>Income minus expenses · {timeframe === "monthly" ? periodLabel : timeframe === "yearly" ? currentYear : "all available history"}</p>
                </div>
                <div className="analytics-legend" aria-label="Net cash flow chart legend">
                  <span><i className="analytics-legend-dot analytics-legend-dot--net" />Net cash flow</span>
                </div>
              </div>
              {!incomeAvailable || !expenseAvailable ? (
                <ChartEmptyState>
                  Net cash flow requires both data sources. {!incomeAvailable
                    ? `Income data ${incomeStatus === "loading" ? "is still loading." : "is unavailable."}`
                    : `Expense data ${expenseStatus === "loading" ? "is still loading." : "is unavailable."}`}
                </ChartEmptyState>
              ) : trendData.length ? (
                <div className="analytics-chart analytics-chart--net" role="img" aria-label="Net cash flow trend">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="#e8edf3" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 11 }} minTickGap={18} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(value) => `${currencySymbol}${Number(value).toLocaleString()}`} width={72} />
                      <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />
                      <Tooltip
                        formatter={(value) => [money(value), "Net cash flow"]}
                        labelFormatter={(label, payload) => payload?.[0]?.payload?.key || label}
                        contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", boxShadow: "0 8px 24px rgba(15, 23, 42, .08)" }}
                      />
                      <Line dataKey="net" name="Net cash flow" stroke="#0e8f8e" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "#0e8f8e" }} />
                    </LineChart>
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
              {!expenseAvailable ? (
                <ChartEmptyState>
                  {expenseStatus === "loading" ? "Loading Expense data…" : "Expense data is unavailable."}
                </ChartEmptyState>
              ) : categoryData.length ? (
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
                  <p>{currentMonthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })} · based on your saved budget</p>
                </div>
              </div>
              {!expenseAvailable ? (
                <ChartEmptyState>
                  {expenseStatus === "loading" ? "Loading Expense data…" : "Expense data is unavailable."}
                </ChartEmptyState>
              ) : timeframe !== "monthly" ? (
                <ChartEmptyState>Budget comparisons are shown in the Monthly view.</ChartEmptyState>
              ) : !analyticsPeriodMatchesBudget ? (
                <ChartEmptyState>Budget details are only loaded for the app’s currently selected month.</ChartEmptyState>
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
      <MonthlyStatementModal
        open={statementOpen}
        onClose={closeStatement}
        year={statementYear}
        onYearChange={setStatementYear}
        availableYears={statementYears}
        incomes={incomeRecords}
        expenses={expenseRecords}
        incomeAvailable={incomeAvailable}
        expenseAvailable={expenseAvailable}
        incomeStatus={incomeStatus}
        expenseStatus={expenseStatus}
        currencySymbol={currencySymbol}
        formatCurrency={formatCurrency}
      />
    </main>
  );
}

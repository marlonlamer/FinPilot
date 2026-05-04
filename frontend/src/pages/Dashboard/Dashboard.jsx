import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import BudgetOverview from "../../components/BudgetOverview/BudgetOverview";
import "./DashboardModule.css";

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
  } = props;

  const { availableBalance } = props;

  const toNumber = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const fmt = (v, digits = 2) => {
    const n = toNumber(v);
    return formatCurrency ? formatCurrency(n) : `${currencySymbol}${n.toFixed(digits)}`;
  };


  return (
    <div className="dashboard-root">
  
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

      {/* Monthly budget editing moved to Expenses -> Edit Budgets modal */}

        <BudgetOverview
        monthlyBudget={monthlyBudget}
        percentBudgetUsed={percentBudgetUsed}
        budgetRemaining={budgetRemaining}
        budgetColor={budgetColor}
        overBudgetCategories={overBudgetCategories}
        COLORS={COLORS}
        currencySymbol={currencySymbol}
        formatCurrency={formatCurrency}
      />

      <div className="chart-section">
        <h2>Expenses vs Income Per Month</h2>
        {combinedLineData.length > 0 ? (
          <div className="chart-wrapper">
            <ResponsiveContainer>
              <LineChart data={combinedLineData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
      {overBudgetCategories.length > 0 && (
        <div className="budget-alert">
          <strong>Budget Alert:</strong> You have exceeded the budget for {overBudgetCategories.map(c => c.category).join(", ")}.
        </div>
      )}

      {pieData.length > 0 ? (
        <div className="pie-wrapper">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                labelLine={false}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                  const RAD = Math.PI / 180;
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                  const x = cx + radius * Math.cos(-midAngle * RAD);
                  const y = cy + radius * Math.sin(-midAngle * RAD);
                  return (
                    <text x={x} y={y} fill="#ffffff" textAnchor="middle" dominantBaseline="central" className="pie-label">
                      {`${(toNumber(percent) * 100).toFixed(0)}%`}
                    </text>
                  );
                }}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => (formatCurrency ? formatCurrency(value) : `${currencySymbol}${Number(value).toFixed(2)}`)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p>No expenses to display.</p>
      )}
    </div>
  );
}

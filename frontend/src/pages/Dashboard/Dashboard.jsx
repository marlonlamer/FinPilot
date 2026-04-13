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
import BudgetOverview from "../../components/BudgetOverview";

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


  return (
    <>
  
      <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 160px", background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 12, color: "#666" }}>Available Balance</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrency ? formatCurrency(availableBalance) : `${currencySymbol}${availableBalance.toFixed(2)}`}</div>
          <div style={{ marginTop: 8, fontSize: 12, color: "#555" }} />
        </div>
        <div style={{ flex: "1 1 160px", background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 12, color: "#666" }}>Total Savings</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrency ? formatCurrency(computedTotalSavings) : `${currencySymbol}${computedTotalSavings.toFixed(2)}`}</div>
        </div>
        <div style={{ flex: "1 1 160px", background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 12, color: "#666" }}>Monthly Income</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrency ? formatCurrency(monthlyIncomeTotal) : `${currencySymbol}${monthlyIncomeTotal.toFixed(2)}`}</div>
        </div>
        <div style={{ flex: "1 1 160px", background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 12, color: "#666" }}>Monthly Expenses</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrency ? formatCurrency(monthlyExpenseTotal) : `${currencySymbol}${monthlyExpenseTotal.toFixed(2)}`}</div>
        </div>
        <div style={{ flex: "1 1 160px", background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 12, color: "#666" }}>Total Net Worth</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            {formatCurrency
              ? formatCurrency(Number(computedTotalSavings || 0) + Number(availableBalance || 0))
              : `${currencySymbol}${(Number(computedTotalSavings || 0) + Number(availableBalance || 0)).toFixed(2)}`}
          </div>
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

      <div style={{ marginTop: "1rem" }}>
        <h2>Expenses vs Income Per Month</h2>
        {combinedLineData.length > 0 ? (
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <LineChart data={combinedLineData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => (formatCurrency ? formatCurrency(v) : `${currencySymbol}${v.toFixed(0)}`)} />
                <Tooltip formatter={(value) => (formatCurrency ? formatCurrency(value) : `${currencySymbol}${Number(value).toFixed(2)}`)} />
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

      <h2 style={{ marginTop: 20 }}>By Category</h2>
      {overBudgetCategories.length > 0 && (
        <div style={{ padding: 10, background: "#FFEEEE", color: "#AA0000", borderRadius: 6, marginBottom: 12 }}>
          <strong>Budget Alert:</strong> You have exceeded the budget for {overBudgetCategories.map(c => c.category).join(", ")}.
        </div>
      )}

      {pieData.length > 0 ? (
        <div style={{ width: "100%", height: 300 }}>
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
                    <text x={x} y={y} fill="#ffffff" textAnchor="middle" dominantBaseline="central" style={{ fontSize: 12, fontWeight: 600 }}>
                      {`${(percent * 100).toFixed(0)}%`}
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
    </>
  );
}

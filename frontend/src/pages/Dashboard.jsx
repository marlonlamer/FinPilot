import React, { useEffect, useState } from "react";
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
import BudgetOverview from "../components/BudgetOverview";

export default function Dashboard(props) {
  const {
    totalSavings,
    monthlyIncomeTotal,
    monthlyExpenseTotal,
    totalNetWorth,
    savingsRateColor,
    savingsRate,
    dateFilter,
    setDateFilter,
    monthlyBudget,
    setMonthlyBudget,
    combinedLineData,
    pieData,
    overBudgetCategories,
    percentBudgetUsed,
    budgetColor,
    budgetRemaining,
    COLORS
  } = props;

  const [includeTotalSavings, setIncludeTotalSavings] = useState(() => {
    try {
      return localStorage.getItem("includeTotalSavings") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("includeTotalSavings", includeTotalSavings ? "true" : "false");
    } catch {}
  }, [includeTotalSavings]);

  const computedAvailableBalance = Number(monthlyIncomeTotal || 0) - Number(monthlyExpenseTotal || 0) - (includeTotalSavings ? Number(totalSavings || 0) : 0);

  function handleToggleIncludeSavings(checked) {
    if (checked) {
      const ok = window.confirm(
        "Include Total Savings in available balance calculation? This will subtract your total savings from the available balance. Continue?"
      );
      if (ok) setIncludeTotalSavings(true);
    } else {
      setIncludeTotalSavings(false);
    }
  }

  return (
    <>
      <h1>💰 Expense Analyzer</h1>
      <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 160px", background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 12, color: "#666" }}>Available Balance</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>₱{computedAvailableBalance.toFixed(2)}</div>
          <div style={{ marginTop: 8, fontSize: 12, color: "#555" }}>
            <label style={{ cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={includeTotalSavings}
                onChange={e => handleToggleIncludeSavings(e.target.checked)}
                style={{ marginRight: 6 }}
              />
              Subtract Total Savings from Available Balance
            </label>
          </div>
        </div>
        <div style={{ flex: "1 1 160px", background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 12, color: "#666" }}>Total Savings</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>₱{totalSavings.toFixed(2)}</div>
        </div>
        <div style={{ flex: "1 1 160px", background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 12, color: "#666" }}>Monthly Income</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>₱{monthlyIncomeTotal.toFixed(2)}</div>
        </div>
        <div style={{ flex: "1 1 160px", background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 12, color: "#666" }}>Monthly Expenses</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>₱{monthlyExpenseTotal.toFixed(2)}</div>
        </div>
        <div style={{ flex: "1 1 160px", background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 12, color: "#666" }}>Total Net Worth</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>₱{totalNetWorth.toFixed(2)}</div>
        </div>
      </div>

      <p style={{ color: savingsRateColor }}>Savings Rate: {savingsRate !== null ? `${savingsRate.toFixed(1)}%` : "N/A"}</p>

      <div style={{ marginTop: "0.5rem" }}>
        <label style={{ marginRight: 8 }}>Date filter:</label>
        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="today">Today</option>
          <option value="week">Last 7 days</option>
          <option value="month">This month</option>
        </select>
      </div>

      <div style={{ marginTop: "0.5rem" }}>
        <label style={{ marginRight: 8 }}>Monthly Budget:</label>
        <input
          type="number"
          placeholder="Set monthly budget"
          value={monthlyBudget === null ? "" : monthlyBudget}
          onChange={e => setMonthlyBudget(e.target.value === "" ? null : Number(e.target.value))}
        />
        {monthlyBudget !== null && (
          <span style={{ marginLeft: 12, color: budgetColor }}>
            {percentBudgetUsed !== null ? `${percentBudgetUsed.toFixed(1)}% used` : ""}
            {budgetRemaining !== null && ` — Remaining: ₱${budgetRemaining.toFixed(2)}`}
          </span>
        )}
      </div>

      <BudgetOverview
        monthlyBudget={monthlyBudget}
        percentBudgetUsed={percentBudgetUsed}
        budgetRemaining={budgetRemaining}
        budgetColor={budgetColor}
        overBudgetCategories={overBudgetCategories}
        COLORS={COLORS}
      />

      <div style={{ marginTop: "1rem" }}>
        <h2>Expenses vs Income Per Month</h2>
        {combinedLineData.length > 0 ? (
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <LineChart data={combinedLineData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `₱${v.toFixed(0)}`} />
                <Tooltip formatter={(value) => `₱${Number(value).toFixed(2)}`} />
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
              <Tooltip formatter={(value) => `₱${Number(value).toFixed(2)}`} />
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

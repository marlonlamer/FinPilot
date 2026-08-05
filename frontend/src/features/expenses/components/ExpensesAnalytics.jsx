import React from "react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import ExpenseDistribution from "../../../components/ExpenseDistribution/ExpenseDistribution";

export default function ExpensesAnalytics({ lastSixMonthsData, expenses, selectedMonth, selectedYear, formatCurrency, currencySymbol }) {
  return (
    <div className="analytics-row">
      <div className="card trend-card">
        <div className="card-label">6‑Month Expense Trend</div>
        <div className="chart-small">
          <ResponsiveContainer>
            <LineChart data={lastSixMonthsData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v) => (formatCurrency ? formatCurrency(v) : (v.toFixed ? `${currencySymbol}${v.toFixed(0)}` : v))} />
              <Tooltip formatter={(value) => (formatCurrency ? formatCurrency(value) : `${currencySymbol}${Number(value).toFixed(2)}`)} />
              <Line type="monotone" dataKey="value" stroke="#FF6B6B" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card category-card">
        <div className="card-label">Expenses by Category</div>
        <div className="chart-small center">
          <ExpenseDistribution
            expenses={expenses}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            currencySymbol={currencySymbol}
            formatCurrency={formatCurrency}
          />
        </div>
      </div>
    </div>
  );
}

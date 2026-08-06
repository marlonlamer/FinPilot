import React from "react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, PieChart, Pie } from "recharts";
import "./AnalyticsModule.css";

export default function AnalyticsPage({ combinedLineData, pieData, currencySymbol = "₱", formatCurrency }) {
  return (
    <div>
      <h2>Analytics</h2>
      <div className="reports-chart reports-line">
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

      <div className="reports-chart reports-pie">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={80} />
            <Tooltip formatter={(value) => (formatCurrency ? formatCurrency(value) : `${currencySymbol}${Number(value).toFixed(2)}`)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

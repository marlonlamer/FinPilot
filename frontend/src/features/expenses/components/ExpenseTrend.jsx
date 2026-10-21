import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import "./ExpenseTrend.css";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fullMonthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const getExpenseDate = (expense) => {
  const rawDate = expense?.date || expense?.createdAt || expense?.created_at || expense?.timestamp;
  if (!rawDate) return null;

  if (typeof rawDate === "string") {
    const dateOnlyMatch = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }

  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getShortAmount = (value, currencySymbol) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `${currencySymbol}0`;
  if (amount >= 1000000) return `${currencySymbol}${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${currencySymbol}${(amount / 1000).toFixed(1)}K`;
  return `${currencySymbol}${amount.toFixed(0)}`;
};

const buildChartData = (expenses, currentYear) => {
  const previousYear = currentYear - 1;
  const yearTotals = {
    [currentYear]: Array(12).fill(0),
    [previousYear]: Array(12).fill(0)
  };

  expenses.forEach((expense) => {
    const amount = Number(expense?.amount);
    if (!Number.isFinite(amount)) return;

    const date = getExpenseDate(expense);
    if (!date) return;

    const year = date.getFullYear();
    if (year !== currentYear && year !== previousYear) return;
    yearTotals[year][date.getMonth()] += Math.abs(amount);
  });

  return monthNames.map((month, index) => ({
    month,
    fullMonth: fullMonthNames[index],
    currentYear: yearTotals[currentYear][index],
    previousYear: yearTotals[previousYear][index]
  }));
};

export default function ExpenseTrend({ expenses, currencySymbol = "₱", formatCurrency }) {
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;
  const chartData = useMemo(() => buildChartData(Array.isArray(expenses) ? expenses : [], currentYear), [expenses, currentYear]);

  const currencyFormatter = (value) => {
    const amount = Number(value || 0);
    return formatCurrency ? formatCurrency(amount) : `${currencySymbol}${amount.toFixed(2)}`;
  };

  return (
    <section className="expense-trend-card" aria-label="Expense trend chart">
      <div className="expense-trend-header">
        <div>
          <h3 className="expense-trend-title">Outflow Trend</h3>
          <p className="expense-trend-subtitle">Monthly spending comparison (Current Year vs Previous Year)</p>
        </div>
        <div className="expense-trend-legend" aria-label="Expense trend legend">
          <span className="expense-trend-legend-item">
            <span className="expense-trend-swatch expense-trend-swatch--current" aria-hidden="true" />
            {currentYear}
          </span>
          <span className="expense-trend-legend-item">
            <span className="expense-trend-swatch expense-trend-swatch--previous" aria-hidden="true" />
            {previousYear}
          </span>
        </div>
      </div>

      {Array.isArray(expenses) ? (
        <div className="expense-trend-chart" role="img" aria-label={`Monthly expenses for ${currentYear} compared with ${previousYear}`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={6}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748b", fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickFormatter={(value) => getShortAmount(value, currencySymbol)}
                width={56}
              />
              <Tooltip
                cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
                formatter={(value, name) => [currencyFormatter(value), name]}
                labelFormatter={(_, payload) => {
                  const month = payload?.[0]?.payload?.fullMonth;
                  return `${month || "Month"} ${currentYear}`;
                }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #dfe6ee",
                  boxShadow: "0 12px 31px rgba(15, 23, 42, 0.12)",
                  background: "#fff",
                  color: "#0f172a"
                }}
              />
              <Bar dataKey="currentYear" name={String(currentYear)} fill="#ef6b6b" radius={[6, 6, 0, 0]} maxBarSize={24} />
              <Bar dataKey="previousYear" name={String(previousYear)} fill="#fed7aa" radius={[6, 6, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="expense-trend-error" role="status">Historical expense data could not be loaded.</p>
      )}
    </section>
  );
}

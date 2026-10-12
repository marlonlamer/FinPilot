import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import "./IncomeTrend.css";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const getIncomeDate = (item) => {
  const rawDate = item?.date || item?.createdAt || item?.created_at || item?.timestamp;
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

const getShortAmount = (value, currencySymbol = "₱") => {
  if (!Number.isFinite(Number(value))) return `${currencySymbol}0`;
  const numericValue = Number(value);
  if (numericValue >= 1000000) return `${currencySymbol}${(numericValue / 1000000).toFixed(1)}M`;
  if (numericValue >= 1000) return `${currencySymbol}${(numericValue / 1000).toFixed(1)}K`;
  return `${currencySymbol}${numericValue.toFixed(0)}`;
};

const buildChartData = (incomes = []) => {
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const yearTotals = {
    [currentYear]: Array(12).fill(0),
    [previousYear]: Array(12).fill(0)
  };

  incomes.forEach((item) => {
    const amount = Number(item?.amount);
    if (!Number.isFinite(amount)) return;

    const date = getIncomeDate(item);
    if (!date) return;

    const itemYear = date.getFullYear();
    if (itemYear !== currentYear && itemYear !== previousYear) return;

    const monthIndex = date.getMonth();
    yearTotals[itemYear][monthIndex] += amount;
  });

  return monthNames.map((month, index) => ({
    month,
    currentYear: yearTotals[currentYear][index] || 0,
    previousYear: yearTotals[previousYear][index] || 0,
    yearLabel: `${month} ${currentYear}`
  }));
};

export default function IncomeTrend({ incomes = [], currencySymbol = "₱", formatCurrency }) {
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;
  const chartData = useMemo(() => buildChartData(incomes), [incomes]);

  const currencyFormatter = (value) => {
    if (formatCurrency) return formatCurrency(Number(value));
    const numericValue = Number(value || 0);
    return `${currencySymbol}${numericValue.toFixed(2)}`;
  };

  const axisFormatter = (value) => getShortAmount(value, currencySymbol);

  return (
    <section className="income-trend-card" aria-label="Income trend chart">
      <div className="income-trend-header">
        <div>
          <h3 className="income-trend-title">Inflow Trend</h3>
          <p className="income-trend-subtitle">Monthly income comparison (Current Year vs Previous Year)</p>
        </div>
        <div className="income-trend-legend" aria-label="Income trend legend">
          <span className="income-trend-legend-item">
            <span className="income-trend-swatch income-trend-swatch--current" aria-hidden="true" />
            {currentYear}
          </span>
          <span className="income-trend-legend-item">
            <span className="income-trend-swatch income-trend-swatch--previous" aria-hidden="true" />
            {previousYear}
          </span>
        </div>
      </div>

      <div className="income-trend-chart" role="img" aria-label={`Income trend for ${currentYear} compared with ${previousYear}`}>
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
              tickFormatter={axisFormatter}
              width={56}
            />
            <Tooltip
              cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
              formatter={(value, name) => [currencyFormatter(value), name]}
              labelFormatter={(label) => `${label} ${currentYear}`}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #dfe6ee",
                boxShadow: "0 12px 31px rgba(15, 23, 42, 0.12)",
                background: "#fff",
                color: "#0f172a"
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Bar dataKey="currentYear" name={String(currentYear)} fill="#0ea5a4" radius={[6, 6, 0, 0]} maxBarSize={24} />
            <Bar dataKey="previousYear" name={String(previousYear)} fill="#bae6fd" radius={[6, 6, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

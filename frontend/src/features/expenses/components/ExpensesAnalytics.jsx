import React from "react";
import ExpenseDistribution from "../../../components/ExpenseDistribution/ExpenseDistribution";
import ExpenseTrend from "./ExpenseTrend";

export default function ExpensesAnalytics({ expenses, trendExpenses, selectedMonth, selectedYear, formatCurrency, currencySymbol }) {
  return (
    <div className="analytics-row">
      <ExpenseTrend expenses={trendExpenses} formatCurrency={formatCurrency} currencySymbol={currencySymbol} />

      <div className="card category-card">
        <h3 className="category-card-title">Expenses by Category</h3>
        <ExpenseDistribution
          expenses={expenses}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          currencySymbol={currencySymbol}
          formatCurrency={formatCurrency}
          layout="stacked"
          percentageDigits={2}
        />
      </div>
    </div>
  );
}

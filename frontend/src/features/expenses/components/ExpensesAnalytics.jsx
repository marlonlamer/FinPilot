import React from "react";
import ExpenseDistribution from "../../../components/ExpenseDistribution/ExpenseDistribution";
import ExpenseTrend from "./ExpenseTrend";

export default function ExpensesAnalytics({ expenses, trendExpenses, selectedMonth, selectedYear, formatCurrency, currencySymbol }) {
  return (
    <div className="analytics-row">
      <ExpenseTrend expenses={trendExpenses} formatCurrency={formatCurrency} currencySymbol={currencySymbol} />

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

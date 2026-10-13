import React from "react";
import ExpenseDistribution from "../../../components/ExpenseDistribution/ExpenseDistribution";
import ExpenseTrend from "./ExpenseTrend";

export default function ExpensesAnalytics({ expenses, trendExpenses, formatCurrency, currencySymbol }) {
  return (
    <>
      <div className="expense-trend-area">
        <ExpenseTrend expenses={trendExpenses} formatCurrency={formatCurrency} currencySymbol={currencySymbol} />
      </div>
      <section className="card category-card">
        <h3 className="category-card-title">Expenses by Category</h3>
        <ExpenseDistribution
          expenses={expenses}
          currencySymbol={currencySymbol}
          formatCurrency={formatCurrency}
          layout="stacked"
          filterBySelectedMonth={false}
          percentageDigits={2}
        />
      </section>
    </>
  );
}

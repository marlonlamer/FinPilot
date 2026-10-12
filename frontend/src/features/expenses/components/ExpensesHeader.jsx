import React from "react";

export default function ExpensesHeader({ onAddExpense }) {
  return (
    <div className="expenses-header">
      <div className="expenses-header-content">
        <h1 className="expenses-header-title">Expenses</h1>
        <p className="expenses-header-description">
          Track spending, monitor budgets, and understand where your money goes.
        </p>
      </div>
      <button className="btn btn-primary expenses-header-button" onClick={onAddExpense}>
        ＋ Add Expense
      </button>
    </div>
  );
}

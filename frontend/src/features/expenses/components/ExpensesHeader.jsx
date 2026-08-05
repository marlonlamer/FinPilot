import React from "react";

export default function ExpensesHeader({ onAddExpense, onAddBudget }) {
  return (
    <div className="page-header">
      <h3 className="header-title">Expenses</h3>
      <div className="header-actions">
        <button className="btn btn-primary" onClick={onAddExpense}>＋ Add Expense</button>
        <button className="btn btn-outline" onClick={onAddBudget}>＋ Add Budget</button>
      </div>
    </div>
  );
}

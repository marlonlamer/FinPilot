import React from "react";

export default function IncomeHeader({ onAddClick }) {
  return (
    <div className="income-header">
      <h3 className="page-title">Incomes</h3>
      <button
        className="btn btn-primary"
        onClick={onAddClick}
      >＋ Add Income</button>
    </div>
  );
}

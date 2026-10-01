import React from "react";

export default function IncomeHeader({ onAddClick }) {
  return (
    <div className="income-header">
      <div className="income-header-content">
        <h1 className="income-header-title">Incomes</h1>
        <p className="income-header-description">
          Track your income and sources in one place.
        </p>
      </div>
      <button 
        className="income-header-button" 
        onClick={onAddClick}
        aria-label="Add new income"
      >
        + Add Income
      </button>
    </div>
  );
}

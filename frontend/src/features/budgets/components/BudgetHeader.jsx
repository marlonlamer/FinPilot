import React from "react";

export default function BudgetHeader({ onAddBudget, showAddButton = true, readOnly = false }) {
  return (
    <div className="budget-header">
      <div className="budget-header-content">
        <h1 className="budget-header-title">Budget Planner</h1>
        <p className="budget-header-description">
          Plan your spending, set clear limits, and stay on track.
        </p>
      </div>
      {showAddButton && !readOnly && (
        <button 
          className="budget-header-button" 
          onClick={onAddBudget}
          aria-label="Add new budget"
        >
          + Add Budget
        </button>
      )}
    </div>
  );
}
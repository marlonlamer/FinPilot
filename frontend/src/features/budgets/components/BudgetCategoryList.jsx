import React from "react";

export default function BudgetCategoryList({ hasItems, children }) {
  return (
    <div className="budget-card small">
      <div className="card-label">Budgets by Category</div>
      {hasItems ? (
        <div className="budget-grid">{children}</div>
      ) : (
        <div className="muted">No budgets set. Click "Add Budget" to create one.</div>
      )}
    </div>
  );
}
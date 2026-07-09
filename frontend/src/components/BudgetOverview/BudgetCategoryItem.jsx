import React from "react";

export default function BudgetCategoryItem({
  category,
  budget,
  spent,
  remaining,
  severity = "normal",
  readOnly = false,
  currencySymbol = "₱",
  formatCurrency,
  onEdit = () => {},
  onDelete = () => {},
  progressPercent = 0,
}) {
  return (
    <div className="budget-category-card">
      <div className="budget-row-header">
        <div className="budget-name">{category}</div>
        <div className="category-actions">
          {!readOnly && (
            <>
              <button className="icon-btn" onClick={onEdit}>✏️</button>
              <button className="icon-btn" onClick={onDelete}>❌</button>
            </>
          )}
        </div>
      </div>
      <div className="budget-progress">
        <div className="progress-track">
          <div className={"progress-fill " + (severity === "over" ? 'over' : (severity === "warning" ? 'warning' : 'normal'))} style={{ width: `${progressPercent}%` }} />
        </div>
      </div>
      <div className="budget-amount">{formatCurrency ? formatCurrency(spent) : `${currencySymbol}${spent.toFixed(2)}`} / {formatCurrency ? formatCurrency(budget) : `${currencySymbol}${budget.toFixed(2)}`} — Remaining: {formatCurrency ? formatCurrency(remaining) : `${currencySymbol}${remaining.toFixed(2)}`}</div>
    </div>
  );
}

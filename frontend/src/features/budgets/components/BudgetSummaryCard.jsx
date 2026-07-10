import React from "react";

export default function BudgetSummaryCard({
  monthlyBudget,
  percentBudgetUsed,
  budgetRemaining,
  budgetColor,
  currencySymbol = "₱",
  formatCurrency,
  showAddButton = true,
  readOnly = false,
  progressPercent = 0,
  onAddBudget = () => {},
}) {
  return (
    <div className="budget-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="card-label">Monthly Budget</div>
          <div className="card-value">{monthlyBudget == null ? "Not set" : (formatCurrency ? formatCurrency(monthlyBudget) : typeof monthlyBudget === "number" ? `${currencySymbol}${monthlyBudget.toFixed(2)}` : "Not set")}</div>
        </div>
        <div>
          {showAddButton && !readOnly && (
            <button className="btn btn-primary" onClick={onAddBudget}>＋ Add Budget</button>
          )}
        </div>
      </div>

      <div className="budget-progress-block">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPercent}%`, background: budgetColor || "#60a5fa" }} />
        </div>
        <div className="progress-subtext">
          {typeof percentBudgetUsed === "number"
            ? `${percentBudgetUsed.toFixed(1)}% used`
            : "Usage not available"}
          {budgetRemaining != null && ` — Remaining: ${formatCurrency ? formatCurrency(budgetRemaining) : typeof budgetRemaining === "number"
            ? `${currencySymbol}${budgetRemaining.toFixed(2)}`
            : "N/A"} `}
        </div>
      </div>
    </div>
  );
}

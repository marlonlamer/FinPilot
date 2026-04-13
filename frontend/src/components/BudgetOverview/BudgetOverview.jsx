import React from "react";
import "./BudgetOverview.css";

export default function BudgetOverview({ monthlyBudget, percentBudgetUsed, budgetRemaining, budgetColor, overBudgetCategories, COLORS, currencySymbol = "₱", formatCurrency }) {
  const pct = percentBudgetUsed || 0;

  return (
    <div className="budget-overview">
      <div className="budget-card">
        <div className="card-label">Monthly Budget</div>
        <div className="card-value">{monthlyBudget === null ? "Not set" : (formatCurrency ? formatCurrency(monthlyBudget) : `${currencySymbol}${Number(monthlyBudget).toFixed(2)}`)}</div>

        <div className="budget-progress-block">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: budgetColor || "#60a5fa" }} />
          </div>
          <div className="progress-subtext">
            {percentBudgetUsed !== null ? `${percentBudgetUsed.toFixed(1)}% used` : "Usage not available"}
            {budgetRemaining !== null && ` — Remaining: ${formatCurrency ? formatCurrency(budgetRemaining) : `${currencySymbol}${Number(budgetRemaining).toFixed(2)}`}`}
          </div>
        </div>
      </div>

      <div className="budget-card small">
        <div className="card-label">Top Over-Budget Categories</div>
        {overBudgetCategories && overBudgetCategories.length > 0 ? (
          <ul className="overbudget-list">
            {overBudgetCategories.slice(0, 5).map((c, i) => (
              <li key={c.category} className="overbudget-item" style={{ color: COLORS && COLORS[i % COLORS.length] ? COLORS[i % COLORS.length] : "#333" }}>
                {c.category} — {formatCurrency ? formatCurrency(c.spent || c.value || 0) : `${currencySymbol}${Number(c.spent || c.value || 0).toFixed(2)}`}
              </li>
            ))}
          </ul>
        ) : (
          <div className="muted">None</div>
        )}
      </div>
    </div>
  );
}

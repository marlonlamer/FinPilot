import React from "react";
import { CreditCard, PieChart, TrendingUp, Wallet } from "lucide-react";
import "./BudgetSummaryCard.css";

function displayAmount(value, formatCurrency, currencySymbol) {
  if (value == null || !Number.isFinite(Number(value))) {
    return "Not set";
  }

  if (formatCurrency) {
    const formatted = formatCurrency(value);
    if (formatted) return formatted;
  }

  return `${currencySymbol}${Number(value).toFixed(2)}`;
}

export default function BudgetSummaryCard({
  monthlyBudget,
  percentBudgetUsed,
  budgetRemaining,
  currencySymbol = "₱",
  formatCurrency,
  showAddButton = true,
  readOnly = false,
  onAddBudget = () => {},
}) {
  const totalBudget = monthlyBudget == null || monthlyBudget === "" ? null : Number(monthlyBudget);
  const remaining = budgetRemaining == null || budgetRemaining === "" ? null : Number(budgetRemaining);
  const hasBudget = Number.isFinite(totalBudget);
  const hasRemaining = Number.isFinite(remaining);
  const totalSpent = hasBudget && hasRemaining ? totalBudget - remaining : 0;
  const isOverspent = hasRemaining && remaining < 0;
  const isAvailable = hasRemaining && remaining > 0;

  const usagePercent = typeof percentBudgetUsed === "number"
    ? percentBudgetUsed
    : hasBudget && totalBudget > 0
      ? (totalSpent / totalBudget) * 100
      : null;

  const spentSupport =
    typeof usagePercent === "number"
      ? `${usagePercent.toFixed(1)}% used`
      : hasBudget && totalBudget === 0
        ? "No budget set"
        : "Usage not available";

  const remainingSupport = !hasRemaining
    ? "Not available"
    : isOverspent
      ? "Overspent"
      : "Available";

  const remainingState = isOverspent ? " is-overspent" : isAvailable ? " is-available" : "";

  const budgetUsedDisplay = typeof usagePercent === "number"
    ? `${Math.round(usagePercent)}%`
    : "0%";

  return (
    <section className="budget-summary-card" aria-label="Monthly budget summary">
      {showAddButton && !readOnly && (
        <div className="budget-summary-actions">
          <button className="btn btn-primary" onClick={onAddBudget}>＋ Add Budget</button>
        </div>
      )}

      <div className="budget-summary-metrics">
        <div className="budget-summary-metric budget-summary-metric--budget">
          <div className="budget-summary-icon" aria-hidden="true">
            <Wallet size={18} strokeWidth={2} />
          </div>
          <div className="budget-summary-copy">
            <div className="budget-summary-label">Total Budget</div>
            <div className="budget-summary-value">
              {displayAmount(hasBudget ? totalBudget : null, formatCurrency, currencySymbol)}
            </div>
            <div className="budget-summary-support">Monthly limit</div>
          </div>
        </div>

        <div className="budget-summary-metric budget-summary-metric--spent">
          <div className="budget-summary-icon" aria-hidden="true">
            <TrendingUp size={18} strokeWidth={2} />
          </div>
          <div className="budget-summary-copy">
            <div className="budget-summary-label">Total Spent</div>
            <div className="budget-summary-value">
              {displayAmount(totalSpent, formatCurrency, currencySymbol)}
            </div>
            <div className="budget-summary-support">{spentSupport}</div>
          </div>
        </div>

        <div className={`budget-summary-metric budget-summary-metric--remaining${remainingState}`}>
          <div className="budget-summary-icon" aria-hidden="true">
            <CreditCard size={18} strokeWidth={2} />
          </div>
          <div className="budget-summary-copy">
            <div className="budget-summary-label">Remaining</div>
            <div className="budget-summary-value">
              {displayAmount(hasRemaining ? remaining : null, formatCurrency, currencySymbol)}
            </div>
            <div className="budget-summary-support">{remainingSupport}</div>
          </div>
        </div>

        <div className="budget-summary-metric budget-summary-metric--used">
          <div className="budget-summary-icon" aria-hidden="true">
            <PieChart size={18} strokeWidth={2} />
          </div>
          <div className="budget-summary-copy">
            <div className="budget-summary-label">Budget Used</div>
            <div className="budget-summary-value">{budgetUsedDisplay}</div>
            <div className="budget-summary-support">vs. total budget</div>
          </div>
        </div>
      </div>
    </section>
  );
}

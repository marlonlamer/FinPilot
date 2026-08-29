import React from "react";
import { Edit2, Trash2, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import { EXPENSE_CATEGORIES } from "../../../constants/expenseCategories";
import "./BudgetCategoryItem.css";

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

function getCategoryIcon(categoryName) {
  const category = EXPENSE_CATEGORIES.find(cat => cat.value === categoryName);
  return category ? category.icon : "📦";
}

function getStatusInfo(severity, remaining, formatCurrency, currencySymbol) {
  if (severity === "over") {
    return {
      icon: <AlertCircle size={16} strokeWidth={2} />,
      label: "Over budget",
      amount: displayAmount(Math.abs(remaining), formatCurrency, currencySymbol),
      className: "over-budget"
    };
  }
  
  if (severity === "warning") {
    return {
      icon: <AlertTriangle size={16} strokeWidth={2} />,
      label: "Remaining",
      amount: displayAmount(remaining, formatCurrency, currencySymbol),
      className: "warning"
    };
  }
  
  return {
    icon: <CheckCircle size={16} strokeWidth={2} />,
    label: "Remaining",
    amount: displayAmount(remaining, formatCurrency, currencySymbol),
    className: "healthy"
  };
}

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
  const categoryIcon = getCategoryIcon(category);
  const statusInfo = getStatusInfo(severity, remaining, formatCurrency, currencySymbol);
  const visualProgress = Math.min(progressPercent, 100);
  
  return (
    <div className="budget-category-card" aria-label={`Budget for ${category}`}>
      <div className="budget-category-header">
        <div className="budget-category-info">
          <span className="budget-category-icon" aria-hidden="true">{categoryIcon}</span>
          <div className="budget-category-details">
            <h3 className="budget-category-name">{category}</h3>
            <div className="budget-category-percentage">
              {Math.round(progressPercent)}%
            </div>
          </div>
        </div>
        {!readOnly && (
          <div className="budget-category-actions">
            <button 
              className="budget-category-action-btn" 
              onClick={onEdit}
              aria-label={`Edit ${category} budget`}
            >
              <Edit2 size={50} strokeWidth={2} />
            </button>
            <button 
              className="budget-category-action-btn budget-category-action-btn--delete" 
              onClick={onDelete}
              aria-label={`Delete ${category} budget`}
            >
              <Trash2 size={50} strokeWidth={2} />
            </button>
          </div>
        )}
      </div>

      <div className="budget-category-spending">
        <span className="budget-category-spent">
          {displayAmount(spent, formatCurrency, currencySymbol)} spent
        </span>
        <span className="budget-category-total">
          of {displayAmount(budget, formatCurrency, currencySymbol)}
        </span>
      </div>

      <div className="budget-category-progress">
        <div className="budget-category-progress-track">
          <div 
            className={`budget-category-progress-fill budget-category-progress-fill--${severity}`}
            style={{ width: `${visualProgress}%` }}
            role="progressbar"
            aria-valuenow={Math.round(progressPercent)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${Math.round(progressPercent)}% of budget used`}
          />
        </div>
      </div>

      <div className={`budget-category-status budget-category-status--${statusInfo.className}`}>
        <div className="budget-category-status-icon" aria-hidden="true">
          {statusInfo.icon}
        </div>
        <div className="budget-category-status-text">
          <span className="budget-category-status-label">{statusInfo.label}</span>
          <span className="budget-category-status-amount">{statusInfo.amount}</span>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import "./BudgetCategoryItem.css";

export default function BudgetCategoryList({ hasItems, children, onAddBudget = () => {} }) {
  return (
    <div className="budget-category-list-section">
      <div className="budget-category-list-header">
        <h2 className="budget-category-list-title">Category Budgets</h2>
      </div>
      {hasItems ? (
        <div className="budget-grid">{children}</div>
      ) : (
        <div className="budget-category-empty">
          <div className="budget-category-empty-icon">📊</div>
          <h3 className="budget-category-empty-title">No category budgets yet</h3>
          <p className="budget-category-empty-message">
            Add category budgets to see where your monthly budget is going.
          </p>
          <button 
            className="budget-category-empty-cta"
            onClick={onAddBudget}
          >
            + Add Budget
          </button>
        </div>
      )}
    </div>
  );
}
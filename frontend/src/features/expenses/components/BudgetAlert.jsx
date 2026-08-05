import React from "react";

export default function BudgetAlert({ overBudgetCategories }) {
  return (
    <div className="budget-alert">
      <strong>Budget Alert:</strong> You've exceeded budgets for {overBudgetCategories.map(c => c.category).join(", ")}
    </div>
  );
}

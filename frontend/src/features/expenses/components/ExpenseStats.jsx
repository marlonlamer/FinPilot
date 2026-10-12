import React from "react";
import { BarChart3, TrendingDown, TrendingUp } from "lucide-react";

export default function ExpenseStats({ monthlyDisplay, averageExpenseDisplay, comparisonText, comparisonDirection }) {
  const ComparisonIcon = comparisonDirection === "down" ? TrendingDown : TrendingUp;

  return (
    <div className="expense-stats">
      <div className="expense-stat-card">
        <div className="expense-stat-icon expense-stat-icon--month" aria-hidden="true">
          <ComparisonIcon size={16} strokeWidth={2} />
        </div>
        <div className="expense-stat-content">
          <div className="expense-stat-label">This Month</div>
          <div className="expense-stat-value">{monthlyDisplay}</div>
          <div className={`expense-stat-support${comparisonDirection ? ` expense-stat-support--${comparisonDirection}` : ""}`}>
            {comparisonText}
          </div>
        </div>
      </div>
      <div className="expense-stat-card">
        <div className="expense-stat-icon expense-stat-icon--average" aria-hidden="true">
          <BarChart3 size={16} strokeWidth={2} />
        </div>
        <div className="expense-stat-content">
          <div className="expense-stat-label">Average Expense</div>
          <div className="expense-stat-value">{averageExpenseDisplay}</div>
          <div className="expense-stat-support">per transaction</div>
        </div>
      </div>
    </div>
  );
}

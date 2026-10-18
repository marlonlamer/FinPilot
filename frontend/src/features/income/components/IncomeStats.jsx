import React from "react";
import { TrendingUp, BarChart3 } from "lucide-react";
import "./IncomeStats.css";

export default function IncomeStats({
  monthlyDisplay,
  averageIncomeDisplay,
  primaryLabel = "This Month",
  primarySupportText = "No previous data",
  comparisonDirection
}) {
  return (
    <div className="income-stats">
      <div className="income-stat-card income-stat-card--this-month">
        <div className="income-stat-icon" aria-hidden="true">
          <TrendingUp size={16} strokeWidth={2} />
        </div>
        <div className="income-stat-content">
          <div className="income-stat-label">{primaryLabel}</div>
          <div className="income-stat-value income-stat-value--income">{monthlyDisplay}</div>
          <div
            className={`income-stat-support${comparisonDirection ? ` income-stat-support--${comparisonDirection}` : ""}`}
            aria-live="polite"
          >
            {primarySupportText}
          </div>
        </div>
      </div>

      <div className="income-stat-card income-stat-card--average">
        <div className="income-stat-icon" aria-hidden="true">
          <BarChart3 size={16} strokeWidth={2} />
        </div>
        <div className="income-stat-content">
          <div className="income-stat-label">Average Income</div>
          <div className="income-stat-value income-stat-value--income">{averageIncomeDisplay}</div>
          <div className="income-stat-support">per transaction</div>
        </div>
      </div>

    </div>
  );
}

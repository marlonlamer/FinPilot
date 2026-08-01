import React from "react";

export default function IncomeStats({ monthlyDisplay, lastMonthDisplay, recurringCount }) {
  return (
    <div className="stats-row">
      <div className="stat-card">
        <div className="stat-label">This Month</div>
        <div className="stat-value">{monthlyDisplay}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Last Month</div>
        <div className="stat-value">{lastMonthDisplay}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Recurring Incomes</div>
        <div className="stat-value">{recurringCount}</div>
      </div>
    </div>
  );
}

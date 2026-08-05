import React from "react";

export default function ExpenseStats({ monthlyDisplay, lastMonthDisplay }) {
  return (
    <div className="stats-row">
      <div className="small-stat-card">
        <div className="stat-label">This Month</div>
        <div className="stat-value">{monthlyDisplay}</div>
      </div>
      <div className="small-stat-card">
        <div className="stat-label">Last Month</div>
        <div className="stat-value">{lastMonthDisplay}</div>
      </div>
    </div>
  );
}

import React from "react";
import { TrendingUp, BarChart3, Users } from "lucide-react";
import "./IncomeStats.css";

export default function IncomeStats({
  monthlyDisplay,
  averageIncomeDisplay,
  incomeSourcesCount,
  monthOverMonthChange
}) {
  const changePercent = monthOverMonthChange !== null ? Math.abs(monthOverMonthChange).toFixed(1) : null;
  const changeDirection = monthOverMonthChange > 0 ? "↑" : monthOverMonthChange < 0 ? "↓" : "";

  return (
    <div className="income-stats">
      <div className="income-stat-card income-stat-card--this-month">
        <div className="income-stat-icon" aria-hidden="true">
          <TrendingUp size={16} strokeWidth={2} />
        </div>
        <div className="income-stat-content">
          <div className="income-stat-label">This Month</div>
          <div className="income-stat-value">{monthlyDisplay}</div>
          <div className="income-stat-support">
            {monthOverMonthChange !== null ? (
              <span className={monthOverMonthChange >= 0 ? "income-stat-trend--positive" : "income-stat-trend--negative"}>
                {changeDirection} {changePercent}% vs last month
              </span>
            ) : (
              "No previous data"
            )}
          </div>
        </div>
      </div>

      <div className="income-stat-card income-stat-card--average">
        <div className="income-stat-icon" aria-hidden="true">
          <BarChart3 size={16} strokeWidth={2} />
        </div>
        <div className="income-stat-content">
          <div className="income-stat-label">Average Income</div>
          <div className="income-stat-value">{averageIncomeDisplay}</div>
          <div className="income-stat-support">per transaction</div>
        </div>
      </div>

      <div className="income-stat-card income-stat-card--sources">
        <div className="income-stat-icon" aria-hidden="true">
          <Users size={16} strokeWidth={2} />
        </div>
        <div className="income-stat-content">
          <div className="income-stat-label">Income Sources</div>
          <div className="income-stat-value">{incomeSourcesCount}</div>
          <div className="income-stat-support">active sources</div>
        </div>
      </div>
    </div>
  );
}

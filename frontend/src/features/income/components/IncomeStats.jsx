import React from "react";
import { TrendingUp, Calendar, Repeat } from "lucide-react";
import "./IncomeStats.css";

export default function IncomeStats({ monthlyDisplay, lastMonthDisplay, recurringDisplay, recurringCount }) {
  return (
    <div className="income-stats">
      <div className="income-stat-card income-stat-card--this-month">
        <div className="income-stat-icon" aria-hidden="true">
          <TrendingUp size={18} strokeWidth={2} />
        </div>
        <div className="income-stat-content">
          <div className="income-stat-label">This Month</div>
          <div className="income-stat-value">{monthlyDisplay}</div>
          <div className="income-stat-support">Current period</div>
        </div>
      </div>
      
      <div className="income-stat-card income-stat-card--last-month">
        <div className="income-stat-icon" aria-hidden="true">
          <Calendar size={18} strokeWidth={2} />
        </div>
        <div className="income-stat-content">
          <div className="income-stat-label">Last Month</div>
          <div className="income-stat-value">{lastMonthDisplay}</div>
          <div className="income-stat-support">Previous period</div>
        </div>
      </div>
      
      <div className="income-stat-card income-stat-card--recurring">
        <div className="income-stat-icon" aria-hidden="true">
          <Repeat size={18} strokeWidth={2} />
        </div>
        <div className="income-stat-content">
          <div className="income-stat-label">Recurring Income</div>
          <div className="income-stat-value">{recurringDisplay}</div>
          <div className="income-stat-support">{recurringCount} active source{recurringCount !== 1 ? 's' : ''}</div>
        </div>
      </div>
    </div>
  );
}

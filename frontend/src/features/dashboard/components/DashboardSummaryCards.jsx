export default function DashboardSummaryCards({
  availableBalanceDisplay,
  totalSavingsDisplay,
  monthlyIncomeDisplay,
  monthlyExpensesDisplay,
  totalNetWorthDisplay,
}) {
  return (
    <div className="dashboard-stats">
      <div className="stat-card">
        <div className="stat-label">Available Balance</div>
        <div className="stat-value">{availableBalanceDisplay}</div>
        <div className="stat-sub" />
      </div>
      <div className="stat-card">
        <div className="stat-label">Total Savings</div>
        <div className="stat-value">{totalSavingsDisplay}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Monthly Income</div>
        <div className="stat-value">{monthlyIncomeDisplay}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Monthly Expenses</div>
        <div className="stat-value">{monthlyExpensesDisplay}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Total Net Worth</div>
        <div className="stat-value">{totalNetWorthDisplay}</div>
      </div>
    </div>
  );
}

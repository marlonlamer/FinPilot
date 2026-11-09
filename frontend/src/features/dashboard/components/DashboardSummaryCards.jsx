export default function DashboardSummaryCards({
  availableBalanceDisplay,
  totalSavingsDisplay,
  monthlyIncomeDisplay,
  monthlyExpensesDisplay,
  totalNetWorthDisplay,
}) {
  return (
    <section className="dashboard-stats" aria-label="Financial overview">
      <article className="stat-card stat-card--balance">
        <span className="stat-label">Available Balance</span>
        <strong className="stat-value">{availableBalanceDisplay}</strong>
      </article>
      <article className="stat-card stat-card--savings">
        <span className="stat-label">Total Savings</span>
        <strong className="stat-value">{totalSavingsDisplay}</strong>
      </article>
      <article className="stat-card stat-card--income">
        <span className="stat-label">Monthly Income</span>
        <strong className="stat-value">{monthlyIncomeDisplay}</strong>
      </article>
      <article className="stat-card stat-card--expenses">
        <span className="stat-label">Monthly Expenses</span>
        <strong className="stat-value">{monthlyExpensesDisplay}</strong>
      </article>
      <article className="stat-card stat-card--net-worth">
        <span className="stat-label">Total Net Worth</span>
        <strong className="stat-value">{totalNetWorthDisplay}</strong>
      </article>
    </section>
  );
}

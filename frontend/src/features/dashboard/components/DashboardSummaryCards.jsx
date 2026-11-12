import { Landmark, PiggyBank, TrendingDown, TrendingUp, Wallet } from "lucide-react";

export default function DashboardSummaryCards({
  availableBalanceDisplay,
  totalSavingsDisplay,
  monthlyIncomeDisplay,
  monthlyExpensesDisplay,
  totalNetWorthDisplay,
  savingsHistoryStatus,
}) {
  return (
    <section className="dashboard-stats" aria-label="Financial overview">
      <article className="stat-card stat-card--balance">
        <div className="stat-heading">
          <span className="stat-label">Available Balance</span>
          <span className="stat-icon stat-icon--balance" aria-hidden="true"><Wallet size={17} strokeWidth={1.9} /></span>
        </div>
        <strong className="stat-value">{availableBalanceDisplay}</strong>
        <span className="stat-subtitle">Your current available funds</span>
      </article>
      <article className="stat-card stat-card--savings">
        <div className="stat-heading">
          <span className="stat-label">Savings This Month</span>
          <span className="stat-icon stat-icon--savings" aria-hidden="true"><PiggyBank size={17} strokeWidth={1.9} /></span>
        </div>
        <strong className="stat-value">{totalSavingsDisplay}</strong>
        <span className="stat-subtitle">
          {savingsHistoryStatus === "loading"
            ? "Loading savings activity"
            : savingsHistoryStatus === "loaded"
              ? "Net savings contributions this month"
              : "Savings activity unavailable"}
        </span>
      </article>
      <article className="stat-card stat-card--income">
        <div className="stat-heading">
          <span className="stat-label">Income This Month</span>
          <span className="stat-icon stat-icon--income" aria-hidden="true"><TrendingUp size={17} strokeWidth={1.9} /></span>
        </div>
        <strong className="stat-value">{monthlyIncomeDisplay}</strong>
        <span className="stat-subtitle">Total money received this month</span>
      </article>
      <article className="stat-card stat-card--expenses">
        <div className="stat-heading">
          <span className="stat-label">Expenses This Month</span>
          <span className="stat-icon stat-icon--expenses" aria-hidden="true"><TrendingDown size={17} strokeWidth={1.9} /></span>
        </div>
        <strong className="stat-value">{monthlyExpensesDisplay}</strong>
        <span className="stat-subtitle">Total money spent this month</span>
      </article>
      <article className="stat-card stat-card--net-worth">
        <div className="stat-heading">
          <span className="stat-label">Net Worth This Month</span>
          <span className="stat-icon stat-icon--net-worth" aria-hidden="true"><Landmark size={17} strokeWidth={1.9} /></span>
        </div>
        <strong className="stat-value">{totalNetWorthDisplay}</strong>
        <span className="stat-subtitle">Income less expenses; savings transfers excluded</span>
      </article>
    </section>
  );
}

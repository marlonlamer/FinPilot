export default function SavingsSummaryPanel({ totalDepositsDisplay, totalWithdrawalsDisplay, netSavingsDisplay }) {
  return (
    <div className="savings-summary-panel">
      <h3>Summary</h3>
      <div className="savings-summary-items">
        <div className="savings-summary-item">
          <div className="savings-summary-label">Total Deposits</div>
          <div className="savings-summary-value">{totalDepositsDisplay}</div>
        </div>
        <div className="savings-summary-item">
          <div className="savings-summary-label">Total Withdrawals</div>
          <div className="savings-summary-value">{totalWithdrawalsDisplay}</div>
        </div>
        <div className="savings-summary-item">
          <div className="savings-summary-label">Net Savings</div>
          <div className="savings-summary-value">{netSavingsDisplay}</div>
        </div>
      </div>
    </div>
  );
}

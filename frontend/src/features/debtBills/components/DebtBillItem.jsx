import DebtStatusBadge from "./DebtStatusBadge";

export default function DebtBillItem({ name, debtType, amountDue, remainingBalance, nextPaymentDate, status, repaymentPercentage }) {
  return (
    <div className="debt-bill-item-card">
      <div className="debt-bill-item-row">
        <div>
          <div className="debt-bill-item-title">{name}</div>
          <div className="debt-bill-item-subtitle">{debtType}</div>
        </div>
        <div className="debt-bill-item-amount">{amountDue}</div>
      </div>

      <div className="debt-bill-item-details">
        <span>Remaining {remainingBalance}</span>
        <span>Next payment {nextPaymentDate}</span>
      </div>

      <div className="debt-bill-item-footer">
        <DebtStatusBadge status={status} />
        <div className="debt-bill-progress">
          <div className="debt-bill-progress-bar">
            <div className="debt-bill-progress-fill" style={{ width: repaymentPercentage }} />
          </div>
          <span>{repaymentPercentage} repaid</span>
        </div>
      </div>

      <div className="debt-bill-item-actions">
        <button type="button" className="debt-action-button">Pay</button>
        <button type="button" className="debt-action-button">Edit</button>
        <button type="button" className="debt-action-button">Details</button>
      </div>
    </div>
  );
}

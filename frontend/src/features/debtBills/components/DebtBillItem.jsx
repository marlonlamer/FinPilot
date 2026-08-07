export default function DebtBillItem({ title, type, amount, balance, dueDate, status, progress }) {
  return (
    <div className="debt-bill-item-card">
      <div className="debt-bill-item-row">
        <div>
          <div className="debt-bill-item-title">{title}</div>
          <div className="debt-bill-item-subtitle">{type}</div>
        </div>
        <div className="debt-bill-item-amount">{amount}</div>
      </div>

      <div className="debt-bill-item-details">
        <span>Remaining {balance}</span>
        <span>Due {dueDate}</span>
      </div>

      <div className="debt-bill-item-footer">
        <div className={`debt-bill-status debt-bill-status-${status.toLowerCase().replace(/\s/g, "-")}`}>{status}</div>
        <div className="debt-bill-progress">
          <div className="debt-bill-progress-bar">
            <div className="debt-bill-progress-fill" style={{ width: progress }} />
          </div>
          <span>{progress} repaid</span>
        </div>
      </div>
    </div>
  );
}

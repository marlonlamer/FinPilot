const statusStyles = {
  active: { label: "Active", className: "bill-status-active" },
  upcoming: { label: "Upcoming", className: "bill-status-upcoming" },
  paused: { label: "Paused", className: "bill-status-paused" },
  cancelled: { label: "Cancelled", className: "bill-status-cancelled" },
  overdue: { label: "Overdue", className: "bill-status-overdue" },
};

export default function BillCard({
  name,
  category,
  amount,
  billingCycle,
  nextBillingDate,
  paymentMethod,
  status,
  autoPay,
}) {
  const normalizedStatus = status?.toLowerCase();
  const statusMeta = statusStyles[normalizedStatus] || {
    label: status || "Unknown",
    className: "bill-status-default",
  };

  return (
    <div className="bill-card">
      <div className="bill-card-header">
        <div>
          <div className="bill-card-title">{name}</div>
          <div className="bill-card-category">{category}</div>
        </div>
        <div className="bill-card-amount">{amount}</div>
      </div>

      <div className="bill-card-body">
        <div className="bill-card-field">
          <span className="bill-card-label">Billing</span>
          <span>{billingCycle}</span>
        </div>
        <div className="bill-card-field">
          <span className="bill-card-label">Next billing</span>
          <span>{nextBillingDate}</span>
        </div>
        <div className="bill-card-field">
          <span className="bill-card-label">Payment</span>
          <span>{paymentMethod}</span>
        </div>
      </div>

      <div className="bill-card-footer">
        <span className={`bill-status-pill ${statusMeta.className}`}>{statusMeta.label}</span>
        <span className="bill-card-autopay">{autoPay ? "Auto-pay" : "Manual"}</span>
      </div>
    </div>
  );
}

export default function DebtStatusBadge({ status }) {
  const normalized = status.toLowerCase().replace(/\s+/g, "-");
  return (
    <span className={`debt-bill-status debt-bill-status-${normalized}`}>
      {status}
    </span>
  );
}

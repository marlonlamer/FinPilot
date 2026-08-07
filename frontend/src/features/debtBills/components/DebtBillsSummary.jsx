export default function DebtBillsSummary({ cards }) {
  return (
    <div className="debt-bills-summary-grid">
      {cards.map((item) => (
        <div key={item.label} className="debt-summary-card">
          <div className="debt-summary-label">{item.label}</div>
          <div className="debt-summary-value">{item.value}</div>
          <div className="debt-summary-note">{item.note}</div>
        </div>
      ))}
    </div>
  );
}

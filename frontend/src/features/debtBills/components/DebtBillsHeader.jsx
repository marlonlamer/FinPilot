export default function DebtBillsHeader({ title, subtitle }) {
  return (
    <div className="debt-bills-header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="debt-bills-header-actions">
        <button type="button" className="dbb-btn dbb-btn-secondary">Import</button>
        <button type="button" className="dbb-btn dbb-btn-primary">Add debt</button>
      </div>
    </div>
  );
}

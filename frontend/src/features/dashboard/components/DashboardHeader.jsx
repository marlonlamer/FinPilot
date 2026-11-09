import { Plus } from "lucide-react";

export default function DashboardHeader({
  displayName,
  greeting,
  formattedDate,
  selectedPeriodLabel,
  onQuickAdd
}) {
  return (
    <header className="dashboard-header">
      <div className="dashboard-header-copy">
        <div className="dashboard-greeting">
          <h1>{greeting}, {displayName} <span className="wave" aria-hidden="true">👋</span></h1>
          <div className="dashboard-date">{formattedDate}</div>
        </div>
        <p className="dashboard-subtext">
          Your financial overview for <strong>{selectedPeriodLabel}</strong>.
        </p>
      </div>
      <button type="button" className="dashboard-quick-add" onClick={onQuickAdd}>
        <Plus size={18} aria-hidden="true" />
        Quick Add Transaction
      </button>
    </header>
  );
}

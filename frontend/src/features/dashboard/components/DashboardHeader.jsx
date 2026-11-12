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
        <h1 className="dashboard-title">Dashboard</h1>
        <div className="dashboard-meta-row">
          <p className="dashboard-greeting">
            {greeting}, {displayName} <span className="wave" aria-hidden="true">👋</span>
          </p>
          <span className="dashboard-meta-separator" aria-hidden="true">·</span>
          <time className="dashboard-date">{formattedDate}</time>
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

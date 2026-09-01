export default function SavingsControls({
  activeFilter,
  onFilterChange,
  onAddGoal,
  sortValue,
  onSortChange,
  viewMode,
  onViewModeChange
}) {
  const filters = [
    { key: "all", label: "All Goals" },
    { key: "in-progress", label: "In Progress" },
    { key: "completed", label: "Completed" }
  ];

  return (
    <div className="savings-shell-toolbar">
      <div className="savings-pill-group">
        {filters.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => onFilterChange(filter.key)}
            className={"savings-pill" + (activeFilter === filter.key ? " active" : "")}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="savings-toolbar-actions">
        <label className="savings-toolbar-field">
          <span>Sort</span>
          <select value={sortValue} onChange={(event) => onSortChange(event.target.value)}>
            <option value="newest">Newest</option>
            <option value="progress">Progress</option>
            <option value="target">Target Amount</option>
          </select>
        </label>

        <div className="savings-view-toggle" aria-label="View mode toggle">
          <button
            type="button"
            className={viewMode === "list" ? "active" : ""}
            onClick={() => onViewModeChange("list")}
          >
            List
          </button>
          <button
            type="button"
            className={viewMode === "grid" ? "active" : ""}
            onClick={() => onViewModeChange("grid")}
          >
            Grid
          </button>
        </div>

        <button type="button" className="savings-add-button" onClick={onAddGoal}>
          + New Savings Goal
        </button>
      </div>
    </div>
  );
} 

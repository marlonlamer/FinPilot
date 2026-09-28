export default function TransactionsSearchBar({
  value,
  onChange,
  flowValue,
  onFlowChange,
  hasActiveFilters,
  onReset
}) {
  return (
    <div className="transactions-toolbar">
      <div className="transactions-flowFilter" role="group" aria-label="Transaction flow">
        {[
          { value: "all", label: "All" },
          { value: "inflow", label: "Inflow" },
          { value: "outflow", label: "Outflow" }
        ].map(option => (
          <button
            key={option.value}
            type="button"
            className={`transactions-flowButton${flowValue === option.value ? " is-active" : ""}`}
            aria-pressed={flowValue === option.value}
            onClick={() => onFlowChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <label className="transactions-field transactions-field--search">
        <span className="transactions-visuallyHidden">Search</span>
        <span className="transactions-searchInput">
          <svg className="transactions-searchIcon" viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="8.75" cy="8.75" r="5.75" />
            <path d="m13 13 4 4" />
          </svg>
          <input
            className="transactions-input"
            placeholder="Search transactions, notes, category..."
            value={value}
            onChange={onChange}
          />
        </span>
      </label>

      {hasActiveFilters ? (
        <button type="button" className="transactions-resetButton" onClick={onReset}>
          Clear filters
        </button>
      ) : null}
    </div>
  );
}

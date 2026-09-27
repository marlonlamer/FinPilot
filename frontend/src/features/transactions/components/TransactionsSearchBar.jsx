export default function TransactionsSearchBar({
  value,
  onChange,
  hasActiveFilters,
  onReset
}) {
  return (
    <div className="transactions-toolbar">
      <label className="transactions-field transactions-field--search">
        <span>Search</span>
        <input
          className="transactions-input"
          placeholder="Search transactions, notes, category..."
          value={value}
          onChange={onChange}
        />
      </label>

      {hasActiveFilters ? (
        <button type="button" className="transactions-resetButton" onClick={onReset}>
          Clear filters
        </button>
      ) : null}
    </div>
  );
}

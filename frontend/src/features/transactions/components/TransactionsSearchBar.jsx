export default function TransactionsSearchBar({
  value,
  onChange,
  monthLabel,
  typeValue,
  onTypeChange,
  categoryValue,
  onCategoryChange,
  categoryOptions,
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

      <div className="transactions-field transactions-field--month" aria-label="Active month">
        <span>Month</span>
        <div className="transactions-monthValue">{monthLabel}</div>
      </div>

      <label className="transactions-field">
        <span>Type</span>
        <select className="transactions-select" value={typeValue} onChange={onTypeChange}>
          <option value="all">All</option>
          <option value="income">Income</option>
          <option value="expense">Expenses</option>
          <option value="savings">Savings</option>
        </select>
      </label>

      <label className="transactions-field">
        <span>Category</span>
        <select className="transactions-select" value={categoryValue} onChange={onCategoryChange}>
          <option value="all">All Categories</option>
          {categoryOptions.map(category => (
            <option key={category.value} value={category.value}>{category.label}</option>
          ))}
        </select>
      </label>

      {hasActiveFilters ? (
        <button type="button" className="transactions-resetButton" onClick={onReset}>
          Clear filters
        </button>
      ) : null}
    </div>
  );
}

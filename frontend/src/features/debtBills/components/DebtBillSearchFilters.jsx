export default function DebtBillSearchFilters({
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
  sortBy,
  onSortChange,
  section,
}) {
  const sectionLabel = section === "debt" ? "Debt" : "Bills";

  return (
    <div className="debt-bill-search-filters">
      <div className="debt-search-input">
        <input
          type="text"
          placeholder={`Search ${sectionLabel} name, merchant, or account...`}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="debt-filter-controls">
        <label>
          Status
          <select value={filters.status} onChange={(e) => onFilterChange("status", e.target.value)}>
            <option>All</option>
            <option>Active</option>
            <option>Upcoming</option>
            <option>Paused</option>
            <option>Cancelled</option>
            <option>Overdue</option>
            <option>Due Soon</option>
            <option>On Track</option>
          </select>
        </label>

        {section === "debt" ? (
          <>
            <label>
              Debt type
              <select value={filters.debtType} onChange={(e) => onFilterChange("debtType", e.target.value)}>
                <option>All</option>
                <option>Loan</option>
                <option>Card</option>
                <option>Home Loan</option>
              </select>
            </label>
            <label>
              Timeframe
              <select value={filters.timeframe} onChange={(e) => onFilterChange("timeframe", e.target.value)}>
                <option>All</option>
                <option>This week</option>
                <option>This month</option>
                <option>Past due</option>
              </select>
            </label>
          </>
        ) : (
          <>
            <label>
              Category
              <select value={filters.category} onChange={(e) => onFilterChange("category", e.target.value)}>
                <option>All</option>
                <option>Electricity</option>
                <option>Entertainment</option>
                <option>Internet</option>
                <option>Health</option>
                <option>Mobile</option>
              </select>
            </label>
            <label>
              Billing frequency
              <select value={filters.billingFrequency} onChange={(e) => onFilterChange("billingFrequency", e.target.value)}>
                <option>All</option>
                <option>Monthly</option>
                <option>Weekly</option>
                <option>Yearly</option>
              </select>
            </label>
          </>
        )}

        <label>
          Sort by
          <select value={sortBy} onChange={(e) => onSortChange(e.target.value)}>
            <option>Due date</option>
            <option>Amount</option>
            <option>Oldest</option>
          </select>
        </label>
      </div>
    </div>
  );
}

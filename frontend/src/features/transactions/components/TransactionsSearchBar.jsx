export default function TransactionsSearchBar({
  value,
  onChange,
  monthValue,
  onMonthChange,
  typeValue,
  onTypeChange,
  categoryValue,
  onCategoryChange
}) {
  const monthOptions = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

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

      <label className="transactions-field">
        <span>Month</span>
        <select className="transactions-select" value={monthValue} onChange={onMonthChange}>
          {monthOptions.map((month, index) => (
            <option key={month} value={String(index)}>{month}</option>
          ))}
        </select>
      </label>

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
          <option value="salary">Salary</option>
          <option value="food">Food</option>
          <option value="transport">Transport</option>
          <option value="shopping">Shopping</option>
          <option value="savings">Savings</option>
        </select>
      </label>
    </div>
  );
}

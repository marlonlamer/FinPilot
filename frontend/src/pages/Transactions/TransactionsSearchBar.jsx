export default function TransactionsSearchBar({ value, onChange }) {
  return (
    <>
      <h2>All Transactions</h2>

      <div className="transactions-controls">
        <div className="transactions-search">
          <input className="transactions-input" placeholder="Search amounts, notes, category..." value={value} onChange={onChange} />
        </div>
      </div>
    </>
  );
}

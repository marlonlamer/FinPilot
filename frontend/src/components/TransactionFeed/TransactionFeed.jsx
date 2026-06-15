import React, { useMemo } from 'react';
import TransactionItem from '../TransactionItem/TransactionItem';
import './TransactionFeed.css';

export default function TransactionFeed({ transactions = [], currencySymbol = '₱', formatCurrency }) {
  const sorted = useMemo(() => (transactions || []).slice().sort((a,b) => {
    const ad = new Date(a.date || 0).getTime();
    const bd = new Date(b.date || 0).getTime();
    return bd - ad;
  }), [transactions]);

  const groups = useMemo(() => {
    const map = {};
    const now = new Date();
    const yesterday = new Date(); yesterday.setDate(now.getDate() - 1);
    const labelFor = (d) => {
      if (!d) return 'Unknown';
      if (d.toDateString() === now.toDateString()) return 'Today';
      if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    };
    sorted.forEach(item => {
      const d = item.date ? new Date(item.date) : null;
      const label = labelFor(d);
      if (!map[label]) map[label] = [];
      map[label].push(item);
    });
    return map;
  }, [sorted]);

  if (!sorted || sorted.length === 0) return <div className="transactions-empty">No transactions</div>;

  return (
    <div className="transaction-feed">
      {Object.entries(groups).map(([label, items]) => (
        <div key={label} className="transaction-group">
          <div className="transaction-group-label">{label}</div>
          <ul className="transaction-group-list">
            {items.map(it => (
              <li key={`${it.type || 't'}-${it.id}`}>
                <TransactionItem item={it} currencySymbol={currencySymbol} formatCurrency={formatCurrency} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

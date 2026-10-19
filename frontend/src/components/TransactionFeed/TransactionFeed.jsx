import React, { useMemo } from 'react';
import TransactionItem from '../TransactionItem/TransactionItem';
import './TransactionFeed.css';

export default function TransactionFeed({
  transactions = [],
  currencySymbol = '₱',
  formatCurrency,
  deleteExpense,
  deleteIncome,
  openEditExpense,
  openEditIncome,
  onViewTransaction,
  onEditTransaction,
  onDeleteTransaction
}) {
  const sorted = useMemo(() => (transactions || []).slice().sort((a,b) => {
    const ad = new Date(a.date || 0).getTime();
    const bd = new Date(b.date || 0).getTime();
    return bd - ad;
  }), [transactions]);

  const groups = useMemo(() => {
    const map = {};
    const now = new Date();
    const yesterday = new Date(); yesterday.setDate(now.getDate() - 1);
    const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const labelFor = (d, isIncome) => {
      if (!d || Number.isNaN(d.getTime())) return 'Unknown';
      const incomeDateKey = isIncome ? d.toISOString().slice(0, 10) : null;
      const todayKey = isIncome ? dateKey(now) : now.toDateString();
      const yesterdayKey = isIncome ? dateKey(yesterday) : yesterday.toDateString();
      const itemKey = isIncome ? incomeDateKey : d.toDateString();
      const dateLabelOptions = { month: 'short', day: 'numeric', year: 'numeric' };
      const fullDateLabelOptions = { year: 'numeric', month: 'long', day: 'numeric' };
      if (isIncome) {
        dateLabelOptions.timeZone = 'UTC';
        fullDateLabelOptions.timeZone = 'UTC';
      }
      const dateLabel = d.toLocaleDateString(undefined, dateLabelOptions);
      if (itemKey === todayKey) return `Today • ${dateLabel}`;
      if (itemKey === yesterdayKey) return `Yesterday • ${dateLabel}`;
      return d.toLocaleDateString(undefined, fullDateLabelOptions);
    };
    sorted.forEach(item => {
      const d = item.date ? new Date(item.date) : null;
      const isIncome = String(item.type || '').toLowerCase().includes('income');
      const label = labelFor(d, isIncome);
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
                <TransactionItem
                  item={it}
                  currencySymbol={currencySymbol}
                  formatCurrency={formatCurrency}
                  deleteExpense={deleteExpense}
                  deleteIncome={deleteIncome}
                  openEditExpense={openEditExpense}
                  openEditIncome={openEditIncome}
                  onView={onViewTransaction}
                  onEdit={onEditTransaction}
                  onDelete={onDeleteTransaction}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

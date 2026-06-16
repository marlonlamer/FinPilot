import React from 'react';
import '../TransactionFeed/TransactionFeed.css';

export default function TransactionItem({ item, currencySymbol = '₱', formatCurrency }) {
  const getIcon = (category) => {
    if (!category) return '💳';
    const key = String(category).toLowerCase();
    if (key.includes('food') || key.includes('restaurant')) return '🍔';
    if (key.includes('salary') || key.includes('pay')) return '💼';
    if (key.includes('savings') || key.includes('deposit')) return '🏦';
    if (key.includes('withdraw') || key.includes('atm')) return '🏧';
    if (key.includes('transport')) return '🚗';
    if (key.includes('shopping')) return '🛍️';
    return '💳';
  };

  const date = item.date ? new Date(item.date) : null;
  const time = date ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';

  let typeLabel = 'Transaction';
  const t = String((item.type || '')).toLowerCase();
  if (t.includes('income')) typeLabel = 'Income';
  else if (t.includes('expense')) typeLabel = 'Expense';
  else if (t.includes('deposit') || (item.savingsId && Number(item.amount) > 0)) typeLabel = 'Deposit';
  else if (t.includes('withdraw') || (item.savingsId && Number(item.amount) < 0)) typeLabel = 'Withdraw';

  const displayName = item.category || item.source || item.goalName || `Savings ${item.savingsId || ''}`;

  const amountVal = Number(item.amount || 0);
  // Determine sign based on transaction type (not stored sign)
  const isPositiveByType = (() => {
    if (!t) return amountVal > 0;
    if (t.includes('income')) return true;
    if (t.includes('expense')) return false;
    if (t.includes('savings_deposit') || t.includes('deposit')) return true;
    if (t.includes('savings_withdraw') || t.includes('withdraw')) return false;
    return amountVal > 0;
  })();

  const amountDisplay = formatCurrency ? (isPositiveByType ? `+ ${formatCurrency(Math.abs(amountVal))}` : `- ${formatCurrency(Math.abs(amountVal))}`) : (isPositiveByType ? `+ ${currencySymbol}${Math.abs(amountVal).toFixed(2)}` : `- ${currencySymbol}${Math.abs(amountVal).toFixed(2)}`);

  let amountClass = 'amount-expense';
  if (t.includes('income')) amountClass = 'amount-income';
  else if (t.includes('savings_deposit') || t.includes('deposit')) amountClass = 'amount-deposit';
  else if (t.includes('savings_withdraw') || t.includes('withdraw')) amountClass = 'amount-withdraw';
  else if (t.includes('expense')) amountClass = 'amount-expense';

  return (
    <div className="transaction-item">
      <div className="transaction-left">
        <div className="category-icon">{getIcon(displayName)}</div>
        <div className="transaction-content">
          <div className="transaction-name">{displayName}</div>
          <div className="transaction-meta">{typeLabel} • {date ? `${date.toLocaleDateString()} • ${time}` : time}</div>
        </div>
      </div>
      <div className={"transaction-right " + amountClass}>{amountDisplay}</div>
    </div>
  );
}

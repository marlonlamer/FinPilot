import React from 'react';
import '../TransactionFeed/TransactionFeed.css';

export default function TransactionItem({
  item,
  currencySymbol = '₱',
  formatCurrency,
  onView,
  onEdit,
  onDelete,
  deleteExpense,
  deleteIncome,
  openEditExpense,
  openEditIncome
}) {
  const date = item.date ? new Date(item.date) : null;
  const formattedDate = date ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown date';
  const time = date ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';

  let typeLabel = 'Transaction';
  const t = String((item.type || '')).toLowerCase();
  if (t.includes('income')) typeLabel = 'Income';
  else if (t.includes('expense')) typeLabel = 'Expense';
  else if (t.includes('deposit') || (item.savingsId && Number(item.amount) > 0)) typeLabel = 'Add Savings';
  else if (t.includes('withdraw') || (item.savingsId && Number(item.amount) < 0)) typeLabel = 'Withdraw';

  const categoryText = item.category || item.source || item.goalName || 'General';
  const titleText = item.description || item.notes || item.category || item.source || item.goalName || 'Transaction';
  const accountText = item.source || item.account || item.paymentSource || item.method || 'Cash';

  const amountVal = Number(item.amount || 0);
  const isPositiveByType = (() => {
    if (!t) return amountVal > 0;
    if (t.includes('income')) return true;
    if (t.includes('expense')) return false;
    if (t.includes('savings_deposit') || t.includes('deposit')) return true;
    if (t.includes('savings_withdraw') || t.includes('withdraw')) return false;
    return amountVal > 0;
  })();

  const amountDisplay = formatCurrency
    ? (isPositiveByType ? `+${formatCurrency(Math.abs(amountVal))}` : `-${formatCurrency(Math.abs(amountVal))}`)
    : (isPositiveByType ? `+${currencySymbol}${Math.abs(amountVal).toFixed(2)}` : `-${currencySymbol}${Math.abs(amountVal).toFixed(2)}`);

  let amountClass = 'amount-expense';
  if (t.includes('income')) amountClass = 'amount-income';
  else if (t.includes('savings_deposit') || t.includes('deposit')) amountClass = 'amount-deposit';
  else if (t.includes('savings_withdraw') || t.includes('withdraw')) amountClass = 'amount-withdraw';
  else if (t.includes('expense')) amountClass = 'amount-expense';

  const isIncome = t.includes('income') || (t.includes('deposit') && !t.includes('withdraw')) || (item.savingsId && Number(item.amount) > 0);
  const isExpense = t.includes('expense') || (t.includes('withdraw') || (item.savingsId && Number(item.amount) < 0));
  const isSavings = t.includes('savings_') || t.includes('deposit') || t.includes('withdraw');

  const arrow = isIncome ? '↑' : isExpense ? '↓' : '•';

  const viewTransaction = () => {
    if (typeof onView === 'function') onView(item);
  };
  const editTransaction = () => {
    if (isSavings) return;
    if (typeof onEdit === 'function') {
      onEdit(item);
      return;
    }
    if (isIncome && typeof openEditIncome === 'function') openEditIncome(item);
    if (isExpense && typeof openEditExpense === 'function') openEditExpense(item);
  };
  const removeTransaction = () => {
    if (isSavings) return;
    if (typeof onDelete === 'function') {
      onDelete(item);
      return;
    }
    if (isIncome && typeof deleteIncome === 'function') deleteIncome(item.id);
    if (isExpense && typeof deleteExpense === 'function') deleteExpense(item.id);
  };

  return (
    <div className="transaction-item">
      <div className="transaction-left">
        <div className={`transaction-typeBadge ${isIncome ? 'income' : isExpense ? 'expense' : 'savings'}`}>
          {arrow}
        </div>

        <div className="transaction-content">
          <div className="transaction-headerRow">
            <div className="transaction-name">{titleText}</div>
            <div className={'transaction-right ' + amountClass}>{amountDisplay}</div>
          </div>

          <div className="transaction-metaLine">
            <span>{isIncome ? 'Income' : isExpense ? 'Expense' : typeLabel}</span>
            <span className="transaction-dot">•</span>
            <span>{categoryText}</span>
            <span className="transaction-dot">•</span>
            <span>{formattedDate}</span>
            {time ? <>
              <span className="transaction-dot">•</span>
              <span>{time}</span>
            </> : null}
          </div>

          <div className="transaction-accountRow">
            <span>{accountText}</span>
          </div>
        </div>
      </div>

      <div className="transaction-actions" aria-label="Transaction actions">
        <button type="button" className="transaction-actionButton" title="View" onClick={viewTransaction}>👁</button>
        <button type="button" className="transaction-actionButton" title="Edit" onClick={editTransaction} disabled={isSavings}>✎</button>
        <button type="button" className="transaction-actionButton" title="Delete" onClick={removeTransaction} disabled={isSavings}>🗑</button>
      </div>
    </div>
  );
}

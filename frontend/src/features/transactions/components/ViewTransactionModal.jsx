import React from "react";
import "./AddTransactionModal.css";

const isPositive = (value) => Number(value || 0) >= 0;

export default function ViewTransactionModal({ open, transaction, onClose, currencySymbol = "₱", formatCurrency }) {
  if (!open || !transaction) return null;

  const type = String(transaction.type || "").toLowerCase();
  const isExpense = type.includes("expense") || type.includes("withdraw") || Number(transaction.amount || 0) < 0;
  const isIncome = type.includes("income") || type.includes("deposit") || (!isExpense && Number(transaction.amount || 0) >= 0);
  const arrow = isIncome ? "↑" : "↓";
  const title = transaction.description || transaction.note || transaction.category || transaction.source || "Transaction";
  const typeLabel = isIncome ? "Income" : "Expense";
  const amountValue = Number(transaction.amount || 0);
  const formattedAmount = typeof formatCurrency === "function"
    ? formatCurrency(amountValue)
    : `${currencySymbol}${Math.abs(amountValue).toFixed(2)}`;

  const date = transaction.date ? new Date(transaction.date) : null;
  const dateLabel = date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : "—";
  const timeLabel = date && !Number.isNaN(date.getTime()) ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—";
  const sourceLabel = transaction.source || transaction.account || transaction.paymentSource || transaction.method || "—";
  const categoryLabel = transaction.category || "—";
  const merchantLabel = transaction.description || transaction.merchant || transaction.recipient || "—";
  const notesLabel = transaction.notes || "—";

  return (
    <div className="add-transaction-overlay" onMouseDown={onClose}>
      <div className="view-transaction-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="add-transaction-header view-header">
          <div>
            <p className="add-transaction-eyebrow">Transaction</p>
            <h2>{title}</h2>
          </div>
          <button type="button" className="add-transaction-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="view-transaction-body">
          <div className="view-transaction-summary">
            <div className={`transaction-typeBadge ${isIncome ? "income" : "expense"}`}>{arrow}</div>
            <div>
              <div className="view-transaction-name">{title}</div>
              <div className="view-transaction-type">{typeLabel}</div>
            </div>
          </div>

          <div className="view-transaction-grid">
            <div className="view-transaction-row">
              <span>Amount</span>
              <strong className={isIncome ? "amount-income" : "amount-expense"}>{isIncome ? "+" : "-"}{formattedAmount}</strong>
            </div>
            {categoryLabel !== "—" ? (
              <div className="view-transaction-row">
                <span>Category</span>
                <strong>{categoryLabel}</strong>
              </div>
            ) : null}
            {merchantLabel !== "—" ? (
              <div className="view-transaction-row">
                <span>{isIncome ? "Source / Payer" : "Merchant / Recipient"}</span>
                <strong>{merchantLabel}</strong>
              </div>
            ) : null}
            {sourceLabel !== "—" ? (
              <div className="view-transaction-row">
                <span>{isIncome ? "Destination / Account" : "Payment Source"}</span>
                <strong>{sourceLabel}</strong>
              </div>
            ) : null}
            <div className="view-transaction-row">
              <span>Date</span>
              <strong>{dateLabel}</strong>
            </div>
            <div className="view-transaction-row">
              <span>Time</span>
              <strong>{timeLabel}</strong>
            </div>
            {notesLabel !== "—" ? (
              <div className="view-transaction-row view-transaction-row--full">
                <span>Notes</span>
                <strong>{notesLabel}</strong>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

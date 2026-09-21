import React from "react";
import "./AddTransactionModal.css";

export default function ViewTransactionModal({
  open,
  transaction,
  onClose,
  currencySymbol = "₱",
  formatCurrency
}) {
  if (!open || !transaction) return null;

  const type = String(transaction.type || "").toLowerCase();
  const isExpense = type.includes("expense") || type.includes("withdraw") || Number(transaction.amount || 0) < 0;
  const isIncome = type.includes("income") || type.includes("deposit") || (!isExpense && Number(transaction.amount || 0) >= 0);
  const title = transaction.description || transaction.title || transaction.note || transaction.category || transaction.source || "Transaction";
  const typeLabel = isIncome ? "Income" : "Expense";
  const amountValue = Number(transaction.amount || 0);
  const formattedAmount = typeof formatCurrency === "function"
    ? formatCurrency(Math.abs(amountValue))
    : `${currencySymbol}${Math.abs(amountValue).toFixed(2)}`;

  const date = transaction.date ? new Date(transaction.date) : null;
  const validDate = date && !Number.isNaN(date.getTime());
  const dateLabel = validDate
    ? date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
    : "Not provided";
  const timeLabel = validDate
    ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : "Not provided";
  const accountLabel = isIncome
    ? transaction.destination || transaction.destinationAccount || transaction.account || "Not provided"
    : transaction.paymentSource || transaction.paymentSourceAccount || transaction.account || transaction.source || transaction.method || "Not provided";
  const categoryLabel = transaction.category || transaction.customCategory || transaction.title || "";
  const counterpartyLabel = isIncome
    ? transaction.payer || transaction.payerSource || transaction.description || ""
    : transaction.merchant || transaction.merchantRecipient || transaction.recipient || transaction.description || "";
  const notesLabel = transaction.notes || "";
  const rawTags = transaction.tags || transaction.tag;
  const tags = Array.isArray(rawTags)
    ? rawTags.filter(Boolean)
    : typeof rawTags === "string"
      ? rawTags.split(",").map((tag) => tag.trim()).filter(Boolean)
      : [];

  return (
    <div className="add-transaction-overlay" onMouseDown={onClose}>
      <div
        className="view-transaction-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-details-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="add-transaction-header view-header">
          <div>
            <h2 id="transaction-details-title">Transaction Details</h2>
          </div>
          <button type="button" className="add-transaction-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="view-transaction-body">
          <div className="view-transaction-summary">
            <div className={`transaction-typeBadge ${isIncome ? "income" : "expense"}`}>
              {isIncome ? "↑" : "↓"}
            </div>
            <div>
              <div className="view-transaction-name">{title}</div>
              <div className="view-transaction-type">{typeLabel}</div>
            </div>
          </div>

          {categoryLabel ? <span className="view-transaction-category">{categoryLabel}</span> : null}
          <div className={`view-transaction-amount ${isIncome ? "income" : "expense"}`}>
            {isIncome ? "+" : "-"}{formattedAmount}
          </div>

          <h3 className="view-transaction-sectionTitle">Transaction information</h3>
          <div className="view-transaction-grid">
            <div className="view-transaction-row">
              <span>{isIncome ? "Income Category" : "Expense Category"}</span>
              <strong>{categoryLabel || "Not provided"}</strong>
            </div>
            {counterpartyLabel ? (
              <div className="view-transaction-row">
                <span>{isIncome ? "Payer / Source" : "Merchant / Recipient"}</span>
                <strong>{counterpartyLabel}</strong>
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
            <div className="view-transaction-row">
              <span>{isIncome ? "Destination / Account" : "Payment Source / Account"}</span>
              <strong>{accountLabel}</strong>
            </div>
          </div>

          {tags.length > 0 ? (
            <>
              <h3 className="view-transaction-sectionTitle">Tags</h3>
              <div className="view-transaction-tags">
                {tags.map((tag) => <span className="view-transaction-tag" key={tag}>{tag}</span>)}
              </div>
            </>
          ) : null}

          {notesLabel ? (
            <>
              <h3 className="view-transaction-sectionTitle">Notes</h3>
              <p className="view-transaction-notes">{notesLabel}</p>
            </>
          ) : null}

          <div className="view-transaction-footer">
            <button type="button" className="view-transaction-done" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    </div>
  );
}

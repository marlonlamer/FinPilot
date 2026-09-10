import React, { useEffect, useState } from "react";
import "./TransferSourceModal.css";

const TRANSFER_SOURCES = [
  { id: "cash-wallet", label: "Cash Wallet", description: "Physical cash available to transfer" },
  { id: "bank-account", label: "Bank Account", description: "Transfer from a connected bank account" },
  { id: "e-wallet", label: "E-wallet", description: "Transfer from a digital wallet" }
];

export default function TransferSourceModal({
  open,
  title,
  initialValues = {},
  onCancel,
  onSubmit,
  isSubmitting = false,
  currencySymbol = "₱"
}) {
  const [amount, setAmount] = useState(initialValues.amount || "");
  const [sourceId, setSourceId] = useState(initialValues.sourceId || "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setAmount(initialValues.amount || "");
      setSourceId(initialValues.sourceId || "");
      setError("");
    }
  }, [open, initialValues.amount, initialValues.sourceId]);

  if (!open) return null;

  const handleSubmit = () => {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }

    const source = TRANSFER_SOURCES.find(item => item.id === sourceId);
    if (!source) {
      setError("Select a transfer source.");
      return;
    }

    setError("");
    onSubmit({
      amount: parsedAmount,
      sourceId: source.id,
      sourceLabel: source.label
    });
  };

  return (
    <div className="transfer-modal-overlay" role="presentation" onMouseDown={onCancel}>
      <div className="transfer-modal" role="dialog" aria-modal="true" aria-labelledby="transfer-modal-title" onMouseDown={event => event.stopPropagation()}>
        <div className="transfer-modal-header">
          <div>
            <span className="transfer-modal-eyebrow">Savings contribution</span>
            <h2 id="transfer-modal-title">{title}</h2>
          </div>
          <button type="button" className="transfer-modal-close" onClick={onCancel} aria-label="Close Add Savings modal">×</button>
        </div>

        <div className="transfer-modal-body">
          <label className="transfer-modal-label" htmlFor="savings-transfer-amount">Amount</label>
          <div className="transfer-amount-field">
            <span aria-hidden="true">{currencySymbol}</span>
            <input
              id="savings-transfer-amount"
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              value={amount}
              onChange={event => {
                setAmount(event.target.value);
                if (error) setError("");
              }}
              placeholder="0.00"
              autoFocus
            />
          </div>

          <div className="transfer-source-heading">
            <div>
              <label className="transfer-modal-label">Transfer From</label>
              <p>Choose where this contribution will come from.</p>
            </div>
          </div>

          <div className="transfer-source-list" role="radiogroup" aria-label="Transfer source">
            {TRANSFER_SOURCES.map(source => {
              const selected = source.id === sourceId;
              return (
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`transfer-source-option${selected ? " is-selected" : ""}`}
                  key={source.id}
                  onClick={() => {
                    setSourceId(source.id);
                    if (error) setError("");
                  }}
                >
                  <span className="transfer-source-icon" aria-hidden="true">
                    {source.id === "cash-wallet" ? "₱" : source.id === "bank-account" ? "▤" : "◈"}
                  </span>
                  <span className="transfer-source-copy">
                    <strong>{source.label}</strong>
                    <small>{source.description}</small>
                  </span>
                  <span className="transfer-source-check" aria-hidden="true">{selected ? "✓" : ""}</span>
                </button>
              );
            })}
          </div>

          {error && <p className="transfer-modal-error" role="alert">{error}</p>}
        </div>

        <div className="transfer-modal-footer">
          <button type="button" className="btn" onClick={onCancel} disabled={isSubmitting}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Savings"}
          </button>
        </div>
      </div>
    </div>
  );
}


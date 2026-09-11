import React, { useEffect, useState } from "react";
import { CreditCard, X } from "lucide-react";
import "./VisualBankCardModal.css";

const ACCOUNT_TYPES = ["Bank Account", "E-wallet", "Cash Wallet", "Visual Bank Card"];
const PROVIDERS = ["GCash", "Maya", "BPI", "Other"];

const DEFAULT_VALUES = {
  accountType: "Bank Account",
  provider: "BPI",
  accountName: "",
  maskedAccount: "",
  initialBalance: "",
  isPrimary: false
};

export default function VisualBankCardModal({ open, onClose }) {
  const [values, setValues] = useState(DEFAULT_VALUES);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setValues(DEFAULT_VALUES);
      setError("");
    }
  }, [open]);

  if (!open) return null;

  const isCashWallet = values.accountType === "Cash Wallet";
  const updateValue = (name, value) => {
    setValues(previous => ({ ...previous, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = event => {
    event.preventDefault();
    if (!values.accountName.trim()) {
      setError("Enter an account or card name.");
      return;
    }

    const balance = Number(values.initialBalance);
    if (!Number.isFinite(balance) || balance <= 0) {
      setError("Enter an initial balance greater than zero.");
      return;
    }

    // This sprint is UI-only. Keep the validated shape ready for future persistence.
    onClose();
  };

  return (
    <div className="visual-bank-card-modal-overlay" role="presentation" onMouseDown={onClose}>
      <form className="visual-bank-card-modal" role="dialog" aria-modal="true" aria-labelledby="visual-bank-card-modal-title" onSubmit={handleSubmit} onMouseDown={event => event.stopPropagation()}>
        <div className="visual-bank-card-modal-header">
          <div>
            <span className="visual-bank-card-modal-eyebrow">Account setup</span>
            <h2 id="visual-bank-card-modal-title">Add Visual Bank Card</h2>
            <p>Add a mock account to organize future savings transfers.</p>
          </div>
          <button type="button" className="visual-bank-card-modal-close" onClick={onClose} aria-label="Close Add Visual Bank Card modal">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="visual-bank-card-modal-body">
          <div className="visual-bank-card-type-grid">
            {ACCOUNT_TYPES.map(type => (
              <button
                type="button"
                key={type}
                className={`visual-bank-card-type-option${values.accountType === type ? " is-selected" : ""}`}
                onClick={() => updateValue("accountType", type)}
              >
                <CreditCard size={15} aria-hidden="true" />
                <span>{type}</span>
              </button>
            ))}
          </div>

          <div className="visual-bank-card-form-grid">
            <label>
              <span>Provider</span>
              <select value={values.provider} onChange={event => updateValue("provider", event.target.value)} disabled={isCashWallet}>
                {isCashWallet ? <option>Cash Wallet</option> : PROVIDERS.map(provider => <option key={provider}>{provider}</option>)}
              </select>
            </label>

            <label>
              <span>Account/Card Name</span>
              <input value={values.accountName} onChange={event => updateValue("accountName", event.target.value)} placeholder="e.g. Daily spending" autoFocus />
            </label>

            {!isCashWallet && (
              <label className="visual-bank-card-full-field">
                <span>Masked Account Number <small>Optional</small></span>
                <input value={values.maskedAccount} onChange={event => updateValue("maskedAccount", event.target.value)} placeholder="**** 1234" maxLength={9} />
              </label>
            )}

            <label className={isCashWallet ? "visual-bank-card-full-field" : ""}>
              <span>Initial Balance</span>
              <div className="visual-bank-card-balance-field">
                <span aria-hidden="true">₱</span>
                <input type="number" min="0" step="0.01" inputMode="decimal" value={values.initialBalance} onChange={event => updateValue("initialBalance", event.target.value)} placeholder="0.00" />
              </div>
            </label>
          </div>

          <label className="visual-bank-card-primary-toggle">
            <span>
              <strong>Set as Primary</strong>
              <small>Use this account as the default transfer option later.</small>
            </span>
            <input type="checkbox" checked={values.isPrimary} onChange={event => updateValue("isPrimary", event.target.checked)} />
          </label>

          {error && <p className="visual-bank-card-modal-error" role="alert">{error}</p>}
        </div>

        <div className="visual-bank-card-modal-footer">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Add Account</button>
        </div>
      </form>
    </div>
  );
}

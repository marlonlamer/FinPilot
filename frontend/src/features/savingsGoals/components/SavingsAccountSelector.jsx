import React, { useEffect, useRef, useState } from "react";
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Settings2,
  Smartphone,
  Wallet,
  WalletCards
} from "lucide-react";
import "./SavingsAccountSelector.css";

const ACCOUNT_SUMMARY = [
  { id: "cards", label: "Savings Bank Cards", detail: "2 cards linked", icon: CreditCard },
  { id: "banks", label: "Bank Accounts", detail: "1 account linked", icon: Building2 },
  { id: "wallets", label: "E-wallets", detail: "2 wallets linked", icon: Smartphone }
];

export default function SavingsAccountSelector() {
  const [open, setOpen] = useState(false);
  const selectorRef = useRef(null);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="savings-account-selector" ref={selectorRef}>
      <button
        type="button"
        className={`savings-account-trigger${open ? " is-open" : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen(value => !value)}
      >
        <span className="savings-account-trigger-icon" aria-hidden="true">
          <WalletCards size={18} strokeWidth={2} />
        </span>
        <span className="savings-account-trigger-copy">
          <strong>Savings Bank Card</strong>
          <small><span className="savings-account-status-dot" /> Connected</small>
        </span>
        <ChevronDown size={16} aria-hidden="true" className="savings-account-chevron" />
      </button>

      {open && (
        <div className="savings-account-popover" role="menu">
          <div className="savings-account-popover-heading">
            <span>Your Savings Accounts</span>
            <CheckCircle2 size={15} aria-hidden="true" />
          </div>

          <div className="savings-account-options">
            {ACCOUNT_SUMMARY.map(({ id, label, detail, icon: Icon }) => (
              <button type="button" className="savings-account-option" role="menuitem" key={id}>
                <span className="savings-account-option-icon" aria-hidden="true">
                  <Icon size={17} strokeWidth={2} />
                </span>
                <span>
                  <strong>{label}</strong>
                  <small>{detail}</small>
                </span>
              </button>
            ))}

            <button type="button" className="savings-account-option" role="menuitem">
              <span className="savings-account-option-icon" aria-hidden="true">
                <Wallet size={17} strokeWidth={2} />
              </span>
              <span>
                <strong>Cash Wallet</strong>
                <small>Available for transfers</small>
              </span>
            </button>
          </div>

          <button type="button" className="savings-account-manage" role="menuitem">
            <Settings2 size={16} aria-hidden="true" />
            <span>Manage Accounts</span>
          </button>
        </div>
      )}
    </div>
  );
}


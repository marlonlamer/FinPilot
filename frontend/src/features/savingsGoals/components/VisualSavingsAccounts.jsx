import React, { useState } from "react";
import { Building2, CreditCard, MoreHorizontal, Plus, Smartphone, Wallet } from "lucide-react";
import "./VisualSavingsAccounts.css";
import VisualBankCardModal from "./VisualBankCardModal";

const MOCK_ACCOUNTS = [
  {
    id: "gcash",
    name: "GCash",
    type: "E-wallet",
    masked: "**** 5408",
    balance: "₱12,450.00",
    icon: Smartphone,
    accent: "teal"
  },
  {
    id: "bpi",
    name: "BPI",
    type: "Bank Account",
    masked: "**** 1234",
    balance: "₱8,230.00",
    icon: Building2,
    accent: "blue"
  },
  {
    id: "maya",
    name: "Maya",
    type: "E-wallet",
    masked: "**** 9012",
    balance: "₱3,567.00",
    icon: CreditCard,
    accent: "violet"
  },
  {
    id: "cash-wallet",
    name: "Cash Wallet",
    type: "Cash",
    masked: null,
    balance: "₱22,300.00",
    icon: Wallet,
    accent: "amber"
  }
];

export default function VisualSavingsAccounts() {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <section className="visual-savings-accounts" aria-labelledby="visual-savings-accounts-title">
      <div className="visual-savings-accounts-header">
        <div>
          <span className="visual-savings-accounts-eyebrow">Connected overview</span>
          <h2 id="visual-savings-accounts-title">Your Savings Cards &amp; Accounts</h2>
          <p>Keep your savings sources visible in one simple view.</p>
        </div>
        <button type="button" className="visual-savings-add-button" onClick={() => setShowAddModal(true)}>
          <Plus size={16} aria-hidden="true" />
          Add Visual Bank Card
        </button>
      </div>

      <div className="visual-savings-account-grid">
        {MOCK_ACCOUNTS.map(({ id, name, type, masked, balance, icon: Icon, accent }) => (
          <article className={`visual-savings-account-card visual-savings-account-card-${accent}`} key={id}>
            <div className="visual-savings-account-card-top">
              <span className="visual-savings-account-icon" aria-hidden="true">
                <Icon size={18} strokeWidth={2} />
              </span>
              <button type="button" className="visual-savings-account-more" aria-label={`More options for ${name}`} title="More options">
                <MoreHorizontal size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="visual-savings-account-name-row">
              <h3>{name}</h3>
              <span>{type}</span>
            </div>
            <div className="visual-savings-account-details">
              <span>{masked || "Physical cash"}</span>
              <small>Available Balance</small>
              <strong>{balance}</strong>
            </div>
            <div className="visual-savings-account-card-footer">
              <span>FINPILOT</span>
              <span>{masked ? "••••" : "WALLET"}</span>
            </div>
          </article>
        ))}
      </div>

      <VisualBankCardModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </section>
  );
}

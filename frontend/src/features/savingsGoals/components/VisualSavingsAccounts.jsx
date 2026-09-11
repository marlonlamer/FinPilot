import React, { useState } from "react";
import { Building2, CreditCard, MoreHorizontal, Plus, Smartphone, Wallet } from "lucide-react";
import "./VisualSavingsAccounts.css";

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
  const [showComingSoon, setShowComingSoon] = useState(false);

  return (
    <section className="visual-savings-accounts" aria-labelledby="visual-savings-accounts-title">
      <div className="visual-savings-accounts-header">
        <div>
          <span className="visual-savings-accounts-eyebrow">Connected overview</span>
          <h2 id="visual-savings-accounts-title">Your Savings Cards &amp; Accounts</h2>
          <p>Keep your savings sources visible in one simple view.</p>
        </div>
        <button type="button" className="visual-savings-add-button" onClick={() => setShowComingSoon(true)}>
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

      {showComingSoon && (
        <div className="visual-savings-coming-soon-overlay" role="presentation" onMouseDown={() => setShowComingSoon(false)}>
          <div className="visual-savings-coming-soon" role="dialog" aria-modal="true" aria-labelledby="visual-savings-coming-soon-title" onMouseDown={event => event.stopPropagation()}>
            <span className="visual-savings-coming-soon-icon" aria-hidden="true"><CreditCard size={20} /></span>
            <h2 id="visual-savings-coming-soon-title">Visual Bank Cards are coming soon</h2>
            <p>Account linking will be available in a future update. These cards are mock data for now.</p>
            <button type="button" className="btn btn-primary" onClick={() => setShowComingSoon(false)}>Got it</button>
          </div>
        </div>
      )}
    </section>
  );
}


import React, { useEffect, useState } from "react";

const DEFAULTS = {
  PHP: "₱",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  INR: "₹",
  CAD: "$",
  AUD: "$",
  CNY: "¥"
};

export default function Settings({ currencyCode: propCurrencyCode, setCurrencyCode: propSetCurrencyCode, currencySymbol: propCurrencySymbol }) {
  const [currencyCode, setCurrencyCode] = useState(propCurrencyCode || "PHP");

  useEffect(() => {
    if (!propCurrencyCode) {
      try {
        const stored = localStorage.getItem("currencyCode");
        if (stored) setCurrencyCode(stored);
      } catch {}
    } else {
      setCurrencyCode(propCurrencyCode);
    }
  }, [propCurrencyCode]);

  function applyCurrency(code) {
    if (propSetCurrencyCode) {
      propSetCurrencyCode(code);
    }
    try { localStorage.setItem("currencyCode", code); } catch {}
    setCurrencyCode(code);
  }

  return (
    <div>
      <h2>Settings</h2>
      <div style={{ marginTop: 8 }}>
        <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Currency</label>
        <select value={currencyCode} onChange={e => applyCurrency(e.target.value)}>
          {Object.keys(DEFAULTS).map(code => (
            <option key={code} value={code}>{code} — {DEFAULTS[code]}</option>
          ))}
        </select>
        <div style={{ marginTop: 10, fontSize: 13 }}>
          Preview: <strong>{(propCurrencySymbol || DEFAULTS[currencyCode] || "₱")}1234.56</strong>
        </div>
      </div>
    </div>
  );
}

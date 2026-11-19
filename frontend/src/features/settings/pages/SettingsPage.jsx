import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Settings2, X } from "lucide-react";
import { formatCurrency as formatCurrencyValue, SUPPORTED_CURRENCIES } from "../../../utils/formatCurrency";
import "./SettingsModule.css";

export default function Settings({
  currencyCode: propCurrencyCode,
  setCurrencyCode: propSetCurrencyCode,
  formatCurrency: propFormatCurrency
}) {
  const [storedCurrencyCode, setStoredCurrencyCode] = useState(() => {
    try {
      return localStorage.getItem("currencyCode") || "PHP";
    } catch {
      return "PHP";
    }
  });
  const currencyCode = propCurrencyCode || storedCurrencyCode;
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [pendingCurrencyCode, setPendingCurrencyCode] = useState(propCurrencyCode || "PHP");
  const [search, setSearch] = useState("");
  const searchInputRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!isCurrencyModalOpen) return undefined;
    searchInputRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsCurrencyModalOpen(false);
        setSearch("");
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isCurrencyModalOpen]);

  const filteredCurrencies = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return SUPPORTED_CURRENCIES;
    return SUPPORTED_CURRENCIES.filter(({ code, name, symbol }) =>
      `${name} ${code} ${symbol}`.toLocaleLowerCase().includes(query)
    );
  }, [search]);

  const selectedCurrency = SUPPORTED_CURRENCIES.find(({ code }) => code === currencyCode)
    || SUPPORTED_CURRENCIES[0];
  const pendingCurrency = SUPPORTED_CURRENCIES.find(({ code }) => code === pendingCurrencyCode)
    || selectedCurrency;
  const previewAmount = (code) => {
    if (code === currencyCode && propFormatCurrency) return propFormatCurrency(1234.56);
    const currency = SUPPORTED_CURRENCIES.find((item) => item.code === code) || SUPPORTED_CURRENCIES[0];
    return formatCurrencyValue(1234.56, {
      currencyCode: currency.code,
      currencySymbol: currency.symbol
    });
  };

  function openCurrencyModal() {
    setPendingCurrencyCode(currencyCode);
    setSearch("");
    setIsCurrencyModalOpen(true);
  }

  function closeCurrencyModal() {
    setIsCurrencyModalOpen(false);
    setSearch("");
    triggerRef.current?.focus();
  }

  function applyCurrency(code) {
    if (propSetCurrencyCode) {
      propSetCurrencyCode(code);
    }
    try {
      localStorage.setItem("currencyCode", code);
    } catch {
      // The app-level preference state still updates if browser storage is unavailable.
    }
    setStoredCurrencyCode(code);
    closeCurrencyModal();
  }

  return (
    <div className="settings-root">
      <header className="settings-header">
        <h1>Settings</h1>
        <p>Manage how FinPilot displays your financial information.</p>
      </header>

      <div className="settings-content">
        <section className="settings-card settings-general-card" aria-labelledby="settings-general-title">
          <div className="settings-section-heading">
            <span className="settings-section-icon" aria-hidden="true"><Settings2 size={18} /></span>
            <div>
              <h2 id="settings-general-title">General Preferences</h2>
              <p>Choose the display preferences used throughout your FinPilot workspace.</p>
            </div>
          </div>
        </section>

        <div className="settings-detail-grid">
          <section className="settings-card" aria-labelledby="settings-currency-title">
            <div className="settings-section-heading">
              <div>
                <h2 id="settings-currency-title">Currency</h2>
                <p>Set the currency used to display financial amounts.</p>
              </div>
            </div>
            <button
              ref={triggerRef}
              type="button"
              className="settings-currency-trigger"
              onClick={openCurrencyModal}
              aria-haspopup="dialog"
            >
              <span className="settings-currency-symbol" aria-hidden="true">{selectedCurrency.symbol}</span>
              <span className="settings-currency-current">
                <strong>{selectedCurrency.name}</strong>
                <small>{selectedCurrency.code} · {selectedCurrency.symbol}</small>
              </span>
              <ChevronDown size={18} aria-hidden="true" />
            </button>
            <p className="settings-currency-note">This changes display formatting only. Stored amounts are not converted.</p>
          </section>

          <section className="settings-card settings-preview-card" aria-labelledby="settings-preview-title">
            <div className="settings-section-heading">
              <div>
                <h2 id="settings-preview-title">Currency Preview</h2>
                <p>Example using your selected display currency.</p>
              </div>
            </div>
            <div className="settings-preview-value" aria-live="polite">
              <span>Sample amount</span>
              <strong>{previewAmount(currencyCode)}</strong>
            </div>
            <p className="settings-preview-caption">{selectedCurrency.name} ({selectedCurrency.code})</p>
          </section>
        </div>
      </div>

      {isCurrencyModalOpen ? (
        <div
          className="settings-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeCurrencyModal();
          }}
        >
          <section
            className="settings-currency-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-currency-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="settings-modal-header">
              <div>
                <h2 id="settings-currency-modal-title">Select Currency</h2>
                <p>Search by currency name, code, or symbol.</p>
              </div>
              <button
                type="button"
                className="settings-modal-close"
                onClick={closeCurrencyModal}
                aria-label="Close currency selection"
              >
                <X size={22} strokeWidth={2.25} aria-hidden="true" />
              </button>
            </header>

            <label className="settings-search-label" htmlFor="settings-currency-search">Search currencies</label>
            <input
              ref={searchInputRef}
              id="settings-currency-search"
              className="settings-search-input"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, code, or symbol"
            />

            <div className="settings-currency-list" role="radiogroup" aria-label="Available currencies">
              {filteredCurrencies.length > 0 ? filteredCurrencies.map((currency) => {
                const isSelected = currency.code === pendingCurrencyCode;
                const isCurrent = currency.code === currencyCode;
                return (
                  <button
                    key={currency.code}
                    type="button"
                    className={`settings-currency-option${isSelected ? " is-selected" : ""}`}
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setPendingCurrencyCode(currency.code)}
                  >
                    <span className="settings-currency-option-symbol" aria-hidden="true">{currency.symbol}</span>
                    <span className="settings-currency-option-copy">
                      <strong>{currency.name}</strong>
                      <small>{currency.code} · {currency.symbol}</small>
                    </span>
                    <span className="settings-currency-option-status">
                      {isCurrent ? <small>Current</small> : null}
                      {isSelected ? <Check size={18} aria-label="Selected" /> : null}
                    </span>
                  </button>
                );
              }) : (
                <p className="settings-empty-results" role="status">No currencies match your search.</p>
              )}
            </div>

            <div className="settings-modal-preview" aria-live="polite">
              <span>Preview</span>
              <strong>{previewAmount(pendingCurrency.code)}</strong>
            </div>

            <footer className="settings-modal-actions">
              <button type="button" className="settings-button settings-button--secondary" onClick={closeCurrencyModal}>
                Cancel
              </button>
              <button
                type="button"
                className="settings-button settings-button--primary"
                onClick={() => applyCurrency(pendingCurrency.code)}
                disabled={pendingCurrency.code === currencyCode}
              >
                Apply Currency
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}

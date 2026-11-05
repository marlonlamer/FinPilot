import { useEffect, useMemo, useRef } from "react";
import { X } from "lucide-react";
import { buildMonthlyStatement } from "../utils/monthlyStatement";

const formatMoney = (value, currencySymbol, formatCurrency) => {
  if (typeof formatCurrency === "function") return formatCurrency(value);
  return `${currencySymbol}${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const getSourceMessage = (source, status) => {
  if (status === "loading") return `${source} data is still loading.`;
  return `${source} data is unavailable.`;
};

export default function MonthlyStatementModal({
  open,
  onClose,
  year,
  onYearChange,
  availableYears,
  incomes,
  expenses,
  incomeAvailable,
  expenseAvailable,
  incomeStatus,
  expenseStatus,
  currencySymbol,
  formatCurrency
}) {
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);

  const years = useMemo(() => {
    const options = new Set(availableYears);
    options.add(Number(year));
    return [...options].sort((a, b) => b - a);
  }, [availableYears, year]);

  const statement = useMemo(() => buildMonthlyStatement({
    year,
    incomes,
    expenses,
    incomeAvailable,
    expenseAvailable
  }), [year, incomes, expenses, incomeAvailable, expenseAvailable]);

  useEffect(() => {
    if (!open) return undefined;
    previousFocusRef.current = document.activeElement;
    closeButtonRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const dialog = event.currentTarget.querySelector("[role='dialog']");
      const focusable = dialog?.querySelectorAll("button:not(:disabled), select:not(:disabled)");
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const money = (value) => value == null
    ? "Unavailable"
    : formatMoney(value, currencySymbol, formatCurrency);
  const bothUnavailable = !incomeAvailable && !expenseAvailable;
  const isLoading = incomeStatus === "loading" || expenseStatus === "loading";
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div className="analytics-statement-backdrop" onMouseDown={handleBackdropClick}>
      <section
        className="analytics-statement-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="analytics-statement-title"
        aria-describedby="analytics-statement-description"
      >
        <header className="analytics-statement-header">
          <div>
            <p className="analytics-eyebrow">FinPilot / Reports</p>
            <h2 id="analytics-statement-title">Interactive Statement</h2>
            <p id="analytics-statement-description">
              Monthly income, expenditure, and net totals for the selected year.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            className="analytics-statement-close"
            type="button"
            onClick={onClose}
            aria-label="Close statement"
          >
            <X size={21} />
          </button>
        </header>

        <div className="analytics-statement-toolbar">
          <label htmlFor="analytics-statement-year">Statement year</label>
          <select
            id="analytics-statement-year"
            value={year}
            onChange={(event) => onYearChange(Number(event.target.value))}
          >
            {years.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>

        {bothUnavailable ? (
          <div className="analytics-statement-notice" role="status">
            {isLoading
              ? "Financial data is still loading. The statement will be available when a data source finishes loading."
              : "Income and Expense data are unavailable. A statement cannot be calculated."}
          </div>
        ) : (
          <>
            {!incomeAvailable || !expenseAvailable ? (
              <div className="analytics-statement-notice" role="status">
                {!incomeAvailable ? getSourceMessage("Income", incomeStatus) : null}
                {!expenseAvailable ? getSourceMessage("Expense", expenseStatus) : null}
                {" "}
                Figures requiring unavailable data are not calculated.
              </div>
            ) : !statement.hasTransactions ? (
              <div className="analytics-statement-notice" role="status">
                No transactions were recorded in {year}. All monthly totals are zero.
              </div>
            ) : null}

            <section className="analytics-statement-summary" aria-label="Yearly summary">
              <article className="analytics-statement-summary-card analytics-statement-summary-card--inflow">
                <span>Total inflow</span>
                <strong>{money(statement.totals.income)}</strong>
                <small>Income</small>
              </article>
              <article className="analytics-statement-summary-card analytics-statement-summary-card--outflow">
                <span>Total outflow</span>
                <strong>{money(statement.totals.expenditure)}</strong>
                <small>Expenditure</small>
              </article>
              <article className={`analytics-statement-summary-card${statement.totals.net == null ? "" : statement.totals.net >= 0 ? " analytics-statement-summary-card--inflow" : " analytics-statement-summary-card--outflow"}`}>
                <span>Yearly profit / net</span>
                <strong>{money(statement.totals.net)}</strong>
                <small>Income minus expenditure</small>
              </article>
            </section>

            <div className="analytics-statement-table-scroll">
              <table className="analytics-statement-table">
                <caption className="analytics-visually-hidden">
                  Monthly financial statement for {year}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Month</th>
                    <th scope="col">Income</th>
                    <th scope="col">Expenditure</th>
                    <th scope="col">Profit / Net</th>
                    <th scope="col">Proportion</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.rows.map((row) => (
                    <tr key={row.monthIndex}>
                      <th scope="row">{row.month}</th>
                      <td className="analytics-statement-income">{money(row.income)}</td>
                      <td className="analytics-statement-expense">{money(row.expenditure)}</td>
                      <td>{money(row.net)}</td>
                      <td>{row.proportion == null ? "Unavailable" : `${row.proportion.toFixed(2)}%`}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row">TOTAL</th>
                    <td className="analytics-statement-income">{money(statement.totals.income)}</td>
                    <td className="analytics-statement-expense">{money(statement.totals.expenditure)}</td>
                    <td>{money(statement.totals.net)}</td>
                    <td>{statement.totals.proportion == null ? "Unavailable" : `${statement.totals.proportion.toFixed(2)}%`}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

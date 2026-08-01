import React from "react";

export default function SourceBreakdownList({ bySource = [], formatCurrency, currencySymbol = "₱" }) {
  return (
    <>
      <h3 className="section-title">Income Source Breakdown</h3>
      {bySource.length > 0 ? (
        <div className="source-list">
          {bySource.map(([source, total]) => (
            <div key={source} className="source-item">
              <div>{source}</div>
              <div className="source-value">{formatCurrency ? formatCurrency(total) : `${currencySymbol}${total.toFixed(2)}`}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-data">No incomes recorded.</div>
      )}
    </>
  );
}

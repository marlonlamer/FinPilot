import React from "react";

export default function BudgetOverview({ monthlyBudget, percentBudgetUsed, budgetRemaining, budgetColor, overBudgetCategories, COLORS }) {
  const pct = percentBudgetUsed || 0;

  return (
    <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
      <div style={{ flex: "1 1 320px", background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize: 12, color: "#666" }}>Monthly Budget</div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{monthlyBudget === null ? "Not set" : `₱${Number(monthlyBudget).toFixed(2)}`}</div>

        <div style={{ marginTop: 10 }}>
          <div style={{ height: 10, background: "#f1f5f9", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: `${Math.min(100, Math.max(0, pct))}%`, height: "100%", background: budgetColor || "#60a5fa" }} />
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "#555" }}>
            {percentBudgetUsed !== null ? `${percentBudgetUsed.toFixed(1)}% used` : "Usage not available"}
            {budgetRemaining !== null && ` — Remaining: ₱${Number(budgetRemaining).toFixed(2)}`}
          </div>
        </div>
      </div>

      <div style={{ flex: "1 1 240px", background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize: 12, color: "#666" }}>Top Over-Budget Categories</div>
        {overBudgetCategories && overBudgetCategories.length > 0 ? (
          <ul style={{ marginTop: 8, paddingLeft: 16 }}>
            {overBudgetCategories.slice(0, 5).map((c, i) => (
              <li key={c.category} style={{ marginBottom: 6, color: COLORS && COLORS[i % COLORS.length] ? COLORS[i % COLORS.length] : "#333" }}>
                {c.category} — ₱{Number(c.spent || c.value || 0).toFixed(2)}
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ marginTop: 8, color: "#666" }}>None</div>
        )}
      </div>
    </div>
  );
}

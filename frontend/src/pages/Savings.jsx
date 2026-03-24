import React, { useEffect,  useState } from "react";

export default function Savings({ currencySymbol = "₱", formatCurrency }) {
  const [goals] = useState(() => {
    try {
      const raw = localStorage.getItem("savingGoals");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("savingGoals", JSON.stringify(goals));
    } catch {}
  }, [goals]);

  const totalDeposits = (goals || []).reduce((acc, g) => acc + ((g.history || []).reduce((a, h) => a + (h.amount > 0 ? h.amount : 0), 0)), 0);
  const allHistory = (goals || []).reduce((acc, g) => acc.concat((g.history || []).map(h => ({ ...h, goalId: g.id }))), []);
  const totalWithdrawn = allHistory.reduce((acc, h) => (h.amount < 0 ? acc + Math.abs(h.amount) : acc), 0);

  const computedTotalSavings = totalDeposits - totalWithdrawn;


  return (
    <div>
      <h2>Savings</h2>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 6, flexWrap: "wrap" }}>
        <div style={{ fontSize: 14 }}>Total Deposits: <strong>{formatCurrency ? formatCurrency(totalDeposits) : `${currencySymbol}${Number(totalDeposits).toFixed(2)}`}</strong></div>
        <div style={{ fontSize: 14 }}>Total Withdrawals: <strong>{formatCurrency ? formatCurrency(totalWithdrawn) : `${currencySymbol}${Number(totalWithdrawn).toFixed(2)}`}</strong></div>
      </div>

      <p>Total Savings: {formatCurrency ? formatCurrency(computedTotalSavings) : `${currencySymbol}${Number(computedTotalSavings).toFixed(2)}`}</p>

      <div style={{ marginTop: 18 }}>
        {goals.length === 0 && <p>No saving goals yet.</p>}
        {goals.map(goal => {
          const t = parseFloat(goal.targetAmount) || 0;
          const s = parseFloat(goal.savedAmount) || 0;
          const pct = t > 0 ? Math.min(100, (s / t) * 100) : 0;
          return (
            <div key={goal.id} style={{ border: "1px solid #eee", padding: 12, borderRadius: 6, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{goal.goalName}</strong>
                  <div style={{ fontSize: 12, color: "#666" }}>{goal.startDate ? `${goal.startDate} → ${goal.targetDate || "-"}` : (goal.targetDate || "")}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div>Target: {formatCurrency ? formatCurrency(t) : `${currencySymbol}${Number(t).toFixed(2)}`}</div>
                  <div>Saved: {formatCurrency ? formatCurrency(s) : `${currencySymbol}${Number(s).toFixed(2)}`}</div>
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <div style={{ height: 10, background: "#f1f1f1", borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: "#4caf50" }} />
                </div>
                <div style={{ fontSize: 12, color: "#444", marginTop: 6 }}>{pct.toFixed(1)}% complete</div>
              </div>

              {goal.history && goal.history.length > 0 && (
                <div style={{ marginTop: 10, fontSize: 13, color: "#333" }}>
                  <strong>History</strong>
                  <ul style={{ margin: "6px 0 0", paddingLeft: 14 }}>
                    {((goal.history || []).slice().reverse().slice(0, 6)).map(entry => (
                      <li key={entry.id} style={{ marginBottom: 4 }}>{new Date(entry.date).toLocaleDateString()} — {formatCurrency ? formatCurrency(entry.amount) : `${currencySymbol}${Number(entry.amount).toFixed(2)}`}{entry.note ? ` (${entry.note})` : ""}</li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
}

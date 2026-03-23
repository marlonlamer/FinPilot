import React, { useEffect, useMemo, useState } from "react";

export default function Savings({ totalSavings = 0, savingsRate = null, savingsRateColor = "#000", currencySymbol = "₱" }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [savedAmount, setSavedAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [notes, setNotes] = useState("");

  const [goals, setGoals] = useState(() => {
    try {
      const raw = localStorage.getItem("savingGoals");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [editGoalId, setEditGoalId] = useState(null);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [addMoneyGoalId, setAddMoneyGoalId] = useState(null);
  const [addMoneyAmount, setAddMoneyAmount] = useState("");
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawGoalId, setWithdrawGoalId] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem("savingGoals", JSON.stringify(goals));
    } catch {}
  }, [goals]);

  // Auto-save form draft while modal is open
  useEffect(() => {
    if (isModalOpen) {
      const draft = { goalName, targetAmount, savedAmount, startDate, targetDate, notes };
      try {
        localStorage.setItem("savingGoalDraft", JSON.stringify(draft));
      } catch {}
    }
  }, [goalName, targetAmount, savedAmount, startDate, targetDate, notes, isModalOpen]);

  const monthlySuggestion = useMemo(() => {
    const t = parseFloat(targetAmount);
    const s = parseFloat(savedAmount) || 0;
    if (!t || !startDate || !targetDate) return "";
    const start = new Date(startDate);
    const end = new Date(targetDate);
    if (isNaN(start) || isNaN(end) || end <= start) return "";
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (months <= 0) return "";
    const remaining = Math.max(0, t - s);
    return (remaining / months).toFixed(2);
  }, [targetAmount, savedAmount, startDate, targetDate]);

  function resetForm() {
    setGoalName("");
    setTargetAmount("");
    setSavedAmount("");
    setStartDate("");
            const end = new Date(goal.targetDate);
    setNotes("");
    setEditGoalId(null);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const base = {
      id: editGoalId || Date.now().toString(),
      goalName: goalName.trim(),
      targetAmount: parseFloat(targetAmount) || 0,
      savedAmount: parseFloat(savedAmount) || 0,
      startDate: startDate || null,
      targetDate: targetDate || null,
      notes: notes.trim(),
      createdAt: new Date().toISOString()
    };

    // preserve existing history when editing, or create initial history if there's an initial saved amount
    let payload = { ...base };
    if (editGoalId) {
      const existing = goals.find(g => g.id === editGoalId) || {};
      payload.history = existing.history || [];
    } else {
      payload.history = [];
      const initialAmount = parseFloat(savedAmount) || 0;
      if (initialAmount > 0) {
        payload.history.push({ id: Date.now().toString(), amount: initialAmount, date: new Date().toISOString(), note: "Initial" });
      }
    }

                  <div>Target: {currencySymbol}{Number(t).toFixed(2)}</div>
                  <div>Saved: {currencySymbol}{Number(s).toFixed(2)}</div>
                  <div style={{ fontSize: 12, color: "#333", marginTop: 6 }}>Suggested/month: {suggestedPerMonth ? `${currencySymbol}${suggestedPerMonth}` : "-"}</div>
      setGoals(prev => [payload, ...prev]);
    }

    setIsModalOpen(false);
    resetForm();
  }

  function openEdit(goal) {
    setEditGoalId(goal.id);
    setGoalName(goal.goalName || "");
    setTargetAmount(String(goal.targetAmount || ""));
    setSavedAmount(String(goal.savedAmount || ""));
                        {new Date(entry.date).toLocaleDateString()} — {currencySymbol}{Number(entry.amount).toFixed(2)}{entry.note ? ` (${entry.note})` : ""}
    setTargetDate(goal.targetDate || "");
    setNotes(goal.notes || "");
    setIsModalOpen(true);
  }

  function handleDelete(id) {
    if (window.confirm("Delete this saving goal?")) {
      setGoals(prev => prev.filter(g => g.id !== id));
    }
  }

  function openAddMoney(goal) {
    setAddMoneyGoalId(goal.id);
    setAddMoneyAmount("");
    setIsAddMoneyOpen(true);
  }

  function openWithdraw(goal) {
    setWithdrawGoalId(goal.id);
    setWithdrawAmount("");
    setIsWithdrawOpen(true);
  }

  function handleAddMoney(e) {
    e.preventDefault();
    const amt = parseFloat(addMoneyAmount) || 0;
    if (!addMoneyGoalId || amt <= 0) return;
    const entry = { id: Date.now().toString(), amount: amt, date: new Date().toISOString(), note: "Added" };
    setGoals(prev => prev.map(g => g.id === addMoneyGoalId ? { ...g, savedAmount: (parseFloat(g.savedAmount || 0) + amt), history: (g.history || []).concat(entry) } : g));
    setIsAddMoneyOpen(false);
    setAddMoneyGoalId(null);
    setAddMoneyAmount("");
  }

  function handleWithdraw(e) {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount) || 0;
    if (!withdrawGoalId || amt <= 0) return;
    setGoals(prev => prev.map(g => {
      if (g.id !== withdrawGoalId) return g;
      const current = parseFloat(g.savedAmount || 0);
      const allowed = Math.min(current, amt);
      const entry = { id: Date.now().toString(), amount: -allowed, date: new Date().toISOString(), note: "Withdrawn" };
      return { ...g, savedAmount: (current - allowed), history: (g.history || []).concat(entry) };
    }));
    setIsWithdrawOpen(false);
    setWithdrawGoalId(null);
    setWithdrawAmount("");
  }

  useEffect(() => {
    if (!isModalOpen) {
      resetForm();
      try { localStorage.removeItem("savingGoalDraft"); } catch {}
    } else {
      // when opening new modal (not editing), try to restore draft
      if (!editGoalId) {
        try {
          const raw = localStorage.getItem("savingGoalDraft");
          if (raw) {
            const d = JSON.parse(raw);
            setGoalName(d.goalName || "");
            setTargetAmount(d.targetAmount || "");
            setSavedAmount(d.savedAmount || "");
            setStartDate(d.startDate || "");
            setTargetDate(d.targetDate || "");
            setNotes(d.notes || "");
          }
        } catch {}
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);

  // aggregate history and totals for summaries
  const totalGoalsCount = (goals || []).length;
  const totalSavedFromGoals = (goals || []).reduce((acc, g) => acc + (parseFloat(g.savedAmount) || 0), 0);
  const allHistory = (goals || []).reduce((acc, g) => acc.concat((g.history || []).map(h => ({ ...h, goalId: g.id }))), []);
  const totalWithdrawn = allHistory.reduce((acc, h) => (h.amount < 0 ? acc + Math.abs(h.amount) : acc), 0);
  const daysWindow = 30;
  const since = new Date();
  since.setDate(since.getDate() - daysWindow);
  const monthlySaved = allHistory.reduce((acc, h) => {
    const d = new Date(h.date);
    if (d >= since && h.amount > 0) return acc + h.amount;
    return acc;
  }, 0);
  const monthlyWithdrawn = allHistory.reduce((acc, h) => {
    const d = new Date(h.date);
    if (d >= since && h.amount < 0) return acc + Math.abs(h.amount);
    return acc;
  }, 0);

  return (
    <div>
      <h2>Savings</h2>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 6, flexWrap: "wrap" }}>
        <div style={{ fontSize: 14 }}>Total Goals: <strong>{totalGoalsCount}</strong></div>
        <div style={{ fontSize: 14 }}>Total Saved: <strong>{currencySymbol}{Number(totalSavedFromGoals).toFixed(2)}</strong></div>
        <div style={{ fontSize: 14 }}>This Month's Savings: <strong>{currencySymbol}{Number(monthlySaved).toFixed(2)}</strong></div>
        <div style={{ fontSize: 14 }}>This Month's Withdrawals: <strong>{currencySymbol}{Number(monthlyWithdrawn).toFixed(2)}</strong></div>
        <div style={{ fontSize: 14 }}>Total Withdrawals: <strong>{currencySymbol}{Number(totalWithdrawn).toFixed(2)}</strong></div>
      </div>
      <p>Total Savings: {currencySymbol}{Number(totalSavings).toFixed(2)}</p>
      <p style={{ color: savingsRateColor }}>Savings Rate: {savingsRate !== null ? `${Number(savingsRate).toFixed(1)}%` : "N/A"}</p>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
        <button onClick={() => setIsModalOpen(true)} style={{ padding: "8px 12px" }}>Add Saving Goal</button>
      </div>

      <div style={{ marginTop: 18 }}>
        {goals.length === 0 && <p>No saving goals yet.</p>}
        {goals.map(goal => {
          const t = parseFloat(goal.targetAmount) || 0;
          const s = parseFloat(goal.savedAmount) || 0;
          const pct = t > 0 ? Math.min(100, (s / t) * 100) : 0;
          const suggestedPerMonth = (() => {
            if (!goal.targetDate) return "";
            const end = new Date(goal.targetDate);
            const now = new Date();
            if (isNaN(end) || end <= now) return "";
            const months = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
            if (months <= 0) return "";
            const remaining = Math.max(0, t - s);
            return (remaining / months).toFixed(2);
          })();
          return (
            <div key={goal.id} style={{ border: "1px solid #eee", padding: 12, borderRadius: 6, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{goal.goalName}</strong>
                  <div style={{ fontSize: 12, color: "#666" }}>{goal.startDate ? `${goal.startDate} → ${goal.targetDate || "-"}` : (goal.targetDate || "")}</div>
                  <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Remaining: {
                    (() => {
                      if (!goal.targetDate) return "-";
                      const end = new Date(goal.targetDate);
                      const now = new Date();
                      if (isNaN(end)) return "-";
                      if (end <= now) return "Expired";
                      const totalDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
                      const months = Math.floor(totalDays / 30);
                      const days = totalDays % 30;
                      const parts = [];
                      if (months > 0) parts.push(`${months}mo`);
                      if (days > 0) parts.push(`${days}d`);
                      return parts.length ? parts.join(" ") : `~${totalDays}d`;
                    })()
                  }</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div>Target: {currencySymbol}{Number(t).toFixed(2)}</div>
                  <div>Saved: {currencySymbol}{Number(s).toFixed(2)}</div>
                  <div style={{ fontSize: 12, color: "#333", marginTop: 6 }}>Suggested/month: {suggestedPerMonth ? `${currencySymbol}${suggestedPerMonth}` : "-"}</div>
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
                    {((goal.history || [])
                      .slice()
                      .reverse()
                      .slice(0, 6)
                    ).map(entry => (
                      <li key={entry.id} style={{ marginBottom: 4 }}>
                        {new Date(entry.date).toLocaleDateString()} — {currencySymbol}{Number(entry.amount).toFixed(2)}{entry.note ? ` (${entry.note})` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
                <button onClick={() => openAddMoney(goal)}>Add Money</button>
                <button onClick={() => openWithdraw(goal)}>Withdraw</button>
                <button onClick={() => openEdit(goal)}>Edit</button>
                <button onClick={() => handleDelete(goal.id)} style={{ color: "#c00" }}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div role="dialog" aria-modal="true" style={overlayStyle} onClick={() => setIsModalOpen(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h3>{editGoalId ? "Edit Saving Goal" : "Add Saving Goal"}</h3>
            <form onSubmit={handleSubmit}>
              <div style={fieldStyle}>
                <label>Goal Name</label>
                <input value={goalName} onChange={e => setGoalName(e.target.value)} required />
              </div>

              <div style={twoCol}>
                <div style={fieldStyle}>
                  <label>Target Amount</label>
                  <input type="number" step="0.01" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} required />
                </div>
                <div style={fieldStyle}>
                  <label>Saved Amount</label>
                  <input type="number" step="0.01" value={savedAmount} onChange={e => setSavedAmount(e.target.value)} />
                </div>
              </div>

              <div style={twoCol}>
                <div style={fieldStyle}>
                  <label>Start Date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div style={fieldStyle}>
                  <label>Target Date</label>
                  <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
                </div>
              </div>

              <div style={fieldStyle}>
                <label>Monthly Contribution Suggestion</label>
                <input value={monthlySuggestion ? `${currencySymbol}${monthlySuggestion}` : ""} readOnly />
              </div>

              <div style={fieldStyle}>
                <label>Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button type="button" onClick={() => { setIsModalOpen(false); setEditGoalId(null); }}>Cancel</button>
                <button type="submit" style={{ padding: "6px 12px" }}>Save Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddMoneyOpen && (
        <div role="dialog" aria-modal="true" style={overlayStyle} onClick={() => setIsAddMoneyOpen(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h3>Add Money</h3>
            <form onSubmit={handleAddMoney}>
              <div style={fieldStyle}>
                <label>Amount</label>
                <input type="number" step="0.01" value={addMoneyAmount} onChange={e => setAddMoneyAmount(e.target.value)} required />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button type="button" onClick={() => setIsAddMoneyOpen(false)}>Cancel</button>
                <button type="submit">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isWithdrawOpen && (
        <div role="dialog" aria-modal="true" style={overlayStyle} onClick={() => setIsWithdrawOpen(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h3>Withdraw</h3>
            <form onSubmit={handleWithdraw}>
              <div style={fieldStyle}>
                <label>Amount</label>
                <input type="number" step="0.01" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} required />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button type="button" onClick={() => setIsWithdrawOpen(false)}>Cancel</button>
                <button type="submit">Withdraw</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000
};

const modalStyle = {
  background: "#fff",
  padding: 20,
  borderRadius: 6,
  width: "min(520px, 92%)",
  boxShadow: "0 6px 18px rgba(0,0,0,0.12)"
};

const fieldStyle = {
  display: "flex",
  flexDirection: "column",
  marginBottom: 10
};

const twoCol = {
  display: "flex",
  gap: 12,
  marginBottom: 8
};

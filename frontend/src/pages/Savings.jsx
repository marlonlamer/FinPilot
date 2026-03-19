import React, { useEffect, useMemo, useState } from "react";

export default function Savings({ totalIncomes = 0, totalExpenses = 0, totalSavings = 0, savingsRate = null, savingsRateColor = "#000" }) {
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

  useEffect(() => {
    try {
      localStorage.setItem("savingGoals", JSON.stringify(goals));
    } catch {}
  }, [goals]);

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
    setTargetDate("");
    setNotes("");
    setEditGoalId(null);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      id: editGoalId || Date.now().toString(),
      goalName: goalName.trim(),
      targetAmount: parseFloat(targetAmount) || 0,
      savedAmount: parseFloat(savedAmount) || 0,
      startDate: startDate || null,
      targetDate: targetDate || null,
      notes: notes.trim(),
      createdAt: new Date().toISOString()
    };

    if (editGoalId) {
      setGoals(prev => prev.map(g => (g.id === editGoalId ? { ...g, ...payload } : g)));
    } else {
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
    setStartDate(goal.startDate || "");
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

  function handleAddMoney(e) {
    e.preventDefault();
    const amt = parseFloat(addMoneyAmount) || 0;
    if (!addMoneyGoalId || amt <= 0) return;
    setGoals(prev => prev.map(g => g.id === addMoneyGoalId ? { ...g, savedAmount: (parseFloat(g.savedAmount || 0) + amt) } : g));
    setIsAddMoneyOpen(false);
    setAddMoneyGoalId(null);
    setAddMoneyAmount("");
  }

  useEffect(() => {
    if (!isModalOpen) resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);

  return (
    <div>
      <h2>Savings</h2>
      <p>Monthly Income: ₱{Number(totalIncomes).toFixed(2)}</p>
      <p>Monthly Expenses: ₱{Number(totalExpenses).toFixed(2)}</p>
      <p>Total Savings: ₱{Number(totalSavings).toFixed(2)}</p>
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
                </div>
                <div style={{ textAlign: "right" }}>
                  <div>Target: ₱{Number(t).toFixed(2)}</div>
                  <div>Saved: ₱{Number(s).toFixed(2)}</div>
                  <div style={{ fontSize: 12, color: "#333", marginTop: 6 }}>Suggested/month: {suggestedPerMonth ? `₱${suggestedPerMonth}` : "-"}</div>
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <div style={{ height: 10, background: "#f1f1f1", borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: "#4caf50" }} />
                </div>
                <div style={{ fontSize: 12, color: "#444", marginTop: 6 }}>{pct.toFixed(1)}% complete</div>
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
                <button onClick={() => openAddMoney(goal)}>Add Money</button>
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
                <input value={monthlySuggestion ? `₱${monthlySuggestion}` : ""} readOnly />
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

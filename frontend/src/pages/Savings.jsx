import React, { useEffect, useState, useMemo } from "react";
import ConfirmModal from "../components/ConfirmModal";

export default function Savings({ currencySymbol = "₱", formatCurrency, availableBalance = 0, adjustAvailableBalance = () => {} }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("All Time");
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());

  const [newGoal, setNewGoal] = useState({
    goalName: "",
    targetAmount: "",
    savedAmount: "",
    startDate: "",
    targetDate: "",
    monthlySuggestion: "",
    notes: ""
  });

  const [goals, setGoals] = useState(() => {
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

    const handleNewGoalChange = (e) => {
    setNewGoal({ ...newGoal, [e.target.name]: e.target.value });
  };

  const calculateMonthlySuggestion = () => {
    const target = Number(newGoal.targetAmount || 0);
    const saved = Number(newGoal.savedAmount || 0);
    const date = newGoal.targetDate;

    if (!target || !date) return "";

    const remaining = target - saved;
    const months = Math.max(
      1,
      (new Date(date) - new Date()) / (1000 * 60 * 60 * 24 * 30)
    );

    return Math.ceil(remaining / months);
  };

  const handleAddGoal = (e) => {
    e.preventDefault();

    const target = Number(newGoal.targetAmount);
    const saved = Number(newGoal.savedAmount || 0);

    if (!newGoal.goalName || !target || !newGoal.targetDate) {
      return alert("Please fill required fields.");
    }

    if (saved > target) {
      return alert("Saved amount cannot exceed target.");
    }

    const avail = Number(availableBalance || 0);
    if (saved > 0) {
      if (!avail || avail <= 0) {
        return alert("Insufficient available balance to set an initial saved amount.");
      }
      if (saved > avail) {
        return alert("Saved amount exceeds available balance.");
      }
    }

    const startDateVal = newGoal.startDate || new Date().toISOString().slice(0,10);

    const initialHistory = saved > 0 ? [{ id: Date.now() + 1, date: startDateVal, amount: Number(saved), note: "Initial deposit" }] : [];

    const newEntry = {
      id: Date.now(),
      goalName: newGoal.goalName,
      targetAmount: target,
      savedAmount: saved,
      startDate: startDateVal,
      targetDate: newGoal.targetDate,
      monthlySuggestion: calculateMonthlySuggestion(),
      notes: newGoal.notes,
      history: initialHistory
    };

    setGoals(prev => [...prev, newEntry]);

    if (saved > 0) {
      try { adjustAvailableBalance && adjustAvailableBalance(-Math.abs(saved)); } catch {}
    }

    // reset form
    setNewGoal({
      goalName: "",
      targetAmount: "",
      savedAmount: "",
      startDate: "",
      targetDate: "",
      monthlySuggestion: "",
      notes: ""
    });

    setIsModalOpen(false);
  };

  const addHistoryEntry = (goalId, amount, note) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== goalId) return g;
      const history = Array.isArray(g.history) ? [...g.history] : [];
      const entry = { id: Date.now() + Math.floor(Math.random() * 1000), date: new Date().toISOString().slice(0, 10), amount: Number(amount), note: note || "" };
      const nextSaved = Number(g.savedAmount || 0) + Number(amount);
      return { ...g, history: [...history, entry], savedAmount: nextSaved };
    }));
  };

  const handleDeposit = (goalId) => {
    const raw = window.prompt("Deposit amount:");
    if (raw === null) return;
    const amt = Number(raw);
    if (isNaN(amt) || amt <= 0) return window.alert("Please enter a positive number.");
    const avail = Number(availableBalance || 0);
    if (amt > avail) return window.alert("Insufficient available balance for this deposit.");
    const note = window.prompt("Note (optional):") || "";
    addHistoryEntry(goalId, Math.abs(amt), note);
    try { adjustAvailableBalance && adjustAvailableBalance(-Math.abs(amt)); } catch {}
  };

  const handleWithdraw = (goalId) => {
    const goal = goals.find(g => g.id === goalId);
    const raw = window.prompt("Withdraw amount:");
    if (raw === null) return;
    const amt = Number(raw);
    if (isNaN(amt) || amt <= 0) return window.alert("Please enter a positive number.");
    const currentSaved = Number(goal?.savedAmount || 0);
    if (amt > currentSaved) return window.alert("Insufficient saved amount for this withdrawal.");
    const note = window.prompt("Note (optional):") || "";
    addHistoryEntry(goalId, -Math.abs(amt), note);
    try { adjustAvailableBalance && adjustAvailableBalance(Math.abs(amt)); } catch {}
  };

  const handleEdit = (goalId) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const name = window.prompt("Goal name:", goal.goalName || "");
    if (name === null) return;
    const rawTarget = window.prompt("Target amount:", String(goal.targetAmount || ""));
    if (rawTarget === null) return;
    const target = Number(rawTarget) || 0;
    const targetDate = window.prompt("Target date (YYYY-MM-DD):", goal.targetDate || "") || "";
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, goalName: name, targetAmount: target, targetDate } : g));
  };

  const handleDelete = (goalId) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
  };

  const [confirm, setConfirm] = useState({ open: false, message: "", onConfirm: null });

  const allHistory = (goals || []).reduce((acc, g) => acc.concat((g.history || []).map(h => ({ ...h, goalId: g.id }))), []);

  const months = useMemo(() => [
    'January','February','March','April','May','June','July','August','September','October','November','December'
  ], []);

  const now = useMemo(() => new Date(), []);

  const monthFilteredHistory = useMemo(() => {
    return allHistory.filter(h => {
      const d = new Date(h.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === Number(selectedMonth);
    });
  }, [allHistory, selectedMonth, now]);

  const computeTotals = (historyArray) => {
    const deposits = (historyArray || []).reduce((acc, h) => acc + (h.amount > 0 ? h.amount : 0), 0);
    const withdrawals = (historyArray || []).reduce((acc, h) => acc + (h.amount < 0 ? Math.abs(h.amount) : 0), 0);
    return { deposits, withdrawals, net: deposits - withdrawals };
  };

  const viewHistory = activeTab === 'All Time' ? allHistory : activeTab === 'Selected Month' ? monthFilteredHistory : [];

  const viewTotals = computeTotals(viewHistory);
  const summaryTotals = computeTotals(allHistory);


  return (
    <div>
      <h2>Savings</h2>

      <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#fff', padding: 6, borderRadius: 999, boxShadow: '0 1px 0 rgba(0,0,0,0.03)' }}>
          {['All Time', 'Selected Month', 'Summary'].map(tab => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 999,
                  border: 'none',
                  background: active ? '#e8f0ff' : 'transparent',
                  color: active ? '#174ea6' : '#444',
                  fontWeight: active ? 600 : 500,
                  cursor: 'pointer'
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 13, color: '#666' }}>Month</label>
            <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} style={{ padding: '6px 8px', borderRadius: 6 }}>
              {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
          </div>

          <button onClick={() => setIsModalOpen(true)} style={{ padding: '8px 12px', borderRadius: 8 }}>
            + Add Saving Goal
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#fff",
            padding: 20,
            borderRadius: 10,
            width: "100%",
            maxWidth: 400
          }}>
            <h3>Add Saving Goal</h3>

            <form onSubmit={handleAddGoal}>

              <input
                type="text"
                name="goalName"
                placeholder="Goal Name"
                value={newGoal.goalName}
                onChange={handleNewGoalChange}
                required
              />

              <input
                type="number"
                name="targetAmount"
                placeholder="Target Amount"
                value={newGoal.targetAmount}
                onChange={handleNewGoalChange}
                required
              />

              <input
                type="number"
                name="savedAmount"
                placeholder="Saved Amount"
                value={newGoal.savedAmount}
                onChange={handleNewGoalChange}
              />

              <input
                type="date"
                name="startDate"
                value={newGoal.startDate}
                onChange={handleNewGoalChange}
              />

              <input
                type="date"
                name="targetDate"
                value={newGoal.targetDate}
                onChange={handleNewGoalChange}
                required
              />

              <input
                type="number"
                placeholder="Monthly Suggestion (auto)"
                value={calculateMonthlySuggestion()}
                readOnly
              />

              <textarea
                name="notes"
                placeholder="Notes (optional)"
                value={newGoal.notes}
                onChange={handleNewGoalChange}
              />

              <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                <button type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit">Save</button>
              </div>

            </form>
          </div>
        </div>
      )}

      {activeTab !== 'Summary' ? (
        <>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 6, flexWrap: "wrap" }}>
            <div style={{ fontSize: 14 }}>Available Balance: <strong>{formatCurrency ? formatCurrency(availableBalance) : `${currencySymbol}${Number(availableBalance).toFixed(2)}`}</strong></div>
            <div style={{ fontSize: 14 }}>Total Deposits: <strong>{formatCurrency ? formatCurrency(viewTotals.deposits) : `${currencySymbol}${Number(viewTotals.deposits).toFixed(2)}`}</strong></div>
            <div style={{ fontSize: 14 }}>Total Withdrawals: <strong>{formatCurrency ? formatCurrency(viewTotals.withdrawals) : `${currencySymbol}${Number(viewTotals.withdrawals).toFixed(2)}`}</strong></div>
          </div>

          <p>Total Savings: {formatCurrency ? formatCurrency(viewTotals.net) : `${currencySymbol}${Number(viewTotals.net).toFixed(2)}`}</p>
        </>
      ) : (
        <div style={{ marginTop: 12, padding: 12, border: '1px solid #e0e0e0', borderRadius: 8, background: '#fafafa' }}>
          <h3>Summary</h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 160 }}>
              <div style={{ fontSize: 12, color: '#666' }}>Total Deposits</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{formatCurrency ? formatCurrency(summaryTotals.deposits) : `${currencySymbol}${Number(summaryTotals.deposits).toFixed(2)}`}</div>
            </div>
            <div style={{ minWidth: 160 }}>
              <div style={{ fontSize: 12, color: '#666' }}>Total Withdrawals</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{formatCurrency ? formatCurrency(summaryTotals.withdrawals) : `${currencySymbol}${Number(summaryTotals.withdrawals).toFixed(2)}`}</div>
            </div>
            <div style={{ minWidth: 160 }}>
              <div style={{ fontSize: 12, color: '#666' }}>Net Savings</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{formatCurrency ? formatCurrency(summaryTotals.net) : `${currencySymbol}${Number(summaryTotals.net).toFixed(2)}`}</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 18, maxHeight: '60vh', overflowY: 'auto', paddingRight: 8 }}>
        {goals.length === 0 && <p>No saving goals yet.</p>}
        {goals.map(goal => {
          const t = parseFloat(goal.targetAmount) || 0;
          const s = parseFloat(goal.savedAmount) || 0;
          const pct = t > 0 ? Math.min(100, (s / t) * 100) : 0;
          const historyForDisplay = Array.isArray(goal.history) ? goal.history.filter(h => {
            if (activeTab !== 'Selected Month') return true;
            const d = new Date(h.date);
            return d.getFullYear() === now.getFullYear() && d.getMonth() === Number(selectedMonth);
          }) : [];
          const remainingAmount = Math.max(0, t - s);
          const remainingTimeText = (() => {
            if (!goal.targetDate) return 'No target date';
            const diff = new Date(goal.targetDate) - new Date();
            if (isNaN(diff)) return 'Invalid date';
            if (diff < 0) return 'Target date passed';
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const months = Math.floor(days / 30);
            const remDays = days % 30;
            if (months > 0) return `${months} month${months > 1 ? 's' : ''}${remDays > 0 ? ` ${remDays} day${remDays > 1 ? 's' : ''}` : ''} left`;
            return `${days} day${days > 1 ? 's' : ''} left`;
          })();
          return (
            <div key={goal.id} style={{ border: "1px solid #eee", padding: 12, borderRadius: 6, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{goal.goalName}</strong>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    {(goal.startDate || goal.targetDate) ? `${goal.startDate ? new Date(goal.startDate).toLocaleDateString() : ''}${goal.startDate && goal.targetDate ? ' → ' : ''}${goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : ''}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div>Target: {formatCurrency ? formatCurrency(t) : `${currencySymbol}${Number(t).toFixed(2)}`}</div>
                  <div>Saved: {formatCurrency ? formatCurrency(s) : `${currencySymbol}${Number(s).toFixed(2)}`}</div>
                  <div>Remaining: {formatCurrency ? formatCurrency(remainingAmount) : `${currencySymbol}${Number(remainingAmount).toFixed(2)}`}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>Time Left: {remainingTimeText}</div>
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <div style={{ height: 10, background: "#f1f1f1", borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: "#4caf50" }} />
                </div>
                <div style={{ fontSize: 12, color: "#444", marginTop: 6 }}>{pct.toFixed(1)}% complete</div>
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                <button className="btn" onClick={() => handleDeposit(goal.id)}>Deposit</button>
                <button className="btn" onClick={() => handleWithdraw(goal.id)}>Withdraw</button>
                <button className="btn" onClick={() => handleEdit(goal.id)}>Edit</button>
                <button className="btn" onClick={() => setConfirm({ open: true, message: "Delete this saving goal? This cannot be undone.", onConfirm: () => handleDelete(goal.id) })}>Delete</button>
              </div>

                  {activeTab !== 'Summary' && historyForDisplay && historyForDisplay.length > 0 && (
                <div style={{ marginTop: 10, fontSize: 13, color: "#333" }}>
                  <strong>History</strong>
                  <div style={{ marginTop: 6, maxHeight: 220, overflowY: "auto", paddingRight: 8 }}>
                    <ul style={{ margin: "0", paddingLeft: 14 }}>
                      {( (historyForDisplay || []).slice().reverse() ).map(entry => {
                        const isDeposit = Number(entry.amount) > 0;
                        const label = isDeposit ? 'Deposit' : 'Withdraw';
                        const amt = Math.abs(Number(entry.amount));
                        const amountDisplay = formatCurrency ? formatCurrency(isDeposit ? amt : -amt) : `${currencySymbol}${amt.toFixed(2)}`;
                        const color = isDeposit ? '#2e7d32' : '#c62828';
                        return (
                          <li key={entry.id} style={{ marginBottom: 6 }}>
                            {new Date(entry.date).toLocaleDateString()} — <span style={{ color }}>{label}</span> {amountDisplay}{entry.note ? ` (${entry.note})` : ""}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>
      <ConfirmModal
        open={confirm.open}
        message={confirm.message}
        onConfirm={() => { confirm.onConfirm && confirm.onConfirm(); setConfirm({ open: false }); }}
        onCancel={() => setConfirm({ open: false })}
      />
    </div>
  );
}

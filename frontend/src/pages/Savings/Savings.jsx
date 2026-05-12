import React, { useEffect, useState, useMemo } from "react";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import FormModal from "../../components/FormModal/FormModal";
import "./SavingsModule.css";
import { api, getCurrentUserId } from "../../services/api";

export default function Savings({ currencySymbol = "₱", formatCurrency, availableBalance = 0, adjustAvailableBalance = () => {}, selectedYear, selectedMonth, setSelectedMonth }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("All Time");

  const [newGoal, setNewGoal] = useState({
    goalName: "",
    targetAmount: "",
    savedAmount: "",
    startDate: "",
    targetDate: "",
    monthlySuggestion: "",
    notes: ""
  });

  const getUserKey = () => {
    try {
      const id = getCurrentUserId();
      return id != null ? `user:${id}` : "guest";
    } catch {
      return "guest";
    }
  };
  const userKey = getUserKey();

  const [goals, setGoals] = useState(() => {
    try {
      const raw = localStorage.getItem("savingGoalsMap");
      const map = raw ? JSON.parse(raw) : {};
      return map[userKey] || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const uid = getCurrentUserId();
    if (!uid) return;
    let mounted = true;
    api.get('/savings')
      .then(data => {
        if (!mounted || !Array.isArray(data)) return;
        const mapped = data.map(s => ({
          id: s.id,
          goalName: s.name,
          targetAmount: s.targetAmount,
          savedAmount: s.currentAmount,
          startDate: s.startDate ? new Date(s.startDate).toISOString().slice(0,10) : '',
          targetDate: s.targetDate ? new Date(s.targetDate).toISOString().slice(0,10) : '',
          monthlySuggestion: '',
          notes: '',
          history: Array.isArray(s.history) ? s.history : [],
          userId: uid
        }));
        setGoals(mapped);
      })
      .catch(() => {
        // ignore - fallback to localStorage
      });
    return () => { mounted = false; };
  }, [userKey]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("savingGoalsMap");
      const map = raw ? JSON.parse(raw) : {};
      map[userKey] = goals || [];
      localStorage.setItem("savingGoalsMap", JSON.stringify(map));
    } catch {}
  }, [goals, userKey]);

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

    const uid = getCurrentUserId();

    if (uid) {
      api.post('/savings', {
        name: newGoal.goalName,
        targetAmount: target,
        currentAmount: saved,
        startDate: startDateVal,
        targetDate: newGoal.targetDate
      .then(s => {
        const newEntry = {
          id: s.id,
          goalName: s.name,
          targetAmount: s.targetAmount,
          savedAmount: s.currentAmount,
          startDate: s.startDate ? new Date(s.startDate).toISOString().slice(0,10) : startDateVal,
          targetDate: s.targetDate ? new Date(s.targetDate).toISOString().slice(0,10) : newGoal.targetDate,
          monthlySuggestion: calculateMonthlySuggestion(),
          notes: newGoal.notes,
          history: Array.isArray(s.history) ? s.history : initialHistory,
          userId: uid
        };
        setGoals(prev => [...prev, newEntry]);
        // persist initial deposit as history entry if provided
        if (initialHistory.length > 0) {
          const entry = initialHistory[0];
          api.put(`/savings/${s.id}`, { currentAmount: s.currentAmount, historyEntry: entry }).catch(() => {});
        }
      }).catch(() => {
        // fallback to local storage behavior
        const newEntry = {
          id: Date.now(),
          goalName: newGoal.goalName,
          targetAmount: target,
          savedAmount: saved,
          startDate: startDateVal,
          targetDate: newGoal.targetDate,
          monthlySuggestion: calculateMonthlySuggestion(),
          notes: newGoal.notes,
          history: initialHistory,
          userId: uid
        };
        setGoals(prev => [...prev, newEntry]);
      });
    } else {
      const newEntry = {
        id: Date.now(),
        goalName: newGoal.goalName,
        targetAmount: target,
        savedAmount: saved,
        startDate: startDateVal,
        targetDate: newGoal.targetDate,
        monthlySuggestion: calculateMonthlySuggestion(),
        notes: newGoal.notes,
        history: initialHistory,
        userId: null
      };
      setGoals(prev => [...prev, newEntry]);
    }

    if (saved > 0) {
      try { adjustAvailableBalance && adjustAvailableBalance(-Math.abs(saved)); } catch {}
    }

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
    const uid = getCurrentUserId();
    setGoals(prev => prev.map(g => {
      if (g.id !== goalId) return g;
      const history = Array.isArray(g.history) ? [...g.history] : [];
      const entry = { id: Date.now() + Math.floor(Math.random() * 1000), date: new Date().toISOString().slice(0, 10), amount: Number(amount), note: note || "" };
      const nextSaved = Number(g.savedAmount || 0) + Number(amount);
      if (uid && g.id) {
        api.put(`/savings/${g.id}`, { currentAmount: nextSaved, historyEntry: entry }).catch(() => {});
      }
      return { ...g, history: [...history, entry], savedAmount: nextSaved };
    }));
  };
  const [modalState, setModalState] = useState({ open: false, mode: null, goalId: null, initial: {} });

  const handleDepositConfirm = ({ amount, note }) => {
    const amt = Number(amount || 0);
    if (isNaN(amt) || amt <= 0) return window.alert("Please enter a positive number.");
    const avail = Number(availableBalance || 0);
    if (amt > avail) return window.alert("Insufficient available balance for this deposit.");
    addHistoryEntry(modalState.goalId, Math.abs(amt), note || "");
    try { adjustAvailableBalance && adjustAvailableBalance(-Math.abs(amt)); } catch {}
    setModalState({ open: false, mode: null, goalId: null, initial: {} });
  };

  const handleWithdrawConfirm = ({ amount, note }) => {
    const goal = goals.find(g => g.id === modalState.goalId);
    const amt = Number(amount || 0);
    if (isNaN(amt) || amt <= 0) return window.alert("Please enter a positive number.");
    const currentSaved = Number(goal?.savedAmount || 0);
    if (amt > currentSaved) return window.alert("Insufficient saved amount for this withdrawal.");
    addHistoryEntry(modalState.goalId, -Math.abs(amt), note || "");
    try { adjustAvailableBalance && adjustAvailableBalance(Math.abs(amt)); } catch {}
    setModalState({ open: false, mode: null, goalId: null, initial: {} });
  };

  const handleEditConfirm = ({ goalName, targetAmount, targetDate }) => {
    const uid = getCurrentUserId();
    const data = { name: goalName, targetAmount: Number(targetAmount), targetDate };
    if (uid) {
      api.put(`/savings/${modalState.goalId}`, data).then(updated => {
        setGoals(prev => prev.map(g => g.id === modalState.goalId ? { ...g, goalName: updated.name, targetAmount: updated.targetAmount, targetDate: updated.targetDate ? new Date(updated.targetDate).toISOString().slice(0,10) : g.targetDate } : g));
      }).catch(() => {
        setGoals(prev => prev.map(g => g.id === modalState.goalId ? { ...g, goalName: goalName || g.goalName, targetAmount: Number(targetAmount) || g.targetAmount, targetDate: targetDate || g.targetDate } : g));
      }).finally(() => setModalState({ open: false, mode: null, goalId: null, initial: {} }));
    } else {
      setGoals(prev => prev.map(g => g.id === modalState.goalId ? { ...g, goalName: goalName || g.goalName, targetAmount: Number(targetAmount) || g.targetAmount, targetDate: targetDate || g.targetDate } : g));
      setModalState({ open: false, mode: null, goalId: null, initial: {} });
    }
  };

  const handleDelete = (goalId) => {
    const uid = getCurrentUserId();
    if (uid) {
      api.delete(`/savings/${goalId}`).then(() => setGoals(prev => prev.filter(g => g.id !== goalId))).catch(() => setGoals(prev => prev.filter(g => g.id !== goalId)));
    } else {
      setGoals(prev => prev.filter(g => g.id !== goalId));
    }
  };

  const [confirm, setConfirm] = useState({ open: false, message: "", onConfirm: null });

  const allHistory = (goals || []).reduce((acc, g) => acc.concat((g.history || []).map(h => ({ ...h, goalId: g.id }))), []);

  const months = useMemo(() => [
    'January','February','March','April','May','June','July','August','September','October','November','December'
  ], []);

  const monthFilteredHistory = useMemo(() => {
    return allHistory.filter(h => {
      const d = new Date(h.date);
      return d.getFullYear() === (Number(selectedYear) || new Date().getFullYear()) && d.getMonth() === Number(selectedMonth);
    });
  }, [allHistory, selectedMonth, selectedYear]);

  const computeTotals = (historyArray) => {
    const deposits = (historyArray || []).reduce((acc, h) => acc + (h.amount > 0 ? h.amount : 0), 0);
    const withdrawals = (historyArray || []).reduce((acc, h) => acc + (h.amount < 0 ? Math.abs(h.amount) : 0), 0);
    return { deposits, withdrawals, net: deposits - withdrawals };
  };

  const viewHistory = activeTab === 'All Time' ? allHistory : activeTab === 'Selected Month' ? monthFilteredHistory : [];

  const viewTotals = computeTotals(viewHistory);
  const summaryTotals = computeTotals(allHistory);


  return (
    <div className="savings-root">
      <h2>Savings</h2>

      <div className="savings-controls">
        <div className="savings-pill-group">
          {['All Time', 'Selected Month', 'Summary'].map(tab => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={"savings-pill" + (active ? ' active' : '')}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <div className="savings-controls-right">
          <div className="savings-month">
            <label className="savings-small-label">Month</label>
            <select className="savings-select" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
              {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
          </div>

          <button className="savings-add-button" onClick={() => setIsModalOpen(true)}>
            + Add Saving Goal
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="savings-modal-overlay">
          <div className="savings-modal">
            <h3>Add Saving Goal</h3>

            <form onSubmit={handleAddGoal}>

              <label className="savings-form-label">Goal Name</label>
              <input
                type="text"
                name="goalName"
                placeholder="Enter goal name"
                value={newGoal.goalName}
                onChange={handleNewGoalChange}
                required
              />

              <label className="savings-form-label">Target Amount</label>
              <input
                type="number"
                name="targetAmount"
                placeholder="Enter target amount"
                value={newGoal.targetAmount}
                onChange={handleNewGoalChange}
                required
              />

              <label className="savings-form-label">Saved Amount</label>
              <input
                type="number"
                name="savedAmount"
                placeholder="Enter saved amount"
                value={newGoal.savedAmount}
                onChange={handleNewGoalChange}
              />

              <label className="savings-form-label">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={newGoal.startDate}
                onChange={handleNewGoalChange}
              />

              <label className="savings-form-label">Target Date</label>
              <input
                type="date"
                name="targetDate"
                value={newGoal.targetDate}
                onChange={handleNewGoalChange}
                required
              />

              <label className="savings-form-label">Monthly Suggestion</label>
              <input
                type="number"
                placeholder="Monthly Suggestion"
                value={calculateMonthlySuggestion()}
                readOnly
              />

              <label className="savings-form-label">Notes(Optional)</label>
              <textarea
                name="notes"
                placeholder="Enter a helpful message"
                value={newGoal.notes}
                onChange={handleNewGoalChange}
              />

              <div className="savings-modal-actions">
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
          <div className="savings-stats">
            <div className="savings-stat">Available Balance: <strong>{formatCurrency ? formatCurrency(availableBalance) : `${currencySymbol}${Number(availableBalance).toFixed(2)}`}</strong></div>
            <div className="savings-stat">{activeTab === 'Selected Month' ? 'This Month Deposits' : 'Total Deposits'}: <strong>{formatCurrency ? formatCurrency(viewTotals.deposits) : `${currencySymbol}${Number(viewTotals.deposits).toFixed(2)}`}</strong></div>
            <div className="savings-stat">{activeTab === 'Selected Month' ? 'This Month Withdrawals' : 'Total Withdrawals'}: <strong>{formatCurrency ? formatCurrency(viewTotals.withdrawals) : `${currencySymbol}${Number(viewTotals.withdrawals).toFixed(2)}`}</strong></div>
          </div>

          <p>Total Savings: {formatCurrency ? formatCurrency(viewTotals.net) : `${currencySymbol}${Number(viewTotals.net).toFixed(2)}`}</p>
        </>
      ) : (
        <div className="savings-summary-panel">
          <h3>Summary</h3>
          <div className="savings-summary-items">
            <div className="savings-summary-item">
              <div className="savings-summary-label">Total Deposits</div>
              <div className="savings-summary-value">{formatCurrency ? formatCurrency(summaryTotals.deposits) : `${currencySymbol}${Number(summaryTotals.deposits).toFixed(2)}`}</div>
            </div>
            <div className="savings-summary-item">
              <div className="savings-summary-label">Total Withdrawals</div>
              <div className="savings-summary-value">{formatCurrency ? formatCurrency(summaryTotals.withdrawals) : `${currencySymbol}${Number(summaryTotals.withdrawals).toFixed(2)}`}</div>
            </div>
            <div className="savings-summary-item">
              <div className="savings-summary-label">Net Savings</div>
              <div className="savings-summary-value">{formatCurrency ? formatCurrency(summaryTotals.net) : `${currencySymbol}${Number(summaryTotals.net).toFixed(2)}`}</div>
            </div>
          </div>
        </div>
      )}

      <div className="savings-list-container">
        {goals.length === 0 && <p>No saving goals yet.</p>}
          {goals.map(goal => {
          const t = parseFloat(goal.targetAmount) || 0;
          const s = parseFloat(goal.savedAmount) || 0;
          const pct = t > 0 ? Math.min(100, (s / t) * 100) : 0;
          const historyForDisplay = Array.isArray(goal.history) ? goal.history.filter(h => {
            if (activeTab !== 'Selected Month') return true;
            const d = new Date(h.date);
            return d.getFullYear() === (Number(selectedYear) || new Date().getFullYear()) && d.getMonth() === Number(selectedMonth);
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
            <div key={goal.id} className="savings-goal-card">
              <div className="savings-goal-header">
                <div>
                  <strong>{goal.goalName}</strong>
                  <div className="savings-goal-dates">
                    {(goal.startDate || goal.targetDate) ? `${goal.startDate ? new Date(goal.startDate).toLocaleDateString() : ''}${goal.startDate && goal.targetDate ? ' → ' : ''}${goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : ''}` : ''}
                  </div>
                </div>
                <div className="savings-goal-meta">
                  <div>Target: {formatCurrency ? formatCurrency(t) : `${currencySymbol}${Number(t).toFixed(2)}`}</div>
                  <div>Saved: {formatCurrency ? formatCurrency(s) : `${currencySymbol}${Number(s).toFixed(2)}`}</div>
                  <div>Remaining: {formatCurrency ? formatCurrency(remainingAmount) : `${currencySymbol}${Number(remainingAmount).toFixed(2)}`}</div>
                  <div className="savings-goal-time">Time Left: {remainingTimeText}</div>
                </div>
              </div>

              <div className="savings-progress-wrap">
                <div className="savings-progress">
                  <div className="savings-progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="savings-progress-label">{pct.toFixed(1)}% complete</div>
              </div>
              <div className="savings-goal-actions">
                <button className="btn" onClick={() => setModalState({ open: true, mode: 'deposit', goalId: goal.id, initial: { amount: '', note: '' } })}>Deposit</button>
                <button className="btn" onClick={() => setModalState({ open: true, mode: 'withdraw', goalId: goal.id, initial: { amount: '', note: '' } })}>Withdraw</button>
                <button className="btn" onClick={() => setModalState({ open: true, mode: 'edit', goalId: goal.id, initial: { goalName: goal.goalName || '', targetAmount: goal.targetAmount || '', targetDate: goal.targetDate || '' } })}>Edit</button>
                <button className="btn" onClick={() => setConfirm({ open: true, message: "Delete this saving goal? This cannot be undone.", onConfirm: () => handleDelete(goal.id) })}>Delete</button>
              </div>


                  {activeTab !== 'Summary' && historyForDisplay && historyForDisplay.length > 0 && (
                <div className="savings-history">
                  <strong>History</strong>
                  <div className="savings-history-list">
                    <ul className="savings-history-ul">
                      {( (historyForDisplay || []).slice().reverse() ).map(entry => {
                        const isDeposit = Number(entry.amount) > 0;
                        const label = isDeposit ? 'Deposit' : 'Withdraw';
                        const amt = Math.abs(Number(entry.amount));
                        const amountDisplay = formatCurrency ? formatCurrency(isDeposit ? amt : -amt) : `${currencySymbol}${amt.toFixed(2)}`;
                        return (
                          <li key={entry.id} className="savings-history-item">
                            {new Date(entry.date).toLocaleDateString()} — <span className={isDeposit ? 'savings-deposit' : 'savings-withdraw'}>{label}</span> {amountDisplay}{entry.note ? ` (${entry.note})` : ""}
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
      <FormModal
        open={modalState.open}
        title={(() => {
          const goal = goals.find(g => g.id === modalState.goalId) || {};
          if (modalState.mode === 'deposit') return `Deposit to ${goal.goalName || 'goal'}`;
          if (modalState.mode === 'withdraw') return `Withdraw from ${goal.goalName || 'goal'}`;
          return `Edit ${goal.goalName || 'goal'}`;
        })()}
        initialValues={modalState.initial}
        fields={(() => {
          if (modalState.mode === 'deposit' || modalState.mode === 'withdraw') return [
            { name: 'amount', label: 'Amount', type: 'number', placeholder: 'Amount' },
            { name: 'note', label: 'Note (optional)', type: 'textarea', placeholder: 'Note' }
          ];
          return [
            { name: 'goalName', label: 'Goal name', type: 'text' },
            { name: 'targetAmount', label: 'Target amount', type: 'number' },
            { name: 'targetDate', label: 'Target date', type: 'date' }
          ];
        })()}
        onCancel={() => setModalState({ open: false, mode: null, goalId: null, initial: {} })}
        onSubmit={(values) => {
          if (modalState.mode === 'deposit') return handleDepositConfirm(values);
          if (modalState.mode === 'withdraw') return handleWithdrawConfirm(values);
          return handleEditConfirm(values);
        }}
        submitLabel={modalState.mode === 'withdraw' ? 'Withdraw' : modalState.mode === 'deposit' ? 'Deposit' : 'Save'}
      />
    </div>
  );
}

import React, { useEffect, useState, useMemo } from "react";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import FormModal from "../../components/FormModal/FormModal";
import "./SavingsGoalsModule.css";
import { api, getCurrentUserId, setCurrentUser } from "../../services/api";
import TransactionFeed from "../../components/TransactionFeed/TransactionFeed";
import SavingsControls from "../../features/savingsGoals/components/SavingsControls";
import toast from 'react-hot-toast';

export default function SavingsGoals({ currencySymbol = "₱", formatCurrency, availableBalance = 0, adjustAvailableBalance = () => {}, selectedYear, selectedMonth, setSelectedMonth, onSavingsUpdated, savingsHistory = [] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Selected Month");

  const [newGoal, setNewGoal] = useState({
    goalName: "",
    targetAmount: "",
    savedAmount: "",
    startDate: "",
    targetDate: "",
    monthlySuggestion: "",
    notes: ""
  });

  const [goals, setGoals] = useState([]);
  const [dashboardTotals, setDashboardTotals] = useState(null);

  const fetchSavings = async () => {
    const uid = getCurrentUserId();
    if (!uid) return;
    try {
      // fetch savings list and authoritative transactions, then reconcile
      const sList = await api.get('/savings');
      // prefer centralized, pre-filtered savingsHistory prop when available (use empty array as authoritative)
      const txList = Array.isArray(savingsHistory) ? savingsHistory : await api.get(`/savings/history/${uid}`);
      if (!Array.isArray(sList)) return;
      const mapped = sList.map(s => ({
        id: s.id,
        goalName: s.name,
        targetAmount: s.targetAmount,
        savedAmount: s.currentAmount, // server-calculated from transactions
        startDate: s.startDate ? new Date(s.startDate).toISOString().slice(0,10) : '',
        targetDate: s.targetDate ? new Date(s.targetDate).toISOString().slice(0,10) : '',
        monthlySuggestion: '',
        notes: '',
        history: Array.isArray(txList) ? txList.filter(t => Number(t.savingsId) === Number(s.id)).map(h => ({ ...h, date: h.date || h.createdAt || h.transactionDate || h.timestamp || h.created_at || h.time })) : [],
        userId: uid
      }));
      setGoals(mapped);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSavingsBalance = async () => {
    const uid = getCurrentUserId();
    if (!uid) return null;
    try {
      const data = await api.get(`/savings/balance/${uid}`);
      // returns { total, perSavings: [{ savingsId, balance }] }
      return data;
    } catch (e) {
      console.error('Failed to fetch savings balance', e);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => { if (!mounted) return; await fetchSavings(); };
    load();
    // fetch dashboard totals (monthlyBudgetRemaining, totalNetWorth)
    (async () => {
      try {
        const d = await api.get('/dashboard');
        if (d && d.totals) setDashboardTotals(d.totals);
      } catch (e) { /* ignore */ }
    })();
    return () => { mounted = false; };
  }, [savingsHistory]);

  

  // no localStorage persistence: server is the source of truth

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
      const t = toast.loading('Creating savings goal...');
      api.post('/savings', {
        name: newGoal.goalName,
        targetAmount: target,
        currentAmount: saved,
        startDate: startDateVal,
        targetDate: newGoal.targetDate
      })
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
          history: [],
          userId: uid
        };
        // add to local list then reconcile with server
        setGoals(prev => [...prev, newEntry]);
        if (initialHistory.length > 0) {
          const entry = initialHistory[0];
          api.post('/savings/deposit', { savingsId: s.id, amount: entry.amount, note: entry.note })
            .then(() => { fetchSavings(); try { adjustAvailableBalance && adjustAvailableBalance(-entry.amount); } catch (e) { console.warn('adjustAvailableBalance failed', e); } })
            .catch(() => fetchSavings());
          try { if (typeof onSavingsUpdated === 'function') onSavingsUpdated(); } catch (e) {}
        } else {
          fetchSavings();
          try { if (typeof onSavingsUpdated === 'function') onSavingsUpdated(); } catch (e) {}
        }
        toast.success('Savings goal added successfully', { id: t });
      }).catch((err) => {
        toast.error('Failed to save savings goal');
        console.error('Failed to create saving on server, falling back to local state', err);
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
      if (saved > 0) {
        try { adjustAvailableBalance && adjustAvailableBalance(-Number(saved)); } catch (e) { console.warn('adjustAvailableBalance failed', e); }
      }
    }

    if (saved > 0) {
      // available balance is authoritative elsewhere; avoid optimistic local mutation
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

  const addHistoryEntry = async (goalId, amount, note) => {
    const uid = getCurrentUserId();
    const isDeposit = Number(amount) > 0;
    if (!uid) {
      // guest fallback: update local state only
      setGoals(prev => prev.map(g => {
        if (g.id !== goalId) return g;
        const history = Array.isArray(g.history) ? [...g.history] : [];
        const entry = { id: Date.now() + Math.floor(Math.random() * 1000), date: new Date().toISOString().slice(0, 10), amount: Number(amount), note: note || "" };
        const nextSaved = Number(g.savedAmount || 0) + Number(amount);
        return { ...g, history: [...history, entry], savedAmount: nextSaved };
      }));
      // adjust available balance in parent (deposit reduces available, withdraw increases it)
      try { adjustAvailableBalance && adjustAvailableBalance(-Number(amount)); } catch (e) { console.warn('adjustAvailableBalance failed', e); }
      return;
    }

    try {
        const t = toast.loading(isDeposit ? 'Adding deposit...' : 'Processing withdrawal...');
        const body = { savingsId: goalId, amount: Math.abs(Number(amount)), note };
      if (isDeposit) {
        await api.post('/savings/deposit', body);
      } else {
        await api.post('/savings/withdraw', body);
      }
      // refetch authoritative data from server (balance and history)
      await Promise.all([fetchSavings(), fetchSavingsBalance()]);
      try {
        const u = await api.get('/user/me');
        try { setCurrentUser(u); } catch (e) {}
      } catch (e) { /* ignore */ }
      // update available balance after successful transaction (local adjustment fallback)
      try { adjustAvailableBalance && adjustAvailableBalance(-Number(amount)); } catch (e) { console.warn('adjustAvailableBalance failed', e); }
      // refresh dashboard totals in parent
      try { if (typeof onSavingsUpdated === 'function') await onSavingsUpdated(); } catch (e) { console.warn('onSavingsUpdated failed', e); }
      console.debug('Refetched savings and balances from server');
        toast.success(isDeposit ? 'Deposit added successfully' : 'Withdrawal processed successfully', { id: t });
    } catch (e) {
      // if server fails, do not rely on local-only mutations
        toast.error('Failed to process transaction');
        console.error('Failed to persist transaction', e);
    }
  };
  const [modalState, setModalState] = useState({ open: false, mode: null, goalId: null, initial: {} });

  const handleDepositConfirm = ({ amount, note }) => {
    const amt = Number(amount || 0);
    if (isNaN(amt) || amt <= 0) return window.alert("Please enter a positive number.");
    const avail = Number(availableBalance || 0);
    if (amt > avail) return window.alert("Insufficient available balance for this deposit.");
    addHistoryEntry(modalState.goalId, Math.abs(amt), note || "");
    setModalState({ open: false, mode: null, goalId: null, initial: {} });
  };

  const handleWithdrawConfirm = ({ amount, note }) => {
    const goal = goals.find(g => g.id === modalState.goalId);
    const amt = Number(amount || 0);
    if (isNaN(amt) || amt <= 0) return window.alert("Please enter a positive number.");
    const currentSaved = Number(goal?.savedAmount || 0);
    if (amt > currentSaved) return window.alert("Insufficient saved amount for this withdrawal.");
    addHistoryEntry(modalState.goalId, -Math.abs(amt), note || "");
    setModalState({ open: false, mode: null, goalId: null, initial: {} });
  };

  const handleEditConfirm = ({ goalName, targetAmount, targetDate }) => {
    const uid = getCurrentUserId();
    const data = { name: goalName, targetAmount: Number(targetAmount), targetDate };
    if (uid) {
      const t = toast.loading('Updating savings goal...');
      api.put(`/savings/${modalState.goalId}`, data).then(updated => {
        setGoals(prev => prev.map(g => g.id === modalState.goalId ? { ...g, goalName: updated.name, targetAmount: updated.targetAmount, targetDate: updated.targetDate ? new Date(updated.targetDate).toISOString().slice(0,10) : g.targetDate } : g));
        toast.success('Savings goal updated successfully', { id: t });
      }).catch(() => {
        toast.error('Failed to update savings goal', { id: t });
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
      const t = toast.loading('Deleting savings goal...');
      api.delete(`/savings/${goalId}?restoreAvailable=true`)
        .then(async () => {
          setGoals(prev => prev.filter(g => g.id !== goalId));
          try {
            await Promise.all([fetchSavings(), fetchSavingsBalance()]);
            const u = await api.get('/user/me');
            try { setCurrentUser(u); } catch (e) {}
              try { if (typeof onSavingsUpdated === 'function') await onSavingsUpdated(); } catch (e) { console.warn('onSavingsUpdated failed', e); }
          } catch (e) {
            console.warn('Post-delete refresh failed', e);
          }
          toast.success('Savings goal deleted successfully', { id: t });
        })
        .catch(() => { toast.error('Failed to delete savings goal', { id: t }); setGoals(prev => prev.filter(g => g.id !== goalId)); });
    } else {
      setGoals(prev => prev.filter(g => g.id !== goalId));
    }
  };

  const [confirm, setConfirm] = useState({ open: false, message: "", onConfirm: null });

  const [editEntryModal, setEditEntryModal] = useState({ open: false, goalId: null, entry: null });

  const openEditEntry = (goalId, entry) => {
    setEditEntryModal({ open: true, goalId, entry: { ...entry, amount: Math.abs(Number(entry.amount || 0)), note: entry.note || '', _originalAmount: Number(entry.amount || 0), _type: entry.type } });
  };

  const handleEditEntryConfirm = async ({ amount, note }) => {
    const e = editEntryModal.entry;
    if (!e) return setEditEntryModal({ open: false, goalId: null, entry: null });
    const amt = Number(amount || 0);
    if (isNaN(amt) || amt <= 0) return window.alert('Please enter a positive number.');
    const uid = getCurrentUserId();
    const oldSigned = Number(e.amount) * (Number(e.amount) === Math.abs(Number(e.amount)) ? (e.amount >= 0 ? 1 : -1) : 1); // preserve sign
    // However e.amount stored here is the absolute value we set earlier; get original signed from original entry
    const originalSigned = Number(editEntryModal.entry ? (editEntryModal.entry._originalAmount ?? editEntryModal.entry.amount) : 0);
    try {
      if (!uid) {
        // local-only: update state
        setGoals(prev => prev.map(g => {
          if (g.id !== editEntryModal.goalId) return g;
          const history = (g.history || []).map(h => h.id === e.id ? { ...h, amount: (h.amount > 0 ? amt : -Math.abs(amt)), note: note || '' } : h);
          const saved = history.reduce((acc, h) => acc + Number(h.amount || 0), 0);
          return { ...g, history, savedAmount: saved };
        }));
        setEditEntryModal({ open: false, goalId: null, entry: null });
        return;
      }

      const oldSigned = Number(e._originalAmount || Number(e.amount || 0));
      const newSigned = (e._type === 'deposit') ? Number(amt) : -Math.abs(Number(amt));
      await api.put(`/savings/history/${e.id}`, { amount: Math.abs(amt), note });
      // compute delta for available balance: delta = -(newSigned - oldSigned)
      const deltaAvail = -(newSigned - oldSigned);
      try { adjustAvailableBalance && adjustAvailableBalance(deltaAvail); } catch (err) { console.warn('adjustAvailableBalance failed', err); }
      await Promise.all([fetchSavings(), fetchSavingsBalance()]);
      try { const u = await api.get('/user/me'); try { setCurrentUser(u); } catch (e) {} } catch (e) {}
      try { if (typeof onSavingsUpdated === 'function') await onSavingsUpdated(); } catch (e) { console.warn('onSavingsUpdated failed', e); }
    } catch (err) {
      console.error('Failed to edit transaction', err);
    } finally {
      setEditEntryModal({ open: false, goalId: null, entry: null });
    }
  };

  const handleDeleteEntry = (goalId, entry) => {
    const uid = getCurrentUserId();
    if (!uid) {
      // local-only
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, history: (g.history || []).filter(h => h.id !== entry.id), savedAmount: ( (g.history || []).filter(h => h.id !== entry.id).reduce((acc,h) => acc + Number(h.amount||0), 0) ) } : g));
      return;
    }
    setConfirm({ open: true, message: 'Delete this transaction? This cannot be undone.', onConfirm: async () => {
      try {
        await api.delete(`/savings/history/${entry.id}`);
        // deltaAvailable = oldSigned (since new becomes 0): oldSigned is entry.amount
        const oldSigned = Number(entry.amount || 0);
        try { adjustAvailableBalance && adjustAvailableBalance(oldSigned); } catch (err) { console.warn('adjustAvailableBalance failed', err); }
        await Promise.all([fetchSavings(), fetchSavingsBalance()]);
        try { const u = await api.get('/user/me'); try { setCurrentUser(u); } catch (e) {} } catch (e) {}
        try { if (typeof onSavingsUpdated === 'function') await onSavingsUpdated(); } catch (e) { console.warn('onSavingsUpdated failed', e); }
      } catch (err) {
        console.error('Failed to delete transaction', err);
      }
    } });
  };

  const allHistory = (goals || []).reduce((acc, g) => acc.concat((g.history || []).map(h => ({ ...h, goalId: g.id }))), []);

  const monthFilteredHistory = useMemo(() => {
    return allHistory.filter(h => {
      const d = new Date(h.date);
      return d.getFullYear() === (Number(selectedYear) || new Date().getFullYear()) && d.getMonth() === Number(selectedMonth);
    });
  }, [allHistory, selectedMonth, selectedYear]);

  useEffect(() => {
    // debug: log counts of month-filtered history for current selection
    try {
      const hf = monthFilteredHistory || [];
    } catch (e) {}
  }, [monthFilteredHistory, selectedYear, selectedMonth]);

  const computeTotals = (historyArray) => {
    const deposits = (historyArray || []).reduce((acc, h) => acc + (h.amount > 0 ? h.amount : 0), 0);
    const withdrawals = (historyArray || []).reduce((acc, h) => acc + (h.amount < 0 ? Math.abs(h.amount) : 0), 0);
    return { deposits, withdrawals, net: deposits - withdrawals };
  };

  const viewHistory = activeTab === 'All Time' ? allHistory : activeTab === 'Selected Month' ? monthFilteredHistory : [];

  const viewTotals = computeTotals(viewHistory);
  const summaryTotals = computeTotals(allHistory);

  const openAddGoal = () => {
    setNewGoal(prev => ({ ...prev, startDate: new Date().toISOString().slice(0, 10) }));
    setIsModalOpen(true);
  };

  return (
    <div className="savings-root">
      <h2>Savings</h2>
      {dashboardTotals && (
        <div style={{ marginBottom: 12 }}>
          <div><strong>Monthly Budget Remaining:</strong> {currencySymbol}{Number(dashboardTotals.monthlyBudgetRemaining || 0).toFixed(2)}</div>
          <div><strong>Total Net Worth:</strong> {currencySymbol}{Number(dashboardTotals.totalNetWorth || 0).toFixed(2)}</div>
        </div>
      )}

      <SavingsControls activeTab={activeTab} onTabChange={setActiveTab} onAddGoal={openAddGoal} />

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
                    {/* Render savings history using shared TransactionFeed; map entries to include goal context */}
                    <div>
                      <TransactionFeed transactions={(historyForDisplay || []).slice().reverse().map(entry => ({ ...entry, id: `s-${entry.id}`, goalName: goal.goalName, savingsId: goal.id, type: Number(entry.amount) > 0 ? 'savings_deposit' : 'savings_withdraw' }))} currencySymbol={currencySymbol} formatCurrency={formatCurrency} />
                    </div>
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
      <FormModal
        open={editEntryModal.open}
        title={editEntryModal.entry ? `Edit Transaction` : 'Edit Transaction'}
        initialValues={editEntryModal.entry ? { amount: editEntryModal.entry.amount, note: editEntryModal.entry.note } : { amount: '', note: '' }}
        fields={[
          { name: 'amount', label: 'Amount', type: 'number', placeholder: 'Amount' },
          { name: 'note', label: 'Note (optional)', type: 'textarea', placeholder: 'Note' }
        ]}
        onCancel={() => setEditEntryModal({ open: false, goalId: null, entry: null })}
        onSubmit={(values) => handleEditEntryConfirm(values)}
        submitLabel={'Save'}
      />
    </div>
  );
}

import React, { useEffect, useState, useMemo, useRef } from "react";
import ConfirmModal from "../../../components/ConfirmModal/ConfirmModal";
import FormModal from "../../../components/FormModal/FormModal";
import "./SavingsGoalsModule.css";
import { api, getCurrentUserId, setCurrentUser } from "../../../services/api";
import TransactionFeed from "../../../components/TransactionFeed/TransactionFeed";
import SavingsSummaryPanel from "../components/SavingsSummaryPanel";
import SavingsGoalModal from "../components/SavingsGoalModal";
import TransferSourceModal from "../components/TransferSourceModal";
import SavingsAccountSelector from "../components/SavingsAccountSelector";
import VisualSavingsAccounts from "../components/VisualSavingsAccounts";
import toast from 'react-hot-toast';
import { Edit2, Trash2 } from "lucide-react";

export default function SavingsGoals({ currencySymbol = "₱", formatCurrency, availableBalance = 0, adjustAvailableBalance = () => {}, selectedYear, selectedMonth, setSelectedMonth, onSavingsUpdated, savingsHistory = [] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGoalSubmitting, setIsGoalSubmitting] = useState(false);
  const [isTransactionSubmitting, setIsTransactionSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("Selected Month");
  const [goalFilter, setGoalFilter] = useState("all");
  const [sortValue, setSortValue] = useState("newest");
  const [viewMode, setViewMode] = useState("list");

  const [newGoal, setNewGoal] = useState({
    goalName: "",
    category: "",
    targetAmount: "",
    savedAmount: "",
    startDate: "",
    targetDate: "",
    notes: ""
  });

  const [goals, setGoals] = useState([]);
  const [dashboardTotals, setDashboardTotals] = useState(null);
  const savingsFetchSequence = useRef(0);

  const fetchSavings = async () => {
    const uid = getCurrentUserId();
    if (!uid) return;
    const requestSequence = ++savingsFetchSequence.current;
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
        category: s.category || '',
        notes: s.notes || '',
        history: Array.isArray(txList) ? txList.filter(t => Number(t.savingsId) === Number(s.id)).map(h => ({ ...h, date: h.date || h.createdAt || h.transactionDate || h.timestamp || h.created_at || h.time })) : [],
        userId: uid
      }));
      if (requestSequence === savingsFetchSequence.current) {
        setGoals(mapped);
      }
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

  const handleAddGoal = async (values) => {
    const target = Number(values.targetAmount);
    const saved = Number(values.savedAmount || 0);

    if (!values.goalName || !target) return;

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

    const startDateVal = values.startDate || new Date().toISOString().slice(0,10);

    const initialHistory = saved > 0 ? [{ id: Date.now() + 1, date: startDateVal, amount: Number(saved), note: "Initial deposit" }] : [];

    const uid = getCurrentUserId();
    setIsGoalSubmitting(true);

    try {
      if (uid) {
        const t = toast.loading('Creating savings goal...');
        const s = await api.post('/savings', {
          name: values.goalName,
          category: values.category,
          notes: values.notes,
          targetAmount: target,
          currentAmount: saved,
          startDate: startDateVal,
          targetDate: values.targetDate || undefined
        });
        const newEntry = {
          id: s.id,
          goalName: s.name,
          targetAmount: s.targetAmount,
          savedAmount: s.currentAmount,
          startDate: s.startDate ? new Date(s.startDate).toISOString().slice(0,10) : startDateVal,
          targetDate: s.targetDate ? new Date(s.targetDate).toISOString().slice(0,10) : values.targetDate,
          category: s.category || values.category,
          notes: s.notes || values.notes,
          history: [],
          userId: uid
        };
        // add to local list then reconcile with server
        setGoals(prev => [...prev, newEntry]);
        if (initialHistory.length > 0) {
          const entry = initialHistory[0];
          await api.post('/savings/deposit', { savingsId: s.id, amount: entry.amount, note: entry.note });
          try { adjustAvailableBalance && adjustAvailableBalance(-entry.amount); } catch (e) { console.warn('adjustAvailableBalance failed', e); }
          if (typeof onSavingsUpdated === 'function') await onSavingsUpdated();
          else await fetchSavings();
        } else {
          if (typeof onSavingsUpdated === 'function') await onSavingsUpdated();
          else await fetchSavings();
        }
        toast.success('Savings goal added successfully', { id: t });
      } else {
        const newEntry = {
          id: Date.now(),
          goalName: values.goalName,
          targetAmount: target,
          savedAmount: saved,
          startDate: startDateVal,
          targetDate: values.targetDate,
          category: values.category,
          notes: values.notes,
          history: initialHistory,
          userId: uid
        };
        setGoals(prev => [...prev, newEntry]);
        if (saved > 0) {
          try { adjustAvailableBalance && adjustAvailableBalance(-Number(saved)); } catch (e) { console.warn('adjustAvailableBalance failed', e); }
        }
      }
    } catch (err) {
      toast.error('Failed to save savings goal');
      console.error('Failed to create saving on server', err);
      return;
    } finally {
      setIsGoalSubmitting(false);
    }

    if (saved > 0) {
      // available balance is authoritative elsewhere; avoid optimistic local mutation
    }

    setNewGoal({
      goalName: "",
      category: "",
      targetAmount: "",
      savedAmount: "",
      startDate: "",
      targetDate: "",
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
        const t = toast.loading(isDeposit ? 'Adding savings...' : 'Processing withdrawal...');
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
        toast.success(isDeposit ? 'Savings added successfully' : 'Withdrawal processed successfully', { id: t });
    } catch (e) {
      // if server fails, do not rely on local-only mutations
        toast.error('Failed to process transaction');
        console.error('Failed to persist transaction', e);
    }
  };
  const [modalState, setModalState] = useState({ open: false, mode: null, goalId: null, initial: {} });

  const handleDepositConfirm = async ({ amount, sourceLabel }) => {
    const amt = Number(amount || 0);
    if (isNaN(amt) || amt <= 0) return window.alert("Please enter a positive number.");
    const avail = Number(availableBalance || 0);
    if (amt > avail) return window.alert("Insufficient available balance for these savings.");
    setIsTransactionSubmitting(true);
    try {
      await addHistoryEntry(modalState.goalId, Math.abs(amt), `Transfer from ${sourceLabel}`);
      setModalState({ open: false, mode: null, goalId: null, initial: {} });
    } finally {
      setIsTransactionSubmitting(false);
    }
  };

  const handleWithdrawConfirm = async ({ amount, sourceLabel }) => {
    const goal = goals.find(g => g.id === modalState.goalId);
    const amt = Number(amount || 0);
    if (isNaN(amt) || amt <= 0) return window.alert("Please enter a positive number.");
    const currentSaved = Number(goal?.savedAmount || 0);
    if (amt > currentSaved) return window.alert("Insufficient saved amount for this withdrawal.");
    setIsTransactionSubmitting(true);
    try {
      await addHistoryEntry(modalState.goalId, -Math.abs(amt), `Transfer to ${sourceLabel}`);
      setModalState({ open: false, mode: null, goalId: null, initial: {} });
    } finally {
      setIsTransactionSubmitting(false);
    }
  };

  const handleEditConfirm = async ({ goalName, category, targetAmount, startDate, targetDate, notes }) => {
    const uid = getCurrentUserId();
    const data = { name: goalName, category, notes, targetAmount: Number(targetAmount), startDate, targetDate };
    setIsGoalSubmitting(true);
    if (uid) {
      const t = toast.loading('Updating savings goal...');
      api.put(`/savings/${modalState.goalId}`, data).then(async updated => {
        setGoals(prev => prev.map(g => g.id === modalState.goalId ? { ...g, goalName: updated.name, category: updated.category || category, notes: updated.notes || notes, targetAmount: updated.targetAmount, startDate: updated.startDate ? new Date(updated.startDate).toISOString().slice(0,10) : g.startDate, targetDate: updated.targetDate ? new Date(updated.targetDate).toISOString().slice(0,10) : g.targetDate } : g));
        if (typeof onSavingsUpdated === 'function') await onSavingsUpdated();
        else await fetchSavings();
        toast.success('Savings goal updated successfully', { id: t });
      }).catch(() => {
        toast.error('Failed to update savings goal', { id: t });
        setGoals(prev => prev.map(g => g.id === modalState.goalId ? { ...g, goalName: goalName || g.goalName, category: category || g.category, notes, targetAmount: Number(targetAmount) || g.targetAmount, startDate: startDate || g.startDate, targetDate: targetDate || g.targetDate } : g));
      }).finally(() => { setIsGoalSubmitting(false); setModalState({ open: false, mode: null, goalId: null, initial: {} }); });
    } else {
      setGoals(prev => prev.map(g => g.id === modalState.goalId ? { ...g, goalName: goalName || g.goalName, category: category || g.category, notes, targetAmount: Number(targetAmount) || g.targetAmount, startDate: startDate || g.startDate, targetDate: targetDate || g.targetDate } : g));
      setIsGoalSubmitting(false);
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

  const filteredGoals = useMemo(() => {
    const nextGoals = [...goals];
    const mapped = nextGoals.filter((goal) => {
      const savedAmount = Number(goal.savedAmount || 0);
      const targetAmount = Number(goal.targetAmount || 0);
      if (goalFilter === "in-progress") return savedAmount < targetAmount;
      if (goalFilter === "completed") return savedAmount >= targetAmount;
      return true;
    });

    mapped.sort((a, b) => {
      if (sortValue === "progress") {
        const progressA = Number(a.targetAmount || 0) > 0 ? (Number(a.savedAmount || 0) / Number(a.targetAmount || 0)) : 0;
        const progressB = Number(b.targetAmount || 0) > 0 ? (Number(b.savedAmount || 0) / Number(b.targetAmount || 0)) : 0;
        return progressB - progressA;
      }

      if (sortValue === "target") {
        return Number(b.targetAmount || 0) - Number(a.targetAmount || 0);
      }

      return new Date(b.startDate || b.targetDate || 0) - new Date(a.startDate || a.targetDate || 0);
    });

    return mapped;
  }, [goals, goalFilter, sortValue]);

  const openAddGoal = () => {
    setNewGoal(prev => ({ ...prev, startDate: new Date().toISOString().slice(0, 10) }));
    setIsModalOpen(true);
  };

  return (
    <div className="savings-root">
      <header className="savings-page-header">
        <div className="savings-page-header-content">
          <h1 className="savings-page-header-title">Savings Goals</h1>
          <p className="savings-page-header-description">
            Plan for your dreams. Save today, achieve tomorrow.
          </p>
        </div>
        <div className="savings-page-header-actions">
          <SavingsAccountSelector />
          <button
            type="button"
            className="savings-page-header-button"
            onClick={openAddGoal}
            aria-label="Add new savings goal"
          >
            + Add Saving Goal
          </button>
        </div>
      </header>

      <VisualSavingsAccounts />

      <SavingsGoalModal
        key={`create-${isModalOpen}`}
        open={isModalOpen}
        mode="create"
        initialValues={newGoal}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddGoal}
        isSubmitting={isGoalSubmitting}
        currencySymbol={currencySymbol}
      />

      <div className="savings-goals-content">
        {filteredGoals.length === 0 ? (
          <div className="savings-empty-state">
            <p>No saving goals yet.</p>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "savings-goals-grid" : "savings-goals-list"}>
            {filteredGoals.map((goal) => {
              const t = parseFloat(goal.targetAmount) || 0;
              const s = parseFloat(goal.savedAmount) || 0;
              const pct = t > 0 ? Math.min(100, (s / t) * 100) : 0;
              const historyForDisplay = Array.isArray(goal.history)
                ? goal.history.filter((h) => {
                    if (activeTab !== 'Selected Month') return true;
                    const d = new Date(h.date);
                    return d.getFullYear() === (Number(selectedYear) || new Date().getFullYear()) && d.getMonth() === Number(selectedMonth);
                  })
                : [];
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
                    <div className="savings-goal-heading">
                      {goal.category && <div className="savings-goal-category">{goal.category}</div>}
                      <h3 className="savings-goal-name">{goal.goalName}</h3>
                      {goal.notes && <p className="savings-goal-notes">{goal.notes}</p>}
                    </div>
                    <div className="savings-goal-deadline">
                      <div className="savings-goal-time">{remainingTimeText}</div>
                      {(goal.startDate || goal.targetDate) && (
                        <div className="savings-goal-dates">
                          {`${goal.startDate ? new Date(goal.startDate).toLocaleDateString() : ''}${goal.startDate && goal.targetDate ? ' → ' : ''}${goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : ''}`}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="savings-goal-amounts">
                    <div className="savings-goal-saved">
                      <span className="savings-goal-label">Saved</span>
                      <strong>{formatCurrency ? formatCurrency(s) : `${currencySymbol}${Number(s).toFixed(2)}`}</strong>
                    </div>
                    <div className="savings-goal-target-metric">
                      <span className="savings-goal-label">Target</span>
                      <strong>{formatCurrency ? formatCurrency(t) : `${currencySymbol}${Number(t).toFixed(2)}`}</strong>
                    </div>
                  </div>

                  <div className="savings-progress-wrap">
                    <div className="savings-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={pct} aria-label={`${goal.goalName} progress`}>
                      <div className="savings-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="savings-progress-label">{pct.toFixed(1)}% complete</div>
                  </div>

                  <div className="savings-goal-actions">
                    <button className="btn" onClick={() => setModalState({ open: true, mode: 'deposit', goalId: goal.id, initial: { amount: '', sourceId: '' } })}>Add Savings</button>
                    <button className="btn" onClick={() => setModalState({ open: true, mode: 'withdraw', goalId: goal.id, initial: { amount: '', sourceId: '' } })}>Withdraw</button>
                    <span className="savings-goal-icon-actions">
                      <button className="btn savings-goal-icon-button" onClick={() => setModalState({ open: true, mode: 'edit', goalId: goal.id, initial: { goalName: goal.goalName || '', category: goal.category || '', targetAmount: goal.targetAmount || '', startDate: goal.startDate || '', targetDate: goal.targetDate || '', notes: goal.notes || '' } })} aria-label={`Edit ${goal.goalName}`} title="Edit goal">
                        <Edit2 size={16} aria-hidden="true" />
                      </button>
                      <button className="btn savings-goal-icon-button savings-goal-delete-button" onClick={() => setConfirm({ open: true, message: "Delete this saving goal? This cannot be undone.", onConfirm: () => handleDelete(goal.id) })} aria-label={`Delete ${goal.goalName}`} title="Delete goal">
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </span>
                  </div>

                  {activeTab !== 'Summary' && historyForDisplay && historyForDisplay.length > 0 && (
                    <div className="savings-history">
                      <strong>History</strong>
                      <div className="savings-history-list">
                        <TransactionFeed
                          transactions={(historyForDisplay || []).slice().reverse().map((entry) => ({
                            ...entry,
                            id: `s-${entry.id}`,
                            goalName: goal.goalName,
                            savingsId: goal.id,
                            type: Number(entry.amount) > 0 ? 'savings_deposit' : 'savings_withdraw'
                          }))}
                          currencySymbol={currencySymbol}
                          formatCurrency={formatCurrency}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <ConfirmModal
        open={confirm.open}
        message={confirm.message}
        onConfirm={() => { confirm.onConfirm && confirm.onConfirm(); setConfirm({ open: false }); }}
        onCancel={() => setConfirm({ open: false })}
      />
      <SavingsGoalModal
        key={`edit-${modalState.goalId || 'new'}`}
        open={modalState.open && modalState.mode === 'edit'}
        mode="edit"
        initialValues={modalState.initial}
        onClose={() => setModalState({ open: false, mode: null, goalId: null, initial: {} })}
        onSubmit={handleEditConfirm}
        isSubmitting={isGoalSubmitting}
        currencySymbol={currencySymbol}
      />
      <TransferSourceModal
        open={modalState.open && modalState.mode === 'deposit'}
        title={(() => {
          const goal = goals.find(g => g.id === modalState.goalId) || {};
          return `Add Savings to ${goal.goalName || 'goal'}`;
        })()}
        initialValues={modalState.initial}
        onCancel={() => setModalState({ open: false, mode: null, goalId: null, initial: {} })}
        onSubmit={handleDepositConfirm}
        isSubmitting={isTransactionSubmitting}
        currencySymbol={currencySymbol}
      />
      <TransferSourceModal
        open={modalState.open && modalState.mode === 'withdraw'}
        title={(() => {
          const goal = goals.find(g => g.id === modalState.goalId) || {};
          return `Withdraw from ${goal.goalName || 'goal'}`;
        })()}
        initialValues={modalState.initial}
        direction="to"
        maxAmount={Number((goals.find(g => g.id === modalState.goalId) || {}).savedAmount || 0)}
        onCancel={() => setModalState({ open: false, mode: null, goalId: null, initial: {} })}
        onSubmit={handleWithdrawConfirm}
        isSubmitting={isTransactionSubmitting}
        currencySymbol={currencySymbol}
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

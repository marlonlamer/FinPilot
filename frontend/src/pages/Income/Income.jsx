import React, { useMemo, useState } from "react";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import "./IncomeModule.css";

export default function Income({ incomes = [], incomeForm, setIncomeForm, handleIncomeSubmit, incomeModalOpen, setIncomeModalOpen, deleteIncome, openEditIncome, editingIncomeId, cancelIncomeEdit, selectedYear, selectedMonth, currencySymbol = "₱", formatCurrency }) {
  const lastMonthTotal = useMemo(() => {
    let prevMonth = selectedMonth - 1;
    let prevYear = selectedYear;
    if (prevMonth < 0) { prevMonth = 11; prevYear = selectedYear - 1; }
    return incomes.reduce((s, it) => {
      if (!it.date) return s;
      const d = new Date(it.date);
      if (d.getFullYear() === prevYear && d.getMonth() === prevMonth) {
        return s + (Number(it.amount) || 0);
      }
      return s;
    }, 0);
  }, [incomes, selectedYear, selectedMonth]);
  const monthlyTotal = useMemo(() => {
    return incomes.reduce((s, it) => {
      if (!it.date) return s;
      const d = new Date(it.date);
      if (d.getFullYear() === selectedYear && d.getMonth() === selectedMonth) {
        return s + (Number(it.amount) || 0);
      }
      return s;
    }, 0);
  }, [incomes, selectedYear, selectedMonth]);

  const bySource = useMemo(() => {
    const map = {};
    incomes.forEach(it => {
      const key = it.source || (it.category ? `${it.category}` : "Unspecified");
      map[key] = (map[key] || 0) + (Number(it.amount) || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [incomes]);

  const recurring = useMemo(() => incomes.filter(i => i.recurring), [incomes]);
  const nonRecurring = useMemo(() => incomes.filter(i => !i.recurring), [incomes]);
  const [confirm, setConfirm] = useState({ open: false, message: "", onConfirm: null });

  return (
    <div className="income-root">
      <div className="income-header">
        <h3 className="page-title">Incomes</h3>
        <button
          className="btn btn-primary"
          onClick={() => {
            setIncomeForm(prev => ({ ...prev, date: new Date().toISOString().slice(0, 10) }));
            setIncomeModalOpen(true);
          }}
        >＋ Add Income</button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">This Month</div>
          <div className="stat-value">{formatCurrency ? formatCurrency(monthlyTotal) : `${currencySymbol}${monthlyTotal.toFixed(2)}`}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Last Month</div>
          <div className="stat-value">{formatCurrency ? formatCurrency(lastMonthTotal) : `${currencySymbol}${lastMonthTotal.toFixed(2)}`}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Recurring Incomes</div>
          <div className="stat-value">{recurring.length}</div>
        </div>
      </div>

      {incomeModalOpen && (
        <div className="modal-overlay" onClick={() => (editingIncomeId ? cancelIncomeEdit() : setIncomeModalOpen(false))}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingIncomeId ? "Edit Income" : "Add Income"}</h3>
              <button className="btn btn-ghost" onClick={() => (editingIncomeId ? cancelIncomeEdit() : setIncomeModalOpen(false))}>✕</button>
            </div>
            <form onSubmit={handleIncomeSubmit} className="form-grid">
              <label className="form-label">Amount</label>
              <input className="modern-input" placeholder="Amount" type="number" value={incomeForm.amount} onChange={e => setIncomeForm({ ...incomeForm, amount: e.target.value })} required />
              <label className="form-label">Source of Income</label>
              <select className="modern-input" value={incomeForm.category} onChange={e => setIncomeForm({ ...incomeForm, category: e.target.value })}>
                <option value="">Select Source</option>
                <option value="Salary">💼 Salary</option>
                <option value="Freelance">💻 Freelance</option>
                <option value="Investment">📈 Investment</option>
                <option value="Business">🏢 Business</option>
                <option value="Side Hustle">💪 Side Hustle</option>
                <option value="Other">➕ Other</option>
              </select>
              <label className="form-label">Description</label>
              <input className="modern-input" placeholder="Description" value={incomeForm.source} onChange={e => setIncomeForm({ ...incomeForm, source: e.target.value })} required />
              <label className="form-label">Date</label>
              <input className="modern-input" type="date" value={incomeForm.date} onChange={e => setIncomeForm({ ...incomeForm, date: e.target.value })} />

              <div className="form-row-inline">
                <label className="checkbox-label">
                  <input type="checkbox" checked={!!incomeForm.recurring} onChange={e => setIncomeForm({ ...incomeForm, recurring: e.target.checked })} />
                  <span>Recurring</span>
                </label>
                {incomeForm.recurring && (
                  <>
                    <label className="form-label">Recurrence</label>
                    <select className="modern-input small-select" value={incomeForm.recurrence || "monthly"} onChange={e => setIncomeForm({ ...incomeForm, recurrence: e.target.value })}>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </>
                )}
              </div>

              <label className="form-label">Notes(Optional)</label>
              <input className="modern-input" placeholder="Enter a helpful message" value={incomeForm.notes} onChange={e => setIncomeForm({ ...incomeForm, notes: e.target.value })} />
              <div className="form-actions">
                <button type="button" className="btn" onClick={() => (editingIncomeId ? cancelIncomeEdit() : setIncomeModalOpen(false))}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingIncomeId ? "Save Changes" : "Add Income"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <h3 className="section-title">Recurring Incomes</h3>
      {recurring.length > 0 ? (
        <ul>
            {recurring.map(income => (
            <li key={income.id} className="income-item">
              <div className="income-item-main">{formatCurrency ? formatCurrency(income.amount) : `${currencySymbol}${Number(income.amount).toFixed(2)}`} {income.category ? `(${income.category})` : `(${income.source})`} — {income.recurrence ? `${income.recurrence}` : "recurring"} — {(income.date ? new Date(income.date).toLocaleDateString() : "N/A")} {income.notes ? `— ${income.notes}` : null}</div>
              <div className="income-item-actions">
                <button className="icon-btn" onClick={() => openEditIncome(income)}>✏️</button>
                <button className="icon-btn" onClick={() => setConfirm({ open: true, message: "Delete this income? This cannot be undone.", onConfirm: () => deleteIncome(income.id) })}>❌</button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="no-data">No recurring incomes set.</div>
      )}

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

      <h3 className="section-title">All Incomes</h3>
      <ul>
        {nonRecurring.map(income => (
          <li key={income.id} className="income-item">
            <div className="income-item-main">{formatCurrency ? formatCurrency(income.amount) : `${currencySymbol}${Number(income.amount).toFixed(2)}`} {income.category ? `(${income.category})` : `(${income.source})`} — {(income.date ? new Date(income.date).toLocaleDateString() : "N/A")} {income.notes ? `— ${income.notes}` : null}</div>
            <div className="income-item-actions">
              <button className="icon-btn" onClick={() => openEditIncome(income)}>✏️</button>
              <button className="icon-btn" onClick={() => setConfirm({ open: true, message: "Delete this income? This cannot be undone.", onConfirm: () => deleteIncome(income.id) })}>❌</button>
            </div>
          </li>
        ))}
      </ul>
      <ConfirmModal
        open={confirm.open}
        message={confirm.message}
        onConfirm={() => { confirm.onConfirm && confirm.onConfirm(); setConfirm({ open: false }); }}
        onCancel={() => setConfirm({ open: false })}
      />
    </div>
  );
}

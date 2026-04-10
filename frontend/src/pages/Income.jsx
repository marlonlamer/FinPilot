import React, { useMemo, useState } from "react";
import ConfirmModal from "../components/ConfirmModal";

export default function Income({ incomes, incomeForm, setIncomeForm, handleIncomeSubmit, incomeModalOpen, setIncomeModalOpen, deleteIncome, openEditIncome, editingIncomeId, cancelIncomeEdit, selectedYear, selectedMonth, currencySymbol = "₱", formatCurrency }) {
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
    return Object.entries(map).sort((a, b) => b[1] - a[1]); // [ [source, total], ... ]
  }, [incomes]);

  const recurring = useMemo(() => incomes.filter(i => i.recurring), [incomes]);
  const nonRecurring = useMemo(() => incomes.filter(i => !i.recurring), [incomes]);
  const [confirm, setConfirm] = useState({ open: false, message: "", onConfirm: null });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ margin: 0 }}>Incomes</h3>
        <button className="btn btn-primary" onClick={() => setIncomeModalOpen(true)}>＋ Add Income</button>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
        <div style={{ background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", minWidth: 160 }}>
          <div style={{ fontSize: 12, color: "#666" }}>This Month</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrency ? formatCurrency(monthlyTotal) : `${currencySymbol}${monthlyTotal.toFixed(2)}`}</div>
        </div>
        <div style={{ background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", minWidth: 160 }}>
          <div style={{ fontSize: 12, color: "#666" }}>Last Month</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrency ? formatCurrency(lastMonthTotal) : `${currencySymbol}${lastMonthTotal.toFixed(2)}`}</div>
        </div>
        <div style={{ background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", minWidth: 200 }}>
          <div style={{ fontSize: 12, color: "#666" }}>Recurring Incomes</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{recurring.length}</div>
        </div>
      </div>

      {incomeModalOpen && (
        <div className="modal-overlay" onClick={() => (editingIncomeId ? cancelIncomeEdit() : setIncomeModalOpen(false))}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>{editingIncomeId ? "Edit Income" : "Add Income"}</h3>
              <button className="btn btn-ghost" onClick={() => (editingIncomeId ? cancelIncomeEdit() : setIncomeModalOpen(false))}>✕</button>
            </div>
            <form onSubmit={handleIncomeSubmit} style={{ display: "grid", gap: 10 }}>
              <input className="modern-input" placeholder="Amount" type="number" value={incomeForm.amount} onChange={e => setIncomeForm({ ...incomeForm, amount: e.target.value })} required />
              <select className="modern-input" value={incomeForm.category} onChange={e => setIncomeForm({ ...incomeForm, category: e.target.value })}>
                <option value="">Select category</option>
                <option value="Salary">💼 Salary</option>
                <option value="Freelance">💻 Freelance</option>
                <option value="Investment">📈 Investment</option>
                <option value="Business">🏢 Business</option>
                <option value="Side Hustle">💪 Side Hustle</option>
                <option value="Other">➕ Other</option>
              </select>
              <input className="modern-input" placeholder="Source of Fund" value={incomeForm.source} onChange={e => setIncomeForm({ ...incomeForm, source: e.target.value })} required />
              <input className="modern-input" type="date" value={incomeForm.date} onChange={e => setIncomeForm({ ...incomeForm, date: e.target.value })} />

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input type="checkbox" checked={!!incomeForm.recurring} onChange={e => setIncomeForm({ ...incomeForm, recurring: e.target.checked })} />
                  <span>Recurring</span>
                </label>
                {incomeForm.recurring && (
                  <select className="modern-input" value={incomeForm.recurrence || "monthly"} onChange={e => setIncomeForm({ ...incomeForm, recurrence: e.target.value })} style={{ width: 160 }}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                )}
              </div>

              <input className="modern-input" placeholder="Notes" value={incomeForm.notes} onChange={e => setIncomeForm({ ...incomeForm, notes: e.target.value })} />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
                <button type="button" className="btn" onClick={() => (editingIncomeId ? cancelIncomeEdit() : setIncomeModalOpen(false))}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingIncomeId ? "Save Changes" : "Add Income"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <h3 style={{ marginTop: 12 }}>Recurring Incomes</h3>
      {recurring.length > 0 ? (
        <ul>
            {recurring.map(income => (
            <li key={income.id}>{formatCurrency ? formatCurrency(income.amount) : `${currencySymbol}${Number(income.amount).toFixed(2)}`} {income.category ? `(${income.category})` : `(${income.source})`} — {income.recurrence ? `${income.recurrence}` : "recurring"} — {(income.date ? new Date(income.date).toLocaleDateString() : "N/A")} {income.notes ? `— ${income.notes}` : null}
              <button style={{ marginLeft: 10 }} onClick={() => openEditIncome(income)}>✏️</button>
              <button style={{ marginLeft: 10 }} onClick={() => setConfirm({ open: true, message: "Delete this income? This cannot be undone.", onConfirm: () => deleteIncome(income.id) })}>❌</button>
            </li>
          ))}
        </ul>
      ) : (
        <div style={{ color: "#666" }}>No recurring incomes set.</div>
      )}

      <h3 style={{ marginTop: 12 }}>Income Source Breakdown</h3>
      {bySource.length > 0 ? (
        <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
              {bySource.map(([source, total]) => (
            <div key={source} style={{ display: "flex", justifyContent: "space-between", background: "#fff", padding: 8, borderRadius: 6 }}>
              <div>{source}</div>
              <div style={{ fontWeight: 700 }}>{formatCurrency ? formatCurrency(total) : `${currencySymbol}${total.toFixed(2)}`}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: "#666" }}>No incomes recorded.</div>
      )}

      <h3 style={{ marginTop: 12 }}>All Incomes</h3>
      <ul>
        {nonRecurring.map(income => (
          <li key={income.id}>{formatCurrency ? formatCurrency(income.amount) : `${currencySymbol}${Number(income.amount).toFixed(2)}`} {income.category ? `(${income.category})` : `(${income.source})`} — {(income.date ? new Date(income.date).toLocaleDateString() : "N/A")} {income.notes ? `— ${income.notes}` : null}
            <button style={{ marginLeft: 10 }} onClick={() => openEditIncome(income)}>✏️</button>
            <button style={{ marginLeft: 10 }} onClick={() => setConfirm({ open: true, message: "Delete this income? This cannot be undone.", onConfirm: () => deleteIncome(income.id) })}>❌</button>
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

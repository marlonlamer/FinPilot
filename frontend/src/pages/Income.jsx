import React from "react";

export default function Income({ incomes, incomeForm, setIncomeForm, handleIncomeSubmit, incomeModalOpen, setIncomeModalOpen, deleteIncome, openEditIncome, editingIncomeId, cancelIncomeEdit }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ margin: 0 }}>Incomes</h3>
        <button className="btn btn-primary" onClick={() => setIncomeModalOpen(true)}>＋ Add Income</button>
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
              <input className="modern-input" placeholder="Notes" value={incomeForm.notes} onChange={e => setIncomeForm({ ...incomeForm, notes: e.target.value })} />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
                <button type="button" className="btn" onClick={() => (editingIncomeId ? cancelIncomeEdit() : setIncomeModalOpen(false))}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingIncomeId ? "Save Changes" : "Add Income"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <h3 style={{ marginTop: 12 }}>Incomes</h3>
      <ul>
        {incomes.map(income => (
          <li key={income.id}>₱{income.amount} {income.category ? `(${income.category})` : `(${income.source})`} — {(income.date ? new Date(income.date).toLocaleDateString() : "N/A")} {income.notes ? `— ${income.notes}` : null}
            <button style={{ marginLeft: 10 }} onClick={() => openEditIncome(income)}>✏️</button>
            <button style={{ marginLeft: 10 }} onClick={() => deleteIncome(income.id)}>❌</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

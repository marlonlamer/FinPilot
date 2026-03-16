import React from "react";

export default function Expenses({ expenses, form, setForm, handleSubmit, expenseModalOpen, setExpenseModalOpen, openBudgetModal, deleteExpense, openEditExpense, editingExpenseId, cancelExpenseEdit }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ margin: 0 }}>Expenses</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={openBudgetModal}>Edit Budgets</button>
          <button className="btn btn-primary" onClick={() => setExpenseModalOpen(true)}>＋ Add Expense</button>
        </div>
      </div>

      {expenseModalOpen && (
        <div className="modal-overlay" onClick={() => (editingExpenseId ? cancelExpenseEdit() : setExpenseModalOpen(false))}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div className="modal-title">{editingExpenseId ? "Edit Expense" : "Add Expense"}</div>
                <div className="modal-sub">Track where your money went</div>
              </div>
              <button className="btn btn-ghost" onClick={() => (editingExpenseId ? cancelExpenseEdit() : setExpenseModalOpen(false))}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="form-grid">
              <div className="input-with-prefix">
                <div className="currency-prefix">₱</div>
                <input className="modern-input" placeholder="Amount" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
              <select className="modern-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                <option value="">Select category</option>
                <option value="Food">🍔 Food</option>
                <option value="Transportation">🚗 Transportation</option>
                <option value="Rent">🏠 Rent</option>
                <option value="Shopping">🛍️ Shopping</option>
                <option value="Bills">💡 Bills</option>
                <option value="Health">🩺 Health</option>
                <option value="Entertainment">🎬 Entertainment</option>
                <option value="Education">🎓 Education</option>
                <option value="Other">➕ Other</option>
              </select>
              <input className="modern-input form-full" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <input className="modern-input" placeholder="Source" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} />
              <input className="modern-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              <input className="modern-input form-full" placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              <div className="modal-footer form-full">
                <button type="button" className="btn" onClick={() => (editingExpenseId ? cancelExpenseEdit() : setExpenseModalOpen(false))}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingExpenseId ? "Save Changes" : "Add Expense"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <h3 style={{ marginTop: 12 }}>Recent Expenses</h3>
      <ul>
        {expenses.map(expense => (
          <li key={expense.id}>₱{expense.amount} {expense.category ? `(${expense.category})` : `(${expense.source})`} {expense.description ? `— ${expense.description}` : ""} — {(expense.date ? new Date(expense.date).toLocaleDateString() : "N/A")} {expense.notes ? `— ${expense.notes}` : null}
            <button style={{ marginLeft: 10 }} onClick={() => openEditExpense(expense)}>✏️</button>
            <button style={{ marginLeft: 10 }} onClick={() => deleteExpense(expense.id)}>❌</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

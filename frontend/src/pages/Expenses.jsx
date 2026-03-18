import React, { useMemo } from "react";

export default function Expenses({ expenses, form, setForm, handleSubmit, expenseModalOpen, setExpenseModalOpen, openBudgetModal, deleteExpense, openEditExpense, editingExpenseId, cancelExpenseEdit, budgets }) {
  // budgets: optional object { categoryName: budgetAmount }
  const totalAll = useMemo(() => expenses.reduce((s, it) => s + (Number(it.amount) || 0), 0), [expenses]);
  const now = new Date();
  const monthlyTotal = useMemo(() => expenses.reduce((s, it) => {
    if (!it.date) return s;
    const d = new Date(it.date);
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) return s + (Number(it.amount) || 0);
    return s;
  }, 0), [expenses, now]);

  const byCategory = useMemo(() => {
    const map = {};
    expenses.forEach(it => {
      const key = it.category || "Uncategorized";
      map[key] = (map[key] || 0) + (Number(it.amount) || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]); // [ [category, total], ... ]
  }, [expenses]);

  const budgetStatus = useMemo(() => {
    if (!budgets) return [];
    return Object.entries(budgets).map(([cat, b]) => {
      const spent = byCategory.find(([c]) => c === cat)?.[1] || 0;
      const pct = b > 0 ? (spent / b) * 100 : null;
      return { category: cat, budget: b, spent, percent: pct };
    }).sort((a, b) => (b.percent || 0) - (a.percent || 0));
  }, [budgets, byCategory]);

  const overBudgetCategories = useMemo(() => {
    if (!budgetStatus) return [];
    return budgetStatus.filter(s => s.budget > 0 && s.spent > s.budget);
  }, [budgetStatus]);

  const recurring = useMemo(() => expenses.filter(e => e.recurring), [expenses]);
  const nonRecurring = useMemo(() => expenses.filter(e => !e.recurring), [expenses]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ margin: 0 }}>Expenses</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={openBudgetModal}>Edit Budgets</button>
          <button className="btn btn-primary" onClick={() => setExpenseModalOpen(true)}>＋ Add Expense</button>
        </div>
      </div>

      {overBudgetCategories.length > 0 && (
        <div style={{ marginTop: 12, padding: 10, background: "#FFEEEE", color: "#AA0000", borderRadius: 6 }}>
          <strong>Budget Alert:</strong> You've exceeded budgets for {overBudgetCategories.map(c => c.category).join(", ")}
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
        <div style={{ background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", minWidth: 160 }}>
          <div style={{ fontSize: 12, color: "#666" }}>Total Expenses</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>₱{totalAll.toFixed(2)}</div>
        </div>
        <div style={{ background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", minWidth: 160 }}>
          <div style={{ fontSize: 12, color: "#666" }}>This Month</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>₱{monthlyTotal.toFixed(2)}</div>
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
              <select className="modern-input" value={form.paymentMethod || ""} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
                <option value="">Select payment method</option>
                <option value="Cash">💵 Cash</option>
                <option value="Credit Card">💳 Credit Card</option>
                <option value="Debit Card">🏧 Debit Card</option>
                <option value="Bank Transfer">🏦 Bank Transfer</option>
                <option value="Mobile Wallet">📱 Mobile Wallet</option>
              </select>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input type="checkbox" checked={!!form.recurring} onChange={e => setForm({ ...form, recurring: e.target.checked })} />
                  <span>Recurring</span>
                </label>
                {form.recurring && (
                  <select className="modern-input" value={form.recurrence || "monthly"} onChange={e => setForm({ ...form, recurrence: e.target.value })} style={{ width: 160 }}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                )}
              </div>
              <input className="modern-input form-full" placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              <div className="modal-footer form-full">
                <button type="button" className="btn" onClick={() => (editingExpenseId ? cancelExpenseEdit() : setExpenseModalOpen(false))}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingExpenseId ? "Save Changes" : "Add Expense"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <h3 style={{ marginTop: 12 }}>Budget Status</h3>
      {budgets ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {budgetStatus.map(s => (
            <div key={s.category} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: 8, borderRadius: 6 }}>
              <div style={{ minWidth: 160 }}>{s.category}</div>
              <div style={{ flex: 1, marginLeft: 12, marginRight: 12 }}>
                <div style={{ height: 10, background: "#f1f5f9", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(100, Math.max(0, s.percent || 0))}%`, height: "100%", background: s.percent > 100 ? "#FF6B6B" : "#60a5fa" }} />
                </div>
              </div>
              <div style={{ minWidth: 140, textAlign: "right", fontWeight: 700 }}>{s.spent.toFixed(2)} / {s.budget.toFixed(2)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: "#666" }}>No budgets set. Click "Edit Budgets" to configure per-category budgets.</div>
      )}

      <h3 style={{ marginTop: 12 }}>Recurring Expenses</h3>
      {recurring.length > 0 ? (
        <ul>
          {recurring.map(expense => (
            <li key={expense.id}>₱{expense.amount} {expense.category ? `(${expense.category})` : `(${expense.source})`} — {expense.recurrence ? `${expense.recurrence}` : "recurring"} — {(expense.date ? new Date(expense.date).toLocaleDateString() : "N/A")} {expense.notes ? `— ${expense.notes}` : null} {expense.paymentMethod ? ` — ${expense.paymentMethod}` : null}
              <button style={{ marginLeft: 10 }} onClick={() => openEditExpense(expense)}>✏️</button>
              <button style={{ marginLeft: 10 }} onClick={() => deleteExpense(expense.id)}>❌</button>
            </li>
          ))}
        </ul>
      ) : (
        <div style={{ color: "#666" }}>No recurring expenses set.</div>
      )}

      <h3 style={{ marginTop: 12 }}>Recent Expenses</h3>
      <ul>
        {nonRecurring.map(expense => (
          <li key={expense.id}>₱{expense.amount} {expense.category ? `(${expense.category})` : `(${expense.source})`} {expense.description ? `— ${expense.description}` : ""} — {(expense.date ? new Date(expense.date).toLocaleDateString() : "N/A")} {expense.notes ? `— ${expense.notes}` : null} {expense.paymentMethod ? ` — ${expense.paymentMethod}` : null}
            <button style={{ marginLeft: 10 }} onClick={() => openEditExpense(expense)}>✏️</button>
            <button style={{ marginLeft: 10 }} onClick={() => deleteExpense(expense.id)}>❌</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

import React from "react";

export default function Transactions({ incomes, expenses, deleteIncome, deleteExpense, openEditIncome, openEditExpense }) {
  return (
    <div>
      <h2>All Transactions</h2>
      <h3>Incomes</h3>
      <ul>
        {incomes.map(i => (
          <li key={i.id}>₱{i.amount} {i.category ? `(${i.category})` : `(${i.source})`} — {(i.date ? new Date(i.date).toLocaleDateString() : "N/A")} {i.notes ? `— ${i.notes}` : null}
            <button style={{ marginLeft: 10 }} onClick={() => openEditIncome(i)}>✏️</button>
            <button style={{ marginLeft: 10 }} onClick={() => deleteIncome(i.id)}>❌</button>
          </li>
        ))}
      </ul>
      <h3>Expenses</h3>
      <ul>
        {expenses.map(e => (
          <li key={e.id}>₱{e.amount} {e.category ? `(${e.category})` : `(${e.source})`} {e.description ? `— ${e.description}` : ""} — {(e.date ? new Date(e.date).toLocaleDateString() : "N/A")} {e.notes ? `— ${e.notes}` : null}
            <button style={{ marginLeft: 10 }} onClick={() => openEditExpense(e)}>✏️</button>
            <button style={{ marginLeft: 10 }} onClick={() => deleteExpense(e.id)}>❌</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

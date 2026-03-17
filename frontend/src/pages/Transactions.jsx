import React, { useMemo, useState } from "react";

export default function Transactions({ incomes, expenses, deleteIncome, deleteExpense, openEditIncome, openEditExpense }) {
  const [typeFilter, setTypeFilter] = useState("all"); // all | income | expense
  const [dateFilter, setDateFilter] = useState("all"); // all | today | week | month | custom
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categories = useMemo(() => {
    const set = new Set();
    incomes.forEach(i => i.category && set.add(i.category));
    expenses.forEach(e => e.category && set.add(e.category));
    return ["all", ...Array.from(set).sort()];
  }, [incomes, expenses]);

  function inDateRange(itemDate) {
    if (!itemDate) return false;
    const d = new Date(itemDate);
    if (isNaN(d)) return false;
    const now = new Date();

    if (dateFilter === "all") return true;
    if (dateFilter === "today") {
      return d.toDateString() === now.toDateString();
    }
    if (dateFilter === "week") {
      const sevenAgo = new Date();
      sevenAgo.setDate(now.getDate() - 6);
      sevenAgo.setHours(0,0,0,0);
      return d >= sevenAgo && d <= now;
    }
    if (dateFilter === "month") {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (dateFilter === "custom") {
      if (!customStart && !customEnd) return true;
      const start = customStart ? new Date(customStart) : null;
      const end = customEnd ? new Date(customEnd) : null;
      if (start && isNaN(start)) return false;
      if (end && isNaN(end)) return false;
      if (start && end) return d >= start && d <= end;
      if (start) return d >= start;
      if (end) return d <= end;
      return true;
    }
    return true;
  }

  function matchesCategory(item) {
    if (categoryFilter === "all") return true;
    return item.category === categoryFilter;
  }

  const filteredIncomes = useMemo(() => {
    return incomes.filter(i => inDateRange(i.date) && matchesCategory(i));
  }, [incomes, dateFilter, customStart, customEnd, categoryFilter]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => inDateRange(e.date) && matchesCategory(e));
  }, [expenses, dateFilter, customStart, customEnd, categoryFilter]);

  return (
    <div>
      <h2>All Transactions</h2>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <div>
          <label style={{ marginRight: 6 }}>Type:</label>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>

        <div>
          <label style={{ marginRight: 6 }}>Date:</label>
          <select value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="today">Today</option>
            <option value="week">Last 7 days</option>
            <option value="month">This month</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {dateFilter === "custom" && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} />
            <span>—</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
          </div>
        )}

        <div>
          <label style={{ marginRight: 6 }}>Category:</label>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {typeFilter !== "expense" && (
        <>
          <h3>Incomes</h3>
          <ul>
            {filteredIncomes.map(i => (
              <li key={i.id}>₱{i.amount} {i.category ? `(${i.category})` : `(${i.source})`} — {(i.date ? new Date(i.date).toLocaleDateString() : "N/A")} {i.notes ? `— ${i.notes}` : null}
                <button style={{ marginLeft: 10 }} onClick={() => openEditIncome(i)}>✏️</button>
                <button style={{ marginLeft: 10 }} onClick={() => deleteIncome(i.id)}>❌</button>
              </li>
            ))}
          </ul>
        </>
      )}

      {typeFilter !== "income" && (
        <>
          <h3>Expenses</h3>
          <ul>
            {filteredExpenses.map(e => (
              <li key={e.id}>₱{e.amount} {e.category ? `(${e.category})` : `(${e.source})`} {e.description ? `— ${e.description}` : ""} — {(e.date ? new Date(e.date).toLocaleDateString() : "N/A")} {e.notes ? `— ${e.notes}` : null}
                <button style={{ marginLeft: 10 }} onClick={() => openEditExpense(e)}>✏️</button>
                <button style={{ marginLeft: 10 }} onClick={() => deleteExpense(e.id)}>❌</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

import React, { useMemo, useState } from "react";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import "./TransactionsModule.css";

export default function Transactions({ incomes, expenses, deleteIncome, deleteExpense, openEditIncome, openEditExpense, currencySymbol = "₱", formatCurrency }) {
  const [typeFilter, setTypeFilter] = useState("all"); // all | income | expense
  const [dateFilter, setDateFilter] = useState("all"); // all | today | week | month | custom
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [confirm, setConfirm] = useState({ open: false, message: "", onConfirm: null });

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

  function matchesSearch(item) {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const checks = [
      item.category,
      item.source,
      item.description,
      item.notes,
      String(item.amount)
    ];
    return checks.some(v => v && String(v).toLowerCase().includes(q));
  }

  function sortItems(items) {
    const copy = [...items];
    copy.sort((a, b) => {
      const aDate = new Date(a.date || 0).getTime();
      const bDate = new Date(b.date || 0).getTime();
      const aAmt = Number(a.amount) || 0;
      const bAmt = Number(b.amount) || 0;

      switch (sortBy) {
        case "date_asc":
          return aDate - bDate;
        case "date_desc":
          return bDate - aDate;
        case "amount_asc":
          return aAmt - bAmt;
        case "amount_desc":
          return bAmt - aAmt;
        case "category_asc":
          return String(a.category || "").localeCompare(String(b.category || ""));
        case "category_desc":
          return String(b.category || "").localeCompare(String(a.category || ""));
        default:
          return bDate - aDate;
      }
    });
    return copy;
  }

  // Build the displayed list depending on type filter, apply search, sort, and compute running balance
  const displayedList = useMemo(() => {
    const mapIncome = (i) => ({ ...i, type: "income" });
    const mapExpense = (e) => ({ ...e, type: "expense" });

    let list = [];
    if (typeFilter === "all") {
      list = [...filteredIncomes.map(mapIncome), ...filteredExpenses.map(mapExpense)];
    } else if (typeFilter === "income") {
      list = filteredIncomes.map(mapIncome);
    } else {
      list = filteredExpenses.map(mapExpense);
    }

    // apply search
    list = list.filter(matchesSearch);

    // sort
    list = sortItems(list);

    // compute running balance according to current sorted order
    let running = 0;
    const withBalance = list.map(item => {
      const amt = Number(item.amount) || 0;
      running = item.type === "income" ? running + amt : running - amt;
      return { ...item, runningBalance: running };
    });

    return withBalance;
  }, [typeFilter, filteredIncomes, filteredExpenses, searchQuery, sortBy]);

  

  return (
    <div className="transactions-root">
      <h2>All Transactions</h2>

      <div className="transactions-controls">
        <div className="transactions-control">
          <label className="transactions-label">Type:</label>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>

        <div className="transactions-control">
          <label className="transactions-label">Date:</label>
          <select value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="today">Today</option>
            <option value="week">Last 7 days</option>
            <option value="month">This month</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {dateFilter === "custom" && (
          <div className="transactions-custom-date">
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} />
            <span>—</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
          </div>
        )}

        <div className="transactions-control">
          <label className="transactions-label">Category:</label>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="transactions-search">
          <label className="transactions-label">Search:</label>
          <input className="transactions-input" placeholder="Search amounts, notes, category..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>

        <div className="transactions-control">
          <label className="transactions-label">Sort:</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="date_desc">Date (newest)</option>
            <option value="date_asc">Date (oldest)</option>
            <option value="amount_desc">Amount (high → low)</option>
            <option value="amount_asc">Amount (low → high)</option>
            <option value="category_asc">Category (A → Z)</option>
            <option value="category_desc">Category (Z → A)</option>
          </select>
        </div>
      </div>
      
      {/* If viewing all types show merged list with running balance; otherwise show per-type lists */}
      {typeFilter === "all" ? (
        <>
          <h3>Transactions</h3>
          <table className="transactions-table">
            <thead>
              <tr className="transactions-row-header">
                <th className="transactions-th">Date</th>
                <th className="transactions-th">Type</th>
                <th className="transactions-th">Category / Source</th>
                <th className="transactions-th">Amount</th>
                <th className="transactions-th">Running</th>
                <th className="transactions-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedList.map(item => (
                <tr key={`${item.type}-${item.id}`} className="transactions-row">
                  <td className="transactions-td">{item.date ? new Date(item.date).toLocaleDateString() : "N/A"}</td>
                  <td className="transactions-td">{item.type}</td>
                  <td className="transactions-td">
                    {item.category ? item.category : item.source} {item.recurring ? <span className="transactions-recurring">🔁 recurring</span> : null}
                  </td>
                  <td className="transactions-td">{formatCurrency ? formatCurrency(item.amount) : `${currencySymbol}${Number(item.amount).toFixed(2)}`}</td>
                  <td className="transactions-td">{formatCurrency ? formatCurrency(item.runningBalance) : `${currencySymbol}${Number(item.runningBalance).toFixed(2)}`}</td>
                  <td className="transactions-td">
                    {item.type === "income" ? (
                      <>
                        <button className="transactions-action" onClick={() => openEditIncome(item)}>✏️</button>
                        <button className="transactions-action" onClick={() => setConfirm({ open: true, message: "Delete this income? This cannot be undone.", onConfirm: () => deleteIncome(item.id) })}>❌</button>
                      </>
                    ) : (
                      <>
                        <button className="transactions-action" onClick={() => openEditExpense(item)}>✏️</button>
                        <button className="transactions-action" onClick={() => setConfirm({ open: true, message: "Delete this expense? This cannot be undone.", onConfirm: () => deleteExpense(item.id) })}>❌</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <>
          {typeFilter !== "expense" && (
            <>
              <h3>Incomes</h3>
              <ul>
                {displayedList.filter(i => i.type === "income").map(i => (
                    <li key={i.id}>{formatCurrency ? formatCurrency(i.amount) : `${currencySymbol}${Number(i.amount).toFixed(2)}`} {i.category ? `(${i.category})` : `(${i.source})`} {i.recurring ? `— recurring (${i.recurrence || "monthly"})` : ""} — {(i.date ? new Date(i.date).toLocaleDateString() : "N/A")} {i.notes ? `— ${i.notes}` : null} — Running: {formatCurrency ? formatCurrency(i.runningBalance) : `${currencySymbol}${Number(i.runningBalance).toFixed(2)}`}
                      <button className="transactions-list-button" onClick={() => openEditIncome(i)}>✏️</button>
                      <button className="transactions-list-button" onClick={() => setConfirm({ open: true, message: "Delete this income? This cannot be undone.", onConfirm: () => deleteIncome(i.id) })}>❌</button>
                    </li>
                  ))}
              </ul>
            </>
          )}

          {typeFilter !== "income" && (
            <>
              <h3>Expenses</h3>
              <ul>
                {displayedList.filter(e => e.type === "expense").map(e => (
                  <li key={e.id}>{formatCurrency ? formatCurrency(e.amount) : `${currencySymbol}${Number(e.amount).toFixed(2)}`} {e.category ? `(${e.category})` : `(${e.source})`} {e.description ? `— ${e.description}` : ""} {e.recurring ? ` — recurring (${e.recurrence || "monthly"})` : ""} — {(e.date ? new Date(e.date).toLocaleDateString() : "N/A")} {e.notes ? `— ${e.notes}` : null} — Running: {formatCurrency ? formatCurrency(e.runningBalance) : `${currencySymbol}${Number(e.runningBalance).toFixed(2)}`}
                    <button className="transactions-list-button" onClick={() => openEditExpense(e)}>✏️</button>
                    <button className="transactions-list-button" onClick={() => setConfirm({ open: true, message: "Delete this expense? This cannot be undone.", onConfirm: () => deleteExpense(e.id) })}>❌</button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
      <ConfirmModal
        open={confirm.open}
        message={confirm.message}
        onConfirm={() => { confirm.onConfirm && confirm.onConfirm(); setConfirm({ open: false }); }}
        onCancel={() => setConfirm({ open: false })}
      />
    </div>
  );
}

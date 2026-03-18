import React, { useMemo, useState, useEffect } from "react";
import { api } from "../api";

export default function Transactions({ incomes, expenses, deleteIncome, deleteExpense, openEditIncome, openEditExpense }) {
  const [typeFilter, setTypeFilter] = useState("all"); // all | income | expense
  const [dateFilter, setDateFilter] = useState("all"); // all | today | week | month | custom
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [recurringTemplates, setRecurringTemplates] = useState([]);
  const [showRecurring, setShowRecurring] = useState(true);

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

  useEffect(() => {
    try {
      const raw = localStorage.getItem("recurringTemplates");
      if (raw) setRecurringTemplates(JSON.parse(raw));
    } catch {
      setRecurringTemplates([]);
    }
  }, []);

  function persistRecurring(templates) {
    setRecurringTemplates(templates);
    try {
      localStorage.setItem("recurringTemplates", JSON.stringify(templates));
    } catch {}
  }

  const addRecurringFromItem = (item, type) => {
    const interval = window.prompt("Set recurrence interval (daily, weekly, monthly, yearly):", "monthly");
    if (!interval) return;
    const nextDate = window.prompt("Next occurrence date (YYYY-MM-DD):", (item.date ? item.date.slice(0,10) : new Date().toISOString().slice(0,10)));
    const tpl = {
      id: Date.now(),
      type,
      amount: item.amount,
      category: item.category || "",
      source: item.source || "",
      description: item.description || "",
      notes: item.notes || "",
      interval,
      nextDate
    };
    persistRecurring([tpl, ...recurringTemplates]);
  };

  const createOccurrence = async (tpl) => {
    const body = {
      amount: tpl.amount,
      date: tpl.nextDate,
      category: tpl.category,
      source: tpl.source,
      description: tpl.description,
      notes: tpl.notes
    };
    try {
      if (tpl.type === "income") await api.post("/incomes", body);
      else await api.post("/expenses", body);
      window.alert("Occurrence created. Refreshing...");
      window.location.reload();
    } catch (e) {
      console.warn("Create occurrence failed", e);
      window.alert("Failed to create occurrence. See console.");
    }
  };

  const deleteRecurring = (id) => {
    if (!window.confirm("Delete this recurring template?")) return;
    persistRecurring(recurringTemplates.filter(t => t.id !== id));
  };

  const editRecurring = (id) => {
    const tpl = recurringTemplates.find(t => t.id === id);
    if (!tpl) return;
    const interval = window.prompt("Recurrence interval:", tpl.interval);
    if (!interval) return;
    const nextDate = window.prompt("Next occurrence date (YYYY-MM-DD):", tpl.nextDate);
    const updated = { ...tpl, interval, nextDate };
    persistRecurring(recurringTemplates.map(t => t.id === id ? updated : t));
  };

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

        <div style={{ marginLeft: 8 }}>
          <label style={{ marginRight: 6 }}>Search:</label>
          <input placeholder="Search amounts, notes, category..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>

        <div>
          <label style={{ marginRight: 6 }}>Sort:</label>
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
      {/* Recurring templates section */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ marginRight: 8 }}>
          <input type="checkbox" checked={showRecurring} onChange={e => setShowRecurring(e.target.checked)} /> Show recurring templates
        </label>
        {showRecurring && recurringTemplates.length > 0 && (
          <div style={{ border: "1px dashed #ddd", padding: 8, marginTop: 8 }}>
            <strong>Recurring Templates</strong>
            <ul>
              {recurringTemplates.map(t => (
                <li key={t.id} style={{ marginTop: 6 }}>
                  {t.type.toUpperCase()} • ₱{Number(t.amount).toFixed(2)} • {t.category || t.source} • {t.interval} • next: {t.nextDate}
                  <button style={{ marginLeft: 8 }} onClick={() => createOccurrence(t)}>Create now</button>
                  <button style={{ marginLeft: 8 }} onClick={() => editRecurring(t.id)}>Edit</button>
                  <button style={{ marginLeft: 8 }} onClick={() => deleteRecurring(t.id)}>Delete</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {/* If viewing all types show merged list with running balance; otherwise show per-type lists */}
      {typeFilter === "all" ? (
        <>
          <h3>Transactions</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
                <th style={{ padding: 8 }}>Date</th>
                <th style={{ padding: 8 }}>Type</th>
                <th style={{ padding: 8 }}>Category / Source</th>
                <th style={{ padding: 8 }}>Amount</th>
                <th style={{ padding: 8 }}>Running</th>
                <th style={{ padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedList.map(item => (
                <tr key={`${item.type}-${item.id}`} style={{ borderBottom: "1px solid #fafafa" }}>
                  <td style={{ padding: 8 }}>{item.date ? new Date(item.date).toLocaleDateString() : "N/A"}</td>
                  <td style={{ padding: 8 }}>{item.type}</td>
                  <td style={{ padding: 8 }}>{item.category ? item.category : item.source}</td>
                  <td style={{ padding: 8 }}>{item.type === "income" ? `₱${Number(item.amount).toFixed(2)}` : `₱${Number(item.amount).toFixed(2)}`}</td>
                  <td style={{ padding: 8 }}>₱{Number(item.runningBalance).toFixed(2)}</td>
                  <td style={{ padding: 8 }}>
                    {item.type === "income" ? (
                      <>
                        <button style={{ marginRight: 8 }} onClick={() => addRecurringFromItem(item, "income")}>🔁</button>
                        <button style={{ marginRight: 8 }} onClick={() => openEditIncome(item)}>✏️</button>
                        <button onClick={() => deleteIncome(item.id)}>❌</button>
                      </>
                    ) : (
                      <>
                        <button style={{ marginRight: 8 }} onClick={() => addRecurringFromItem(item, "expense")}>🔁</button>
                        <button style={{ marginRight: 8 }} onClick={() => openEditExpense(item)}>✏️</button>
                        <button onClick={() => deleteExpense(item.id)}>❌</button>
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
                  <li key={i.id}>₱{i.amount} {i.category ? `(${i.category})` : `(${i.source})`} — {(i.date ? new Date(i.date).toLocaleDateString() : "N/A")} {i.notes ? `— ${i.notes}` : null} — Running: ₱{Number(i.runningBalance).toFixed(2)}
                      <button style={{ marginLeft: 10 }} onClick={() => addRecurringFromItem(i, "income")}>🔁</button>
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
                {displayedList.filter(e => e.type === "expense").map(e => (
                  <li key={e.id}>₱{e.amount} {e.category ? `(${e.category})` : `(${e.source})`} {e.description ? `— ${e.description}` : ""} — {(e.date ? new Date(e.date).toLocaleDateString() : "N/A")} {e.notes ? `— ${e.notes}` : null} — Running: ₱{Number(e.runningBalance).toFixed(2)}
                    <button style={{ marginLeft: 10 }} onClick={() => addRecurringFromItem(e, "expense")}>🔁</button>
                    <button style={{ marginLeft: 10 }} onClick={() => openEditExpense(e)}>✏️</button>
                    <button style={{ marginLeft: 10 }} onClick={() => deleteExpense(e.id)}>❌</button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}

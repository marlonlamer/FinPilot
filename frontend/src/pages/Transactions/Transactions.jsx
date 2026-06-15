import React, { useMemo, useState, useCallback } from "react";
import "./TransactionsModule.css";

export default function Transactions({ incomes = [], expenses = [], deleteIncome, deleteExpense, openEditIncome, openEditExpense, currencySymbol = "₱", formatCurrency }) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");

  const categories = useMemo(() => {
    const set = new Set();
    incomes.forEach(i => i.category && set.add(i.category));
    expenses.forEach(e => e.category && set.add(e.category));
    return ["all", ...Array.from(set).sort()];
  }, [incomes, expenses]);

  const inDateRange = useCallback((itemDate) => {
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
  }, [dateFilter, customStart, customEnd]);

  const matchesCategory = useCallback((item) => {
    if (categoryFilter === "all") return true;
    return item.category === categoryFilter;
  }, [categoryFilter]);

  const filteredIncomes = useMemo(() => incomes.filter(i => inDateRange(i.date) && matchesCategory(i)), [incomes, inDateRange, matchesCategory]);
  const filteredExpenses = useMemo(() => expenses.filter(e => inDateRange(e.date) && matchesCategory(e)), [expenses, inDateRange, matchesCategory]);

  const matchesSearch = useCallback((item) => {
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
  }, [searchQuery]);

  const sortItems = useCallback((items) => {
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
  }, [sortBy]);

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

    list = list.filter(matchesSearch);
    list = sortItems(list);
    return list;
  }, [typeFilter, filteredIncomes, filteredExpenses, matchesSearch, sortItems]);

  // Group transactions by readable date label (Today, Yesterday, or full date)
  const grouped = useMemo(() => {
    const groups = {};
    const now = new Date();
    const yesterday = new Date(); yesterday.setDate(now.getDate() - 1);

    const labelFor = (d) => {
      if (!d) return 'Unknown';
      if (d.toDateString() === now.toDateString()) return 'Today';
      if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    };

    displayedList.forEach(item => {
      const d = item.date ? new Date(item.date) : null;
      const label = labelFor(d);
      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    });

    return groups;
  }, [displayedList]);

  const getCategoryIcon = (category) => {
    if (!category) return '💳';
    const key = String(category).toLowerCase();
    if (key.includes('food') || key.includes('restaurant')) return '🍔';
    if (key.includes('salary') || key.includes('pay')) return '💼';
    if (key.includes('savings') || key.includes('deposit')) return '🏦';
    if (key.includes('withdraw') || key.includes('atm')) return '🏧';
    if (key.includes('transport')) return '🚗';
    if (key.includes('shopping')) return '🛍️';
    return '💳';
  };

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
      
      <h3>Transactions</h3>
      <div className="transaction-feed">
        {Object.keys(grouped).length === 0 && (
          <div className="transactions-empty">No transactions found</div>
        )}

        {Object.entries(grouped).map(([label, items]) => (
          <div key={label} className="transaction-group">
            <div className="transaction-group-label">{label}</div>
            <ul className="transaction-group-list">
              {items.map(item => {
                const date = item.date ? new Date(item.date) : null;
                const time = date ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
                const isIncome = item.type === 'income';
                const amountAbs = Math.abs(Number(item.amount) || 0);
                const amountDisplay = formatCurrency ? (isIncome ? `+ ${formatCurrency(amountAbs)}` : `- ${formatCurrency(amountAbs)}`) : (isIncome ? `+ ${currencySymbol}${amountAbs.toFixed(2)}` : `- ${currencySymbol}${amountAbs.toFixed(2)}`);
                const icon = getCategoryIcon(item.category || item.source);
                return (
                  <li key={`${item.type}-${item.id}`} className="transaction-item">
                    <div className="transaction-left">
                      <div className="category-icon">{icon}</div>
                      <div className="transaction-content">
                        <div className="transaction-name">{item.category ? item.category : item.source}</div>
                        <div className="transaction-meta">{item.type.charAt(0).toUpperCase() + item.type.slice(1)} • {time}</div>
                      </div>
                    </div>
                    <div className={"transaction-right " + (isIncome ? 'amount-income' : 'amount-expense')}>{amountDisplay}</div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      {/* action buttons removed from feed; no confirm modal needed */}
    </div>
  );
}

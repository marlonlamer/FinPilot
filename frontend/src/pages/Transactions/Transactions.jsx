import React, { useMemo, useState, useCallback } from "react";
import "./TransactionsModule.css";
import TransactionFeed from "../../components/TransactionFeed/TransactionFeed";
import { api, getCurrentUserId } from "../../services/api";

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
  const [savingsEntries, setSavingsEntries] = useState([]);

  // fetch savings history when user present so we can include deposit/withdrawal records
  React.useEffect(() => {
    const uid = getCurrentUserId();
    if (!uid) return;
    let mounted = true;
    api.get(`/savings/history/${uid}`).then(list => { if (!mounted) return; setSavingsEntries(Array.isArray(list) ? list : []); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

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
      // include savings entries mapped into feed items
      const mappedSavings = (savingsEntries || []).map(s => ({ ...s, id: `savings-${s.id}`, type: Number(s.amount) > 0 ? 'savings_deposit' : 'savings_withdraw' }));
      list = [...list, ...mappedSavings];
    } else if (typeFilter === "income") {
      list = filteredIncomes.map(mapIncome);
    } else if (typeFilter === "expense") {
      list = filteredExpenses.map(mapExpense);
    } else if (typeFilter === "savings_deposit") {
      list = (savingsEntries || []).filter(s => Number(s.amount) > 0).map(s => ({ ...s, id: `savings-${s.id}`, type: 'savings_deposit' }));
    } else if (typeFilter === "savings_withdraw") {
      list = (savingsEntries || []).filter(s => Number(s.amount) < 0).map(s => ({ ...s, id: `savings-${s.id}`, type: 'savings_withdraw' }));
    }

    list = list.filter(matchesSearch);
    list = sortItems(list);
    return list;
  }, [typeFilter, filteredIncomes, filteredExpenses, matchesSearch, sortItems]);

  // displayedList is provided to TransactionFeed which handles grouping and icons

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
            <option value="savings_deposit">Savings Deposit</option>
            <option value="savings_withdraw">Savings Withdrawal</option>
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
      <TransactionFeed transactions={displayedList} currencySymbol={currencySymbol} formatCurrency={formatCurrency} />
      {/* action buttons removed from feed; no confirm modal needed */}
    </div>
  );
}

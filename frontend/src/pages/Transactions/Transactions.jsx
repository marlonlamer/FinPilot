import React, { useMemo, useState, useCallback } from "react";
import "./TransactionsModule.css";
import TransactionFeed from "../../components/TransactionFeed/TransactionFeed";

export default function Transactions({ incomes = [], expenses = [], savingsHistory = [], selectedYear, selectedMonth, currencySymbol = "₱", formatCurrency }) {
  // only keep search input per requirements
  const [searchQuery, setSearchQuery] = useState("");

  const inSelectedMonth = useCallback((itemDate) => {
    if (!itemDate) return false;
    const d = new Date(itemDate);
    if (isNaN(d)) return false;
    const y = (typeof selectedYear === 'number') ? selectedYear : new Date().getFullYear();
    const m = (typeof selectedMonth === 'number') ? selectedMonth : new Date().getMonth();
    return d.getFullYear() === y && d.getMonth() === m;
  }, [selectedYear, selectedMonth]);

  const matchesSearch = useCallback((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const checks = [
      item.category,
      item.source,
      item.description,
      item.notes,
      String(item.amount),
      item.goalName
    ];
    return checks.some(v => v && String(v).toLowerCase().includes(q));
  }, [searchQuery]);

  const displayedList = useMemo(() => {
    const mapIncome = (i) => ({ ...i, type: "income" });
    const mapExpense = (e) => ({ ...e, type: "expense" });

    // include incomes and expenses that belong to the selected month
    const list = [
      ...incomes.filter(i => inSelectedMonth(i.date)).map(mapIncome),
      ...expenses.filter(e => inSelectedMonth(e.date)).map(mapExpense),
      ...(savingsHistory || []).map(s => ({ ...s, id: `savings-${s.id}`, type: Number(s.amount) > 0 ? 'savings_deposit' : 'savings_withdraw' }))
    ];

    // filter by search and sort by date desc
    return list.filter(matchesSearch).sort((a, b) => {
      const aDate = new Date(a.date || 0).getTime();
      const bDate = new Date(b.date || 0).getTime();
      return bDate - aDate;
    });
  }, [incomes, expenses, savingsHistory, inSelectedMonth, matchesSearch]);

  return (
    <div className="transactions-root">
      <h2>All Transactions</h2>

      <div className="transactions-controls">
        <div className="transactions-search">
          <input className="transactions-input" placeholder="Search amounts, notes, category..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>

      <h3>Transactions</h3>
      <TransactionFeed transactions={displayedList} currencySymbol={currencySymbol} formatCurrency={formatCurrency} />
    </div>
  );
}

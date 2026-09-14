import React, { useMemo, useState, useCallback } from "react";
import "./TransactionsModule.css";
import TransactionFeed from "../../../components/TransactionFeed/TransactionFeed";
import TransactionsSearchBar from "../components/TransactionsSearchBar";

const monthOptions = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const quickFilters = [
  { key: "all", label: "All" },
  { key: "income", label: "Income" },
  { key: "expense", label: "Expenses" },
  { key: "savings", label: "Savings" }
];

export default function Transactions({ incomes = [], expenses = [], savingsHistory = [], selectedYear, selectedMonth, currencySymbol = "₱", formatCurrency }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMonthFilter, setSelectedMonthFilter] = useState(String(selectedMonth ?? new Date().getMonth()));

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

    const incomeList = incomes.filter(i => inSelectedMonth(i.date)).map(mapIncome);
    const expenseList = expenses.filter(e => inSelectedMonth(e.date)).map(mapExpense);

    const normalizeDate = (s) => s.date || s.createdAt || s.transactionDate || s.timestamp || s.created_at || s.time;
    const mappedSavingsAll = (savingsHistory || []).map(s => {
      const nd = normalizeDate(s);
      return { ...s, id: `savings-${s.id}`, type: Number(s.amount) > 0 ? 'savings_deposit' : 'savings_withdraw', date: nd, _normalizedDate: nd };
    });
    const filteredSavings = mappedSavingsAll.filter(s => inSelectedMonth(s._normalizedDate));

    const list = [
      ...incomeList,
      ...expenseList,
      ...filteredSavings
    ];

    return list.filter(matchesSearch).sort((a, b) => {
      const aDate = new Date(a.date || 0).getTime();
      const bDate = new Date(b.date || 0).getTime();
      return bDate - aDate;
    });
  }, [incomes, expenses, savingsHistory, inSelectedMonth, matchesSearch]);

  const totals = useMemo(() => {
    const income = (incomes || []).filter(i => inSelectedMonth(i.date)).reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const expensesTotal = (expenses || []).filter(e => inSelectedMonth(e.date)).reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return {
      income,
      expenses: expensesTotal,
      net: income - expensesTotal
    };
  }, [incomes, expenses, inSelectedMonth]);

  const formatCurrencyValue = (value) => {
    if (typeof formatCurrency === 'function') return formatCurrency(value);
    return `${currencySymbol}${Number(value || 0).toFixed(2)}`;
  };

  return (
    <div className="transactions-page">
      <header className="transactions-page__header">
        <div className="transactions-page__headerText">
          <p className="transactions-page__eyebrow">Overview</p>
          <h1>Transactions</h1>
          <p className="transactions-page__subtitle">Track your income and expenses in one place.</p>
        </div>
        <button type="button" className="transactions-page__primaryAction">+ Add Transaction</button>
      </header>

      <TransactionsSearchBar
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        monthValue={selectedMonthFilter}
        onMonthChange={e => setSelectedMonthFilter(e.target.value)}
        typeValue={selectedFilter}
        onTypeChange={e => setSelectedFilter(e.target.value)}
        categoryValue={selectedCategory}
        onCategoryChange={e => setSelectedCategory(e.target.value)}
      />

      <div className="transactions-page__content">
        <main className="transactions-page__main">
          <section className="transactions-page__section">
            <div className="transactions-page__sectionHeader">
              <h2>Recent Transactions</h2>
              <span>{displayedList.length} items</span>
            </div>
            <TransactionFeed transactions={displayedList} currencySymbol={currencySymbol} formatCurrency={formatCurrency} />
          </section>
        </main>

        <aside className="transactions-page__sidebar">
          <div className="transactions-summaryCard">
            <div className="transactions-summaryCard__header">
              <h3>Transaction Summary</h3>
            </div>
            <div className="transactions-summaryCard__items">
              <div className="transactions-summaryCard__item transactions-summaryCard__item--income">
                <span>Total Income</span>
                <strong>{formatCurrencyValue(totals.income)}</strong>
              </div>
              <div className="transactions-summaryCard__item transactions-summaryCard__item--expense">
                <span>Total Expenses</span>
                <strong>{formatCurrencyValue(totals.expenses)}</strong>
              </div>
              <div className="transactions-summaryCard__item transactions-summaryCard__item--net">
                <span>Net Flow</span>
                <strong>{formatCurrencyValue(totals.net)}</strong>
              </div>
            </div>
          </div>

          <div className="transactions-summaryCard">
            <div className="transactions-summaryCard__header">
              <h3>Quick Filters</h3>
            </div>
            <div className="transactions-quickFilters">
              {quickFilters.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  className={`transactions-quickFilter ${selectedFilter === filter.key ? 'is-active' : ''}`}
                  onClick={() => setSelectedFilter(filter.key)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

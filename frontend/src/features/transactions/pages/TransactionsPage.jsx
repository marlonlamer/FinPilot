import React, { useMemo, useState, useCallback, useEffect } from "react";
import "./TransactionsModule.css";
import TransactionFeed from "../../../components/TransactionFeed/TransactionFeed";
import ConfirmModal from "../../../components/ConfirmModal/ConfirmModal";
import TransactionsSearchBar from "../components/TransactionsSearchBar";
import AddTransactionModal from "../components/AddTransactionModal";
import ViewTransactionModal from "../components/ViewTransactionModal";

const timeframeOptions = [
  { value: "all", label: "All Time" },
  { value: "day", label: "By Day" },
  { value: "month", label: "By Month" },
  { value: "year", label: "By Year" }
];

export default function Transactions({
  incomes = [],
  expenses = [],
  savingsHistory = [],
  selectedYear,
  selectedMonth,
  currencySymbol = "₱",
  formatCurrency,
  onCreateExpense,
  onCreateIncome,
  onUpdateExpense,
  onUpdateIncome,
  deleteExpense,
  deleteIncome,
  openEditExpense,
  openEditIncome
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFlow, setSelectedFlow] = useState("all");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState("all");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedMonthFilter, setSelectedMonthFilter] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYearFilter, setSelectedYearFilter] = useState(String(new Date().getFullYear()));
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [viewedTransaction, setViewedTransaction] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const openAddTransactionModal = () => {
    setEditingTransaction(null);
    setAddModalOpen(true);
  };

  const handleViewTransaction = (item) => {
    setViewedTransaction(item);
  };

  const handleEditTransaction = (item) => {
    setEditingTransaction(item);
    setAddModalOpen(true);
  };

  const handleDeleteRequest = (item) => {
    setPendingDelete(item);
  };

  const confirmDeleteTransaction = async () => {
    if (!pendingDelete) return;
    const item = pendingDelete;
    const type = String(item.type || "").toLowerCase();
    if (type.includes("income")) {
      if (typeof deleteIncome === "function") await deleteIncome(item.id);
    } else if (type.includes("expense")) {
      if (typeof deleteExpense === "function") await deleteExpense(item.id);
    }
    setPendingDelete(null);
  };

  const inSelectedMonth = useCallback((itemDate) => {
    if (!itemDate) return false;
    const d = new Date(itemDate);
    if (isNaN(d)) return false;
    const y = (typeof selectedYear === 'number') ? selectedYear : new Date().getFullYear();
    const m = (typeof selectedMonth === 'number') ? selectedMonth : new Date().getMonth();
    return d.getFullYear() === y && d.getMonth() === m;
  }, [selectedYear, selectedMonth]);

  const accountOptions = useMemo(() => {
    const values = [
      ...(incomes || []).map(item => item.account || item.destination || item.destinationAccount || item.payerSource || item.source),
      ...(expenses || []).map(item => item.account || item.paymentSource || item.paymentSourceAccount || item.source || item.merchant),
      ...(savingsHistory || []).map(item => item.account || item.source || item.destination || item.paymentSource)
    ].filter(value => value && String(value).trim());

    const unique = [...new Set(values.map(value => String(value).trim()))].sort((a, b) => a.localeCompare(b));
    return [{ value: "all", label: "All Accounts" }, ...unique.map(value => ({ value: value.toLowerCase(), label: value }))];
  }, [incomes, expenses, savingsHistory]);

  const matchesAccount = useCallback((item) => {
    if (selectedAccount === "all") return true;
    const itemValue = String(
      item.account ||
      item.destination ||
      item.destinationAccount ||
      item.paymentSource ||
      item.paymentSourceAccount ||
      item.source ||
      item.payerSource ||
      item.merchant ||
      item.recipient ||
      ""
    ).trim().toLowerCase();
    return itemValue === selectedAccount;
  }, [selectedAccount]);

  const matchesTimeframe = useCallback((item) => {
    if (selectedTimeframe === "all") return true;
    const rawDate = item.date || item.createdAt || item.transactionDate || item.timestamp || item.created_at || item.time;
    if (!rawDate) return false;
    const date = new Date(rawDate);
    if (isNaN(date)) return false;

    if (selectedTimeframe === "day") {
      return date.toISOString().slice(0, 10) === selectedDate;
    }

    if (selectedTimeframe === "month") {
      const monthValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      return monthValue === selectedMonthFilter;
    }

    if (selectedTimeframe === "year") {
      return String(date.getFullYear()) === selectedYearFilter;
    }

    return true;
  }, [selectedTimeframe, selectedDate, selectedMonthFilter, selectedYearFilter]);

  const matchesSearch = useCallback((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const checks = [
      item.category,
      item.source,
      item.account,
      item.paymentSource,
      item.paymentMethod,
      item.description,
      item.notes,
      String(item.amount),
      item.goalName
    ];
    return checks.some(v => v && String(v).toLowerCase().includes(q));
  }, [searchQuery]);

  const matchesFlow = useCallback((item) => {
    if (selectedFlow === "all") return true;

    const type = String(item.type || "").toLowerCase();
    const direction = String(item.direction || item.flow || item.transactionDirection || "").toLowerCase();
    const amount = Number(item.amount || 0);
    const hasSavingsId = Boolean(item.savingsId);
    const isInflow = type.includes("income") ||
      (type.includes("deposit") && !type.includes("withdraw")) ||
      (hasSavingsId && amount > 0) ||
      ["inflow", "in", "up", "upward"].includes(direction);
    const isOutflow = type.includes("expense") ||
      type.includes("withdraw") ||
      type.includes("debt") ||
      type.includes("bill") ||
      (hasSavingsId && amount < 0) ||
      ["outflow", "out", "down", "downward"].includes(direction);

    return selectedFlow === "inflow" ? isInflow : !isInflow && isOutflow;
  }, [selectedFlow]);

  const categoryOptions = useMemo(() => {
    const sourceItems = [...(incomes || []), ...(expenses || []), ...(savingsHistory || [])];
    const categories = sourceItems
      .map(item => item.category)
      .filter(category => category && String(category).trim())
      .map(category => String(category).trim());
    return [...new Set(categories)]
      .sort((a, b) => a.localeCompare(b))
      .map(category => ({ value: category.toLowerCase(), label: category }));
  }, [incomes, expenses, savingsHistory]);

  const categoryLookup = useMemo(
    () => new Set(categoryOptions.filter(option => option.value === selectedCategory).map(option => option.value)),
    [categoryOptions, selectedCategory]
  );

  const matchesType = useCallback((item) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "income") return item.type === "income";
    if (selectedFilter === "expense") return item.type === "expense";
    return item.type === "savings_deposit" || item.type === "savings_withdraw";
  }, [selectedFilter]);

  const matchesCategory = useCallback((item) => {
    if (selectedCategory === "all") return true;
    return categoryLookup.has(String(item.category || "").trim().toLowerCase());
  }, [categoryLookup, selectedCategory]);

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

    return list.filter(item => matchesSearch(item) && matchesFlow(item) && matchesType(item) && matchesCategory(item) && matchesAccount(item) && matchesTimeframe(item)).sort((a, b) => {
      const aDate = new Date(a.date || 0).getTime();
      const bDate = new Date(b.date || 0).getTime();
      return bDate - aDate;
    });
  }, [incomes, expenses, savingsHistory, inSelectedMonth, matchesSearch, matchesFlow, matchesType, matchesCategory, matchesAccount, matchesTimeframe]);

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

  const monthLabel = new Date(
    typeof selectedYear === "number" ? selectedYear : new Date().getFullYear(),
    typeof selectedMonth === "number" ? selectedMonth : new Date().getMonth(),
    1
  ).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const hasActiveFilters = Boolean(searchQuery.trim()) || selectedFlow !== "all" || selectedFilter !== "all" || selectedCategory !== "all" || selectedAccount !== "all" || selectedTimeframe !== "all";
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedFlow("all");
    setSelectedFilter("all");
    setSelectedCategory("all");
    setSelectedAccount("all");
    setSelectedTimeframe("all");
    setSelectedDate(new Date().toISOString().slice(0, 10));
    setSelectedMonthFilter(new Date().toISOString().slice(0, 7));
    setSelectedYearFilter(String(new Date().getFullYear()));
  };

  useEffect(() => {
    if (selectedTimeframe === "all") return;
    if (selectedTimeframe === "day" && !selectedDate) {
      setSelectedDate(new Date().toISOString().slice(0, 10));
    }
    if (selectedTimeframe === "month" && !selectedMonthFilter) {
      setSelectedMonthFilter(new Date().toISOString().slice(0, 7));
    }
    if (selectedTimeframe === "year" && !selectedYearFilter) {
      setSelectedYearFilter(String(new Date().getFullYear()));
    }
  }, [selectedTimeframe, selectedDate, selectedMonthFilter, selectedYearFilter]);

  return (
    <div className="transactions-page">
      <header className="transactions-page__header">
        <div className="transactions-page__headerText">
          <p className="transactions-page__eyebrow">Overview</p>
          <h1>Transactions</h1>
          <p className="transactions-page__subtitle">Track your income and expenses in one place.</p>
        </div>
        <button type="button" className="transactions-page__primaryAction" onClick={openAddTransactionModal}>+ Add Transaction</button>
      </header>

      <TransactionsSearchBar
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        flowValue={selectedFlow}
        onFlowChange={setSelectedFlow}
        hasActiveFilters={hasActiveFilters}
        onReset={resetFilters}
      />

      <div className="transactions-page__content">
        <main className="transactions-page__main">
          <section className="transactions-page__section">
            <div className="transactions-page__sectionHeader">
              <h2>Recent Transactions</h2>
              <span>{displayedList.length} items</span>
            </div>
            <TransactionFeed
              transactions={displayedList}
              currencySymbol={currencySymbol}
              formatCurrency={formatCurrency}
              deleteExpense={deleteExpense}
              deleteIncome={deleteIncome}
              openEditExpense={handleEditTransaction}
              openEditIncome={handleEditTransaction}
              onViewTransaction={handleViewTransaction}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteRequest}
            />
          </section>
        </main>

        <aside className="transactions-page__sidebar">
          <div className="transactions-summaryCard">
            <div className="transactions-summaryCard__header">
              <h3>Filters</h3>
            </div>

            <div className="transactions-filterStack">
              <label className="transactions-filterField">
                <span>Date / Timeframe</span>
                <select
                  className="transactions-select"
                  value={selectedTimeframe}
                  onChange={e => setSelectedTimeframe(e.target.value)}
                >
                  {timeframeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              {selectedTimeframe === "day" && (
                <label className="transactions-filterField">
                  <span>Date</span>
                  <input
                    type="date"
                    className="transactions-input"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                  />
                </label>
              )}

              {selectedTimeframe === "month" && (
                <label className="transactions-filterField">
                  <span>Month</span>
                  <input
                    type="month"
                    className="transactions-input"
                    value={selectedMonthFilter}
                    onChange={e => setSelectedMonthFilter(e.target.value)}
                  />
                </label>
              )}

              {selectedTimeframe === "year" && (
                <label className="transactions-filterField">
                  <span>Year</span>
                  <select
                    className="transactions-select"
                    value={selectedYearFilter}
                    onChange={e => setSelectedYearFilter(e.target.value)}
                  >
                    {[...new Set([
                      ...incomes.map(item => new Date(item.date || Date.now()).getFullYear()),
                      ...expenses.map(item => new Date(item.date || Date.now()).getFullYear()),
                      ...(savingsHistory || []).map(item => new Date(item.date || item.createdAt || Date.now()).getFullYear())
                    ])].sort((a, b) => b - a).map(year => (
                      <option key={year} value={String(year)}>{year}</option>
                    ))}
                  </select>
                </label>
              )}

              <label className="transactions-filterField">
                <span>Type</span>
                <select className="transactions-select" value={selectedFilter} onChange={e => setSelectedFilter(e.target.value)}>
                  <option value="all">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expenses</option>
                  <option value="savings">Savings</option>
                </select>
              </label>

              <label className="transactions-filterField">
                <span>Category</span>
                <select className="transactions-select" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                  <option value="all">All Categories</option>
                  {categoryOptions.map(category => (
                    <option key={category.value} value={category.value}>{category.label}</option>
                  ))}
                </select>
              </label>

              <label className="transactions-filterField">
                <span>Account / Card / Destination</span>
                <select className="transactions-select" value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}>
                  {accountOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </aside>
      </div>

      <AddTransactionModal
        open={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setEditingTransaction(null);
        }}
        onCreateExpense={onCreateExpense}
        onCreateIncome={onCreateIncome}
        onUpdateExpense={onUpdateExpense}
        onUpdateIncome={onUpdateIncome}
        editingTransaction={editingTransaction}
        currencySymbol={currencySymbol}
      />

      <ViewTransactionModal
        open={Boolean(viewedTransaction)}
        transaction={viewedTransaction}
        onClose={() => setViewedTransaction(null)}
        currencySymbol={currencySymbol}
        formatCurrency={formatCurrency}
      />

      <ConfirmModal
        open={Boolean(pendingDelete)}
        message={`Delete this ${pendingDelete && String(pendingDelete.type || "").toLowerCase().includes("income") ? "income" : "expense"} transaction? This action cannot be undone.`}
        onConfirm={confirmDeleteTransaction}
        onCancel={() => setPendingDelete(null)}
        confirmLabel="Delete"
      />
    </div>
  );
}

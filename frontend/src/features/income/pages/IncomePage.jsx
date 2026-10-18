import React, { useCallback, useMemo, useState } from "react";
import "./IncomeModule.css";
import TransactionFeed from "../../../components/TransactionFeed/TransactionFeed";
import IncomeHeader from "../components/IncomeHeader";
import IncomeStats from "../components/IncomeStats";
import IncomeTrend from "../components/IncomeTrend";
import IncomeByCategory from "../components/IncomeByCategory";
import AddTransactionModal from "../../transactions/components/AddTransactionModal";
import "../components/IncomeHeader.css";
import "../components/IncomeStats.css";

const timeframeOptions = [
  { value: "all", label: "All Time" },
  { value: "day", label: "By Day" },
  { value: "week", label: "By Week" },
  { value: "month", label: "By Month" },
  { value: "year", label: "By Year" }
];

const normalizeValue = (value) => String(value ?? "").trim().toLowerCase();

const getLocalDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getIncomeDate = (item) => {
  const rawDate = item?.date || item?.createdAt || item?.created_at || item?.timestamp;
  if (!rawDate) return null;

  if (typeof rawDate === "string") {
    const dateOnlyMatch = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }

  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getWeekValue = (date) => {
  const value = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  value.setUTCDate(value.getUTCDate() + 4 - (value.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((value - yearStart) / 86400000 + 1) / 7);
  return `${value.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};

const getPreviousWeekValue = (weekValue) => {
  const match = weekValue.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return null;
  const [, year, week] = match;
  const jan4 = new Date(Date.UTC(Number(year), 0, 4));
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1) + (Number(week) - 1) * 7 - 7);
  return getWeekValue(new Date(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate()));
};

const getPreviousMonthValue = (monthValue) => {
  const match = monthValue.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const [, year, month] = match;
  const date = new Date(Number(year), Number(month) - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const getPeriodDisplayLabel = (timeframe) => ({
  all: "All Time",
  day: "This Day",
  week: "This Week",
  month: "This Month",
  year: "This Year"
}[timeframe] || "All Time");

const getComparisonText = (timeframe) => ({
  day: "vs previous day",
  week: "vs previous week",
  month: "vs previous month",
  year: "vs previous year"
}[timeframe] || "Total income");

const getPeriodKey = (date, timeframe) => {
  if (timeframe === "day") return getLocalDateValue(date);
  if (timeframe === "week") return getWeekValue(date);
  if (timeframe === "month") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
  if (timeframe === "year") return String(date.getFullYear());
  return "all";
};

export default function IncomePage({
  incomes = [],
  deleteIncome,
  onCreateExpense,
  onCreateIncome,
  onUpdateExpense,
  onUpdateIncome,
  currencySymbol = "₱",
  formatCurrency
}) {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState("month");
  const [selectedDate, setSelectedDate] = useState(getLocalDateValue(new Date()));
  const [selectedWeek, setSelectedWeek] = useState(getWeekValue(new Date()));
  const [selectedMonthFilter, setSelectedMonthFilter] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selectedYearFilter, setSelectedYearFilter] = useState(String(new Date().getFullYear()));
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [selectedSource, setSelectedSource] = useState("all");

  const categoryOptions = useMemo(() => {
    const itemCategories = incomes
      .map(item => item.category || item.title || item.type)
      .filter(Boolean)
      .map(value => String(value).trim())
      .filter(Boolean);

    return [...new Set(itemCategories)].sort((a, b) => a.localeCompare(b)).map(value => ({
      value: value.toLowerCase(),
      label: value
    }));
  }, [incomes]);

  const accountOptions = useMemo(() => {
    const values = incomes
      .map(item => item.account || item.destination || item.payer || item.payerSource || item.source)
      .filter(Boolean)
      .map(value => String(value).trim())
      .filter(Boolean);

    return [...new Set(values)].sort((a, b) => a.localeCompare(b)).map(value => ({
      value: value.toLowerCase(),
      label: value
    }));
  }, [incomes]);

  const sourceOptions = useMemo(() => {
    const values = incomes
      .map(item => item.source || item.payer || item.payerSource)
      .filter(Boolean)
      .map(value => String(value).trim())
      .filter(Boolean);

    return [...new Set(values)].sort((a, b) => a.localeCompare(b)).map(value => ({
      value: value.toLowerCase(),
      label: value
    }));
  }, [incomes]);

  const years = useMemo(() => {
    const values = (incomes || [])
      .map(item => getIncomeDate(item))
      .filter(Boolean)
      .map(date => date.getFullYear());
    values.push(new Date().getFullYear(), Number(selectedYearFilter));
    return [...new Set(values)].sort((a, b) => b - a);
  }, [incomes, selectedYearFilter]);

  const matchesTimeframe = useCallback((item) => {
    if (selectedTimeframe === "all") return true;
    const date = getIncomeDate(item);
    if (!date) return false;
    const period = selectedTimeframe === "day"
      ? selectedDate
      : selectedTimeframe === "week"
        ? selectedWeek
        : selectedTimeframe === "month"
          ? selectedMonthFilter
          : selectedYearFilter;
    return getPeriodKey(date, selectedTimeframe) === period;
  }, [selectedTimeframe, selectedDate, selectedWeek, selectedMonthFilter, selectedYearFilter]);

  const matchesOtherFilters = useCallback((item) => {
    const category = normalizeValue(item.category || item.title || item.type || "");
    const account = normalizeValue(item.account || item.destination || item.payer || item.payerSource || item.source || "");
    const source = normalizeValue(item.source || item.payer || item.payerSource || "");
    return (selectedCategory === "all" || category === selectedCategory) &&
      (selectedAccount === "all" || account === selectedAccount) &&
      (selectedSource === "all" || source === selectedSource);
  }, [selectedCategory, selectedAccount, selectedSource]);

  const filteredIncomes = useMemo(() => {
    return (incomes || []).filter(item => matchesTimeframe(item) && matchesOtherFilters(item));
  }, [incomes, matchesTimeframe, matchesOtherFilters]);

  const previousPeriodKey = useMemo(() => {
    if (selectedTimeframe === "day") {
      const date = getIncomeDate({ date: selectedDate });
      if (!date) return null;
      date.setDate(date.getDate() - 1);
      return getLocalDateValue(date);
    }
    if (selectedTimeframe === "week") return getPreviousWeekValue(selectedWeek);
    if (selectedTimeframe === "month") return getPreviousMonthValue(selectedMonthFilter);
    if (selectedTimeframe === "year") return String(Number(selectedYearFilter) - 1);
    return null;
  }, [selectedTimeframe, selectedDate, selectedWeek, selectedMonthFilter, selectedYearFilter]);

  const previousPeriodTotal = useMemo(() => {
    if (!previousPeriodKey) return 0;
    return (incomes || []).reduce((sum, item) => {
      if (!matchesOtherFilters(item)) return sum;
      const date = getIncomeDate(item);
      if (!date || getPeriodKey(date, selectedTimeframe) !== previousPeriodKey) return sum;
      return sum + (Number(item.amount) || 0);
    }, 0);
  }, [incomes, selectedTimeframe, previousPeriodKey, matchesOtherFilters]);

  const currentPeriodTotal = useMemo(() => {
    return filteredIncomes.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredIncomes]);

  const averageIncome = useMemo(() => {
    if (filteredIncomes.length === 0) return 0;
    return currentPeriodTotal / filteredIncomes.length;
  }, [currentPeriodTotal, filteredIncomes]);

  const comparisonSummary = useMemo(() => {
    if (selectedTimeframe === "all") return { text: "Total income" };
    if (previousPeriodTotal === 0) return { text: "No previous data" };

    const percentChange = ((currentPeriodTotal - previousPeriodTotal) / previousPeriodTotal) * 100;
    const direction = percentChange >= 0 ? "↑" : "↓";
    const percentage = `${Math.abs(percentChange).toFixed(1)}%`;
    return { text: `${direction} ${percentage} ${getComparisonText(selectedTimeframe)}` };
  }, [currentPeriodTotal, previousPeriodTotal, selectedTimeframe]);

  const monthlyDisplay = formatCurrency ? formatCurrency(currentPeriodTotal) : `${currencySymbol}${currentPeriodTotal.toFixed(2)}`;
  const averageIncomeDisplay = formatCurrency ? formatCurrency(averageIncome) : `${currencySymbol}${averageIncome.toFixed(2)}`;

  const resetFilters = () => {
    const now = new Date();
    setSelectedTimeframe("month");
    setSelectedDate(getLocalDateValue(now));
    setSelectedWeek(getWeekValue(now));
    setSelectedMonthFilter(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    setSelectedYearFilter(String(now.getFullYear()));
    setSelectedCategory("all");
    setSelectedAccount("all");
    setSelectedSource("all");
  };

  const primaryLabel = getPeriodDisplayLabel(selectedTimeframe);

  const openAddIncome = () => {
    setEditingTransaction(null);
    setAddModalOpen(true);
  };

  const handleEditIncome = (item) => {
    setEditingTransaction({ ...item, type: "income" });
    setAddModalOpen(true);
  };

  const closeModal = () => {
    setAddModalOpen(false);
    setEditingTransaction(null);
  };

  return (
    <div className="income-root">
      <IncomeHeader onAddClick={openAddIncome} />

      <div className="income-page-layout">
        <IncomeStats
          monthlyDisplay={monthlyDisplay}
          averageIncomeDisplay={averageIncomeDisplay}
          primaryLabel={primaryLabel}
          primarySupportText={comparisonSummary.text}
        />

        <aside className="income-page-sidebar">
          <div className="income-filter-card">
            <div className="income-filter-header">
              <h3>Filters</h3>
            </div>

            <div className="income-filter-stack">
              <label className="income-filter-field">
                <span>Timeframe</span>
                <select
                  className="income-filter-select"
                  value={selectedTimeframe}
                  onChange={(event) => setSelectedTimeframe(event.target.value)}
                >
                  {timeframeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              {selectedTimeframe === "day" && (
                <label className="income-filter-field">
                  <span>Date</span>
                  <input
                    type="date"
                    className="income-filter-input"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                  />
                </label>
              )}

              {selectedTimeframe === "week" && (
                <label className="income-filter-field">
                  <span>Week</span>
                  <input
                    type="week"
                    className="income-filter-input"
                    value={selectedWeek}
                    onChange={(event) => setSelectedWeek(event.target.value)}
                  />
                </label>
              )}

              {selectedTimeframe === "month" && (
                <label className="income-filter-field">
                  <span>Month</span>
                  <input
                    type="month"
                    className="income-filter-input"
                    value={selectedMonthFilter}
                    onChange={(event) => setSelectedMonthFilter(event.target.value)}
                  />
                </label>
              )}

              {selectedTimeframe === "year" && (
                <label className="income-filter-field">
                  <span>Year</span>
                  <select
                    className="income-filter-select"
                    value={selectedYearFilter}
                    onChange={(event) => setSelectedYearFilter(event.target.value)}
                  >
                    {years.map(year => <option key={year} value={String(year)}>{year}</option>)}
                  </select>
                </label>
              )}

              <label className="income-filter-field">
                <span>Category</span>
                <select
                  className="income-filter-select"
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categoryOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="income-filter-field">
                <span>Account / Destination</span>
                <select
                  className="income-filter-select"
                  value={selectedAccount}
                  onChange={(event) => setSelectedAccount(event.target.value)}
                >
                  <option value="all">All Accounts</option>
                  {accountOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="income-filter-field">
                <span>Source / Payer</span>
                <select
                  className="income-filter-select"
                  value={selectedSource}
                  onChange={(event) => setSelectedSource(event.target.value)}
                >
                  <option value="all">All Sources</option>
                  {sourceOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              {(selectedTimeframe !== "month" || selectedCategory !== "all" || selectedAccount !== "all" || selectedSource !== "all") && (
                <button type="button" className="income-filter-reset" onClick={resetFilters}>
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </aside>

        <main className="income-content">
          <IncomeTrend incomes={incomes} currencySymbol={currencySymbol} formatCurrency={formatCurrency} />
          <div className="income-transactions-layout">
            <section className="income-transaction-list">
              <h3 className="section-title">All Incomes</h3>
              <TransactionFeed
                transactions={filteredIncomes.map(i => ({ ...i, type: "income" }))}
                currencySymbol={currencySymbol}
                formatCurrency={formatCurrency}
                deleteIncome={deleteIncome}
                openEditIncome={handleEditIncome}
                onEditTransaction={handleEditIncome}
              />
            </section>
            <IncomeByCategory
              incomes={filteredIncomes}
              currencySymbol={currencySymbol}
              formatCurrency={formatCurrency}
            />
          </div>
        </main>
      </div>

      <AddTransactionModal
        open={addModalOpen}
        onClose={closeModal}
        onCreateExpense={onCreateExpense}
        onCreateIncome={onCreateIncome}
        onUpdateExpense={onUpdateExpense}
        onUpdateIncome={onUpdateIncome}
        editingTransaction={editingTransaction}
        defaultType="income"
        mode="income"
        currencySymbol={currencySymbol}
      />
    </div>
  );
}

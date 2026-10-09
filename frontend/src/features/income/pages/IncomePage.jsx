import React, { useMemo, useState } from "react";
import "./IncomeModule.css";
import TransactionFeed from "../../../components/TransactionFeed/TransactionFeed";
import IncomeHeader from "../components/IncomeHeader";
import IncomeStats from "../components/IncomeStats";
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

const getStartOfWeek = (date) => {
  const value = new Date(date);
  const day = value.getDay();
  const diff = value.getDate() - day + (day === 0 ? -6 : 1);
  value.setDate(diff);
  value.setHours(0, 0, 0, 0);
  return value;
};

const getWeekValue = (date) => {
  const current = new Date(date);
  const year = current.getFullYear();
  const start = new Date(year, 0, 1);
  const diff = current - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay) + 1;
  const week = Math.ceil((dayOfYear + start.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
};

const parseWeekValue = (value) => {
  if (!value) return null;
  const match = value.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return null;
  const [, year, weekString] = match;
  const yearNumber = Number(year);
  const weekNumber = Number(weekString);
  const start = new Date(Date.UTC(yearNumber, 0, 4));
  const day = start.getUTCDay() || 7;
  start.setUTCDate(start.getUTCDate() + (weekNumber - 1) * 7 + (1 - day));
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 * 0);
};

const getPeriodDisplayLabel = (timeframe) => {
  if (timeframe === "day") return "This Day";
  if (timeframe === "week") return "This Week";
  if (timeframe === "month") return "This Month";
  if (timeframe === "year") return "This Year";
  return "All Time";
};

const getComparisonText = (timeframe) => {
  if (timeframe === "day") return "vs previous day";
  if (timeframe === "week") return "vs previous week";
  if (timeframe === "month") return "vs last month";
  if (timeframe === "year") return "vs previous year";
  return "Total income";
};

export default function IncomePage({
  incomes = [],
  deleteIncome,
  onCreateExpense,
  onCreateIncome,
  onUpdateExpense,
  onUpdateIncome,
  selectedYear,
  selectedMonth,
  currencySymbol = "₱",
  formatCurrency
}) {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState("month");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedWeek, setSelectedWeek] = useState(getWeekValue(new Date()));
  const [selectedMonthFilter, setSelectedMonthFilter] = useState(new Date().toISOString().slice(0, 7));
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

  const matchesTimeframe = (item) => {
    if (!item || !item.date) return false;
    const date = new Date(item.date);
    if (Number.isNaN(date.getTime())) return false;

    if (selectedTimeframe === "all") return true;
    if (selectedTimeframe === "day") {
      return date.toISOString().slice(0, 10) === selectedDate;
    }
    if (selectedTimeframe === "week") {
      const weekStart = parseWeekValue(selectedWeek);
      if (!weekStart) return true;
      const currentWeekStart = getStartOfWeek(date);
      return currentWeekStart.getTime() === weekStart.getTime();
    }
    if (selectedTimeframe === "month") {
      const monthValue = selectedMonthFilter || new Date().toISOString().slice(0, 7);
      const [year, month] = monthValue.split("-");
      return date.getFullYear() === Number(year) && date.getMonth() === Number(month) - 1;
    }
    if (selectedTimeframe === "year") {
      return date.getFullYear() === Number(selectedYearFilter || new Date().getFullYear());
    }
    return true;
  };

  const matchesCategory = (item) => {
    if (selectedCategory === "all") return true;
    const lookedUpValue = normalizeValue(item.category || item.title || item.type || "");
    return lookedUpValue === selectedCategory;
  };

  const matchesAccount = (item) => {
    if (selectedAccount === "all") return true;
    const accountValue = normalizeValue(item.account || item.destination || item.payer || item.payerSource || item.source || "");
    return accountValue === selectedAccount;
  };

  const matchesSource = (item) => {
    if (selectedSource === "all") return true;
    const sourceValue = normalizeValue(item.source || item.payer || item.payerSource || "");
    return sourceValue === selectedSource;
  };

  const filteredIncomes = useMemo(() => {
    return (incomes || []).filter(item => matchesTimeframe(item) && matchesCategory(item) && matchesAccount(item) && matchesSource(item));
  }, [incomes, selectedTimeframe, selectedDate, selectedWeek, selectedMonthFilter, selectedYearFilter, selectedCategory, selectedAccount, selectedSource]);

  const getPreviousPeriodTotal = (items) => {
    if (selectedTimeframe === "all") return 0;

    const sumForPeriod = (list, compareFn) => list.reduce((sum, item) => {
      const itemDate = new Date(item.date);
      if (!Number.isNaN(itemDate.getTime()) && compareFn(itemDate)) {
        return sum + (Number(item.amount) || 0);
      }
      return sum;
    }, 0);

    if (selectedTimeframe === "day") {
      const baseDate = new Date(selectedDate);
      const previousDate = new Date(baseDate);
      previousDate.setDate(baseDate.getDate() - 1);
      const iso = previousDate.toISOString().slice(0, 10);
      return sumForPeriod(items, date => date.toISOString().slice(0, 10) === iso);
    }

    if (selectedTimeframe === "week") {
      const baseDate = parseWeekValue(selectedWeek) || new Date();
      const previousWeekStart = new Date(baseDate);
      previousWeekStart.setDate(baseDate.getDate() - 7);
      const previousWeekEnd = new Date(previousWeekStart);
      previousWeekEnd.setDate(previousWeekEnd.getDate() + 6);
      return sumForPeriod(items, date => {
        const value = new Date(date);
        return value >= previousWeekStart && value <= previousWeekEnd;
      });
    }

    if (selectedTimeframe === "month") {
      const baseMonth = new Date(`${selectedMonthFilter || new Date().toISOString().slice(0, 7)}-01T00:00:00`);
      const previousMonth = new Date(baseMonth);
      previousMonth.setMonth(baseMonth.getMonth() - 1);
      return sumForPeriod(items, date => {
        return date.getFullYear() === previousMonth.getFullYear() && date.getMonth() === previousMonth.getMonth();
      });
    }

    if (selectedTimeframe === "year") {
      const baseYear = Number(selectedYearFilter || new Date().getFullYear()) - 1;
      return sumForPeriod(items, date => date.getFullYear() === baseYear);
    }

    return 0;
  };

  const currentPeriodTotal = useMemo(() => {
    return filteredIncomes.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredIncomes]);

  const previousPeriodTotal = useMemo(() => {
    return getPreviousPeriodTotal(incomes || []);
  }, [incomes, selectedTimeframe, selectedDate, selectedWeek, selectedMonthFilter, selectedYearFilter]);

  const averageIncome = useMemo(() => {
    if (filteredIncomes.length === 0) return 0;
    return currentPeriodTotal / filteredIncomes.length;
  }, [currentPeriodTotal, filteredIncomes]);

  const monthlyDisplay = formatCurrency ? formatCurrency(currentPeriodTotal) : `${currencySymbol}${currentPeriodTotal.toFixed(2)}`;
  const averageIncomeDisplay = formatCurrency ? formatCurrency(averageIncome) : `${currencySymbol}${averageIncome.toFixed(2)}`;

  const comparisonSummary = useMemo(() => {
    if (selectedTimeframe === "all") {
      return { text: "Total income", positive: true, value: null };
    }

    if (previousPeriodTotal === 0) {
      return { text: "No previous data", positive: true, value: null };
    }

    const percentChange = ((currentPeriodTotal - previousPeriodTotal) / previousPeriodTotal) * 100;
    const direction = percentChange >= 0 ? "↑" : "↓";
    const percentage = `${Math.abs(percentChange).toFixed(1)}%`;
    return { text: `${direction} ${percentage} ${getComparisonText(selectedTimeframe)}`, positive: percentChange >= 0, value: percentChange };
  }, [currentPeriodTotal, previousPeriodTotal, selectedTimeframe]);

  const resetFilters = () => {
    setSelectedTimeframe("month");
    setSelectedDate(new Date().toISOString().slice(0, 10));
    setSelectedWeek(getWeekValue(new Date()));
    setSelectedMonthFilter(new Date().toISOString().slice(0, 7));
    setSelectedYearFilter(String(new Date().getFullYear()));
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
        <main className="income-content">
          <IncomeStats
            monthlyDisplay={monthlyDisplay}
            averageIncomeDisplay={averageIncomeDisplay}
            primaryLabel={primaryLabel}
            primarySupportText={comparisonSummary.text}
          />

          <h3 className="section-title">All Incomes</h3>
          <TransactionFeed
            transactions={filteredIncomes.map(i => ({ ...i, type: "income" }))}
            currencySymbol={currencySymbol}
            formatCurrency={formatCurrency}
            deleteIncome={deleteIncome}
            openEditIncome={handleEditIncome}
            onEditTransaction={handleEditIncome}
          />
        </main>

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
                    {Array.from({ length: 10 }, (_, index) => new Date().getFullYear() - index)
                      .map((year) => (
                        <option key={year} value={String(year)}>{year}</option>
                      ))}
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

              {(selectedTimeframe !== "all" || selectedCategory !== "all" || selectedAccount !== "all" || selectedSource !== "all") && (
                <button type="button" className="income-filter-reset" onClick={resetFilters}>
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </aside>
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

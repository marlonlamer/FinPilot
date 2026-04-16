import React, { useEffect, useState, useRef } from "react";
import { api } from "./api";
import "./App.css";

import Dashboard from "./pages/dashboard";
import Transactions from "./pages/transactions";
import Income from "./pages/income";
import Expenses from "./pages/expenses";
import Savings from "./pages/savings";
import Reports from "./pages/reports";
import Profile from "./pages/profile";
import Settings from "./pages/settings";

function App() {
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);

  const [incomeForm, setIncomeForm] = useState({
    amount: "",
    category: "",
    source: "",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
    recurring: false,
    recurrence: "monthly"
  });

  const [form, setForm] = useState({
    amount: "",
    category: "",
    description: "",
    source: "",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
    recurring: false,
    recurrence: "monthly",
    paymentMethod: ""
  });

  const [dateFilter, setDateFilter] = useState("all");
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  // derive a user key from token (fall back to guest) so budgets are per-user
  const getUserKey = () => {
    try { return localStorage.getItem("token") || "guest"; } catch { return "guest"; }
  };
  const userKey = getUserKey();

  // store monthly budgets in a map keyed by `${userKey}:YYYY-MM`
  const [monthlyBudgetMap, setMonthlyBudgetMap] = useState(() => {
    try {
      const raw = localStorage.getItem("monthlyBudgetMap");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const currentMonthKey = `${userKey}:${selectedYear}-${String((selectedMonth || 0) + 1).padStart(2, "0")}`;
  const selectedMonthlyBudget = monthlyBudgetMap[currentMonthKey] != null ? Number(monthlyBudgetMap[currentMonthKey]) : null;

  const setMonthlyBudgetForCurrentMonth = (val) => {
    setMonthlyBudgetMap(prev => {
      const next = { ...prev };
      if (val == null) delete next[currentMonthKey]; else next[currentMonthKey] = Number(val);
      try { localStorage.setItem("monthlyBudgetMap", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const currencyMap = {
    PHP: "₱",
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    INR: "₹",
    CAD: "$",
    AUD: "$",
    CNY: "¥"
  };

  const [currencyCode, setCurrencyCode] = useState(() => {
    try {
      return localStorage.getItem("currencyCode") || "PHP";
    } catch {
      return "PHP";
    }
  });

  const currencySymbol = currencyMap[currencyCode] || "₱";

  useEffect(() => {
    try { localStorage.setItem("currencyCode", currencyCode); } catch {}
  }, [currencyCode]);

  const formatCurrency = (value) => {
    try {
      if (value == null || isNaN(Number(value))) return "";
      return new Intl.NumberFormat(undefined, { style: "currency", currency: currencyCode, minimumFractionDigits: 2 }).format(Number(value));
    } catch (e) {
      return `${currencySymbol}${Number(value).toFixed(2)}`;
    }
  };

  const fetchExpenses = async () => {
    try {
      const data = await api.get("/expenses");
      setExpenses(data);
    } catch (e) {
      console.warn("Failed to fetch expenses", e);
    }
  };

  const fetchIncomes = async () => {
    try {
      const data = await api.get("/incomes");
      setIncomes(data);
    } catch (e) {
      console.warn("Failed to fetch incomes", e);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchIncomes();
  }, []);

  // When the selected month/year changes, clear add-form amounts (so amount isn't copied between months)
  useEffect(() => {
    const pad = (n) => String(n + 1).padStart(2, "0");
    const monthStr = `${selectedYear}-${pad(selectedMonth)}-01`;
    if (!editingExpenseId) {
      setForm(prev => ({ ...prev, amount: "", date: monthStr }));
    }
    if (!editingIncomeId) {
      setIncomeForm(prev => ({ ...prev, amount: "", date: monthStr }));
    }
  }, [selectedYear, selectedMonth]);

  const [perCategoryBudgets, setPerCategoryBudgets] = useState({});
  const [newBudgetCategory, setNewBudgetCategory] = useState("");
  const [newBudgetAmount, setNewBudgetAmount] = useState("");
  const [tempMonthlyBudget, setTempMonthlyBudget] = useState(() => selectedMonthlyBudget);

  // Modal & autosave state for editing category budgets
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [tempBudgets, setTempBudgets] = useState({});
  const originalBudgetsRef = useRef({});
  const autosaveTimerRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  const openBudgetModal = () => {
    originalBudgetsRef.current = { ...perCategoryBudgets };
    setTempBudgets({ ...perCategoryBudgets });
    setTempMonthlyBudget(selectedMonthlyBudget);
    setBudgetModalOpen(true);
  };

  const closeBudgetModal = () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    // revert to original budgets and monthly budget
    setPerCategoryBudgets({ ...originalBudgetsRef.current });
    setTempMonthlyBudget(selectedMonthlyBudget);
    setBudgetModalOpen(false);
    setSaving(false);
  };

  const saveBudgetModal = () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    setSaving(true);
    setPerCategoryBudgets({ ...tempBudgets });
    setMonthlyBudgetForCurrentMonth(tempMonthlyBudget);
    setSaving(false);
    setSavedAt(Date.now());
    setBudgetModalOpen(false);
  };

  useEffect(() => {
    if (!budgetModalOpen) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    setSaving(true);
    autosaveTimerRef.current = setTimeout(() => {
      setPerCategoryBudgets({ ...tempBudgets });
      setMonthlyBudgetForCurrentMonth(tempMonthlyBudget);
      autosaveTimerRef.current = null;
      setSaving(false);
      setSavedAt(Date.now());
    }, 800);
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  },);

  // Add Income/Expense modal state
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editingIncomeId, setEditingIncomeId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingExpenseId) {
      // update existing expense
      try {
        const updated = await api.put(`/expenses/${editingExpenseId}`, {
          amount: form.amount,
          category: form.category,
          description: form.description,
          source: form.source,
          date: form.date,
          notes: form.notes,
          recurring: !!form.recurring,
          recurrence: form.recurrence || undefined,
          paymentMethod: form.paymentMethod || undefined
        });
        setExpenses(prev => prev.map(p => (p.id === editingExpenseId ? updated : p)));
      } catch (e) {
        console.warn("Update expense failed, applying locally", e);
        setExpenses(prev => prev.map(p => (p.id === editingExpenseId ? { ...p, ...form, amount: Number(form.amount) } : p)));
      } finally {
        setEditingExpenseId(null);
        setForm({ amount: "", category: "", description: "", source: "", date: new Date().toISOString().slice(0, 10), notes: "" });
        setExpenseModalOpen(false);
      }
      return;
    }

    // create new expense
    try {
      const newExpense = await api.post("/expenses", {
        amount: form.amount,
        category: form.category,
        description: form.description,
        source: form.source,
        date: form.date,
        notes: form.notes,
        recurring: !!form.recurring,
        recurrence: form.recurrence || undefined,
        paymentMethod: form.paymentMethod || undefined
      });

      setExpenses(prev => [newExpense, ...prev]);

    } catch (e) {
      console.warn("Create expense failed, adding locally", e);
      const temp = {
        id: Date.now(),
        description: form.description,
        source: form.source,
        amount: Number(form.amount),
        category: form.category,
        date: form.date,
        notes: form.notes,
        recurring: !!form.recurring,
        recurrence: form.recurrence || undefined,
        paymentMethod: form.paymentMethod || undefined
      };
      setExpenses(prev => [temp, ...prev]);
    } finally {
      setForm({ amount: "", category: "", description: "", source: "", date: new Date().toISOString().slice(0, 10), notes: "" });
      setExpenseModalOpen(false);
    }
  };

  const deleteExpense = async (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    await api.delete(`/expenses/${id}`);
    fetchExpenses();
  };

  const handleIncomeSubmit = async (e) => {
    e.preventDefault();
    if (editingIncomeId) {
      try {
        const updated = await api.put(`/incomes/${editingIncomeId}`, {
          amount: incomeForm.amount,
          source: incomeForm.source,
          date: incomeForm.date,
          category: incomeForm.category,
          notes: incomeForm.notes,
          recurring: !!incomeForm.recurring,
          recurrence: incomeForm.recurrence || undefined
        });
        setIncomes(prev => prev.map(p => (p.id === editingIncomeId ? updated : p)));
      } catch (e) {
        console.warn("Update income failed, applying locally", e);
        setIncomes(prev => prev.map(p => (p.id === editingIncomeId ? { ...p, ...incomeForm, amount: Number(incomeForm.amount) } : p)));
      } finally {
        setEditingIncomeId(null);
        setIncomeForm({ amount: "", category: "", source: "", date: new Date().toISOString().slice(0, 10), notes: "" });
        setIncomeModalOpen(false);
      }
      return;
    }

    try {
      const newIncome = await api.post("/incomes", {
        amount: incomeForm.amount,
        source: incomeForm.source,
        date: incomeForm.date,
        category: incomeForm.category,
        notes: incomeForm.notes,
        recurring: !!incomeForm.recurring,
        recurrence: incomeForm.recurrence || undefined
      });

      setIncomes(prev => [newIncome, ...prev]);

    } catch (e) {
      console.warn("Create income failed, adding locally", e);
      const temp = {
        id: Date.now(),
        amount: Number(incomeForm.amount),
        source: incomeForm.source,
        date: incomeForm.date,
        category: incomeForm.category,
        notes: incomeForm.notes,
        recurring: !!incomeForm.recurring,
        recurrence: incomeForm.recurrence || undefined
      };
      setIncomes(prev => [temp, ...prev]);
    } finally {
      setIncomeForm({ amount: "", category: "", source: "", date: new Date().toISOString().slice(0, 10), notes: "" });
      setIncomeModalOpen(false);
    }
  };

  const openEditExpense = (expense) => {
    setForm({
      amount: expense.amount || "",
      category: expense.category || "",
      description: expense.description || "",
      source: expense.source || "",
      date: expense.date ? expense.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      notes: expense.notes || "",
      recurring: !!expense.recurring,
      recurrence: expense.recurrence || "monthly",
      paymentMethod: expense.paymentMethod || ""
    });
    setEditingExpenseId(expense.id);
    setExpenseModalOpen(true);
  };

  const cancelExpenseEdit = () => {
    setEditingExpenseId(null);
    setForm({ amount: "", category: "", description: "", source: "", date: new Date().toISOString().slice(0, 10), notes: "", recurring: false, recurrence: "monthly", paymentMethod: "" });
    setExpenseModalOpen(false);
  };

  const openEditIncome = (income) => {
    setIncomeForm({
      amount: income.amount || "",
      category: income.category || "",
      source: income.source || "",
      date: income.date ? income.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      notes: income.notes || "",
      recurring: !!income.recurring,
      recurrence: income.recurrence || "monthly"
    });
    setEditingIncomeId(income.id);
    setIncomeModalOpen(true);
  };

  const cancelIncomeEdit = () => {
    setEditingIncomeId(null);
    setIncomeForm({ amount: "", category: "", source: "", date: new Date().toISOString().slice(0, 10), notes: "", recurring: false, recurrence: "monthly" });
    setIncomeModalOpen(false);
  };

  const deleteIncome = async (id) => {
    setIncomes(prev => prev.filter(i => i.id !== id));
    await api.delete(`/incomes/${id}`);
    fetchIncomes();
  };

  const editCategoryBudget = (category) => {
    const current = perCategoryBudgets[category];
    const raw = window.prompt(`Set budget for ${category} (leave empty to clear):`, current == null ? "" : String(current));
    if (raw === null) return; // cancelled
    if (raw === "") {
      const next = { ...perCategoryBudgets };
      delete next[category];
      setPerCategoryBudgets(next);
      return;
    }
    const num = Number(raw);
    if (isNaN(num) || num < 0) {
      window.alert("Please enter a valid non-negative number for budget.");
      return;
    }
    setPerCategoryBudgets(prev => ({ ...prev, [category]: num }));
  };

  const parseDate = (d) => (d ? new Date(d) : null);

  const isSameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const isWithinWeek = (date) => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0,0,0,0);
    const d = new Date(date);
    return d >= start && d <= now;
  };

  const isWithinMonth = (date) => {
    if (!date) return false;
    return date.getFullYear() === selectedYear && date.getMonth() === selectedMonth;
  };

  const matchesFilter = (expense) => {
    if (!expense || !expense.date) return dateFilter === "all";
    const d = parseDate(expense.date);
    if (!d || isNaN(d)) return false;
    if (dateFilter === "all") return true;
    if (dateFilter === "today") return isSameDay(d, new Date());
    if (dateFilter === "week") return isWithinWeek(d);
    if (dateFilter === "month") return isWithinMonth(d);
    return true;
  };

  const filteredExpenses = expenses.filter(matchesFilter);
  const filteredIncomes = incomes.filter(matchesFilter);

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const totalIncomes = filteredIncomes.reduce((sum, income) => sum + Number(income.amount || 0), 0);

  const totalSavings = totalIncomes - totalExpenses;
  const savingsRate = totalIncomes > 0 ? (totalSavings / totalIncomes) * 100 : null;
  const savingsRateColor =
    savingsRate === null
      ? "inherit"
      : savingsRate < 0
      ? "#FF6B6B"
      : savingsRate < 15
      ? "#FFD166"
      : "#2ED573";

  // Compute total savings from saving goals stored in localStorage (deposits - withdrawals)
  let computedTotalSavingsFromGoals = 0;
  try {
    const rawGoals = localStorage.getItem("savingGoals");
    const sg = rawGoals ? JSON.parse(rawGoals) : [];
    const deposits = (sg || []).reduce((acc, g) => acc + ((g.history || []).reduce((a, h) => a + (h.amount > 0 ? h.amount : 0), 0)), 0);
    const withdrawals = (sg || []).reduce((acc, g) => acc + ((g.history || []).reduce((a, h) => a + (h.amount < 0 ? Math.abs(h.amount) : 0), 0)), 0);
    computedTotalSavingsFromGoals = deposits - withdrawals;
  } catch (e) {
    computedTotalSavingsFromGoals = 0;
  }

  const percentBudgetUsed = selectedMonthlyBudget && selectedMonthlyBudget > 0 ? (totalExpenses / selectedMonthlyBudget) * 100 : null;
  const budgetColor =
    percentBudgetUsed === null
      ? "inherit"
      : percentBudgetUsed >= 100
      ? "#FF6B6B"
      : percentBudgetUsed >= 80
      ? "#FFD166"
      : "#2ED573";
  const budgetRemaining = selectedMonthlyBudget !== null ? selectedMonthlyBudget - totalExpenses : null;

  const categorySummary = Object.values(
    filteredExpenses.reduce((acc, expense) => {
      const cat = expense.category || "Uncategorized";
      const amt = Number(expense.amount) || 0;
      if (!acc[cat]) acc[cat] = { category: cat, amount: 0 };
      acc[cat].amount += amt;
      return acc;
    }, {})
  ).sort((a, b) => b.amount - a.amount);

  const overBudgetCategories = categorySummary.filter(c => {
    const b = perCategoryBudgets[c.category];
    return b != null && c.amount >= b;
  });

  const pieData = categorySummary.map((c) => ({ name: c.category, value: Number(c.amount) }));
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28EFF", "#FF6B6B", "#2ED573", "#FFA3A3"];

  const monthlyExpenseMap = expenses.reduce((acc, expense) => {
    const d = expense.date ? new Date(expense.date) : null;
    if (!d || isNaN(d)) return acc;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    acc[key] = (acc[key] || 0) + Number(expense.amount || 0);
    return acc;
  }, {});
  const monthlyIncomeMap = incomes.reduce((acc, income) => {
    const d = income.date ? new Date(income.date) : null;
    if (!d || isNaN(d)) return acc;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    acc[key] = (acc[key] || 0) + Number(income.amount || 0);
    return acc;
  }, {});

  const allMonthKeys = Array.from(new Set([...Object.keys(monthlyExpenseMap), ...Object.keys(monthlyIncomeMap)])).sort();

  const combinedLineData = allMonthKeys.map((k) => {
    const [y, m] = k.split("-");
    const date = new Date(Number(y), Number(m) - 1, 1);
    const label = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(date);
    return {
      month: label,
      monthKey: k,
      expenses: Number(monthlyExpenseMap[k] || 0),
      incomes: Number(monthlyIncomeMap[k] || 0)
    };
  });

  const monthlyIncomeTotal = incomes.reduce((sum, income) => {
    const d = income.date ? new Date(income.date) : null;
    return sum + (d && isWithinMonth(d) ? Number(income.amount || 0) : 0);
  }, 0);

  const monthlyExpenseTotal = expenses.reduce((sum, expense) => {
    const d = expense.date ? new Date(expense.date) : null;
    return sum + (d && isWithinMonth(d) ? Number(expense.amount || 0) : 0);
  }, 0);

  const availableBalance = monthlyIncomeTotal - monthlyExpenseTotal;
  const totalNetWorth = totalIncomes - totalExpenses;

  const [page, setPage] = useState("dashboard");
  const [savingsBalanceAdjustment, setSavingsBalanceAdjustment] = useState(0);

  const renderPage = () => {
    if (page === "dashboard") {
      return (
        <Dashboard
          availableBalance={availableBalance + (savingsBalanceAdjustment || 0)}
          totalSavings={totalSavings}
          computedTotalSavings={computedTotalSavingsFromGoals}
          monthlyIncomeTotal={monthlyIncomeTotal}
          monthlyExpenseTotal={monthlyExpenseTotal}
          totalNetWorth={totalNetWorth}
          totalIncomes={totalIncomes}
          totalExpenses={totalExpenses}
          savingsRateColor={savingsRateColor}
          savingsRate={savingsRate}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          monthlyBudget={selectedMonthlyBudget}
          setMonthlyBudget={setMonthlyBudgetForCurrentMonth}
          combinedLineData={combinedLineData}
          pieData={pieData}
          overBudgetCategories={overBudgetCategories}
          percentBudgetUsed={percentBudgetUsed}
          budgetColor={budgetColor}
          budgetRemaining={budgetRemaining}
          COLORS={COLORS}
          currencySymbol={currencySymbol}
          formatCurrency={formatCurrency}
        />
      );
    }
    if (page === "transactions") return <Transactions incomes={incomes} expenses={expenses} deleteIncome={deleteIncome} deleteExpense={deleteExpense} openEditIncome={openEditIncome} openEditExpense={openEditExpense} currencySymbol={currencySymbol} formatCurrency={formatCurrency} />;
    if (page === "income") return (
      <Income
        incomes={incomes}
        incomeForm={incomeForm}
        setIncomeForm={setIncomeForm}
        handleIncomeSubmit={handleIncomeSubmit}
        incomeModalOpen={incomeModalOpen}
        setIncomeModalOpen={setIncomeModalOpen}
        deleteIncome={deleteIncome}
        openEditIncome={openEditIncome}
        editingIncomeId={editingIncomeId}
        cancelIncomeEdit={cancelIncomeEdit}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        currencySymbol={currencySymbol}
        formatCurrency={formatCurrency}
      />
    );
    if (page === "expenses") return (
      <Expenses
        expenses={expenses}
        form={form}
        setForm={setForm}
        handleSubmit={handleSubmit}
        expenseModalOpen={expenseModalOpen}
        setExpenseModalOpen={setExpenseModalOpen}
        openBudgetModal={openBudgetModal}
        deleteExpense={deleteExpense}
        openEditExpense={openEditExpense}
        editingExpenseId={editingExpenseId}
        cancelExpenseEdit={cancelExpenseEdit}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        currencySymbol={currencySymbol}
        formatCurrency={formatCurrency}
      />
    );
    if (page === "savings") return <Savings availableBalance={availableBalance + (savingsBalanceAdjustment || 0)} adjustAvailableBalance={(delta) => setSavingsBalanceAdjustment(prev => (prev || 0) + delta)} totalIncomes={totalIncomes} totalExpenses={totalExpenses} totalSavings={totalSavings} savingsRate={savingsRate} savingsRateColor={savingsRateColor} currencySymbol={currencySymbol} formatCurrency={formatCurrency} />;
    if (page === "reports") return <Reports combinedLineData={combinedLineData} pieData={pieData} currencySymbol={currencySymbol} formatCurrency={formatCurrency} />;
    if (page === "profile") return <Profile totalDeposits={totalIncomes} totalWithdrawals={totalExpenses} totalSavings={totalSavings} savingsRate={savingsRate} savingsRateColor={savingsRateColor} currencySymbol={currencySymbol} formatCurrency={formatCurrency} />;
    if (page === "settings") return <Settings currencyCode={currencyCode} setCurrencyCode={setCurrencyCode} currencySymbol={currencySymbol} formatCurrency={formatCurrency} />;

    return null;
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <nav style={{ width: 220, borderRight: "1px solid #eee", padding: "1rem", background: "#fafafa" }}>
        <h2 style={{ marginTop: 0 }}>Expense Analyzer</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {[
            ["dashboard", "🏠 Dashboard"],
            ["transactions", "🧾 Transactions"],
            ["income", "💰 Income"],
            ["expenses", "💸 Expenses"],
            ["savings", "🏦 Savings"],
            ["reports", "📈 Reports"],
            ["profile", "👤 Profile"],
            ["settings", "⚙️ Settings"]
          ].map(([key, label]) => (
            <li key={key} style={{ marginBottom: 8 }}>
              <button onClick={() => setPage(key)} style={{ width: "100%", textAlign: "left", padding: "8px 10px", background: page === key ? "#e6f7ff" : "transparent", border: "none", borderRadius: 4 }}>{label}</button>
            </li>
          ))}
        </ul>
      </nav>
      <main style={{ flex: 1, padding: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="btn" onClick={() => { const prev = new Date(selectedYear, selectedMonth, 1); prev.setMonth(prev.getMonth() - 1); setSelectedYear(prev.getFullYear()); setSelectedMonth(prev.getMonth()); setDateFilter("month"); }}>◀</button>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {monthNames.map((m, idx) => (
                <button
                  key={m}
                  onClick={() => { setSelectedMonth(idx); setDateFilter("month"); }}
                  className="btn"
                  style={{ background: idx === selectedMonth ? "#e6f7ff" : "transparent", border: "none", padding: "6px 8px", borderRadius: 6 }}
                >
                  {m}
                </button>
              ))}
            </div>
            <button className="btn" onClick={() => { const nxt = new Date(selectedYear, selectedMonth, 1); nxt.setMonth(nxt.getMonth() + 1); setSelectedYear(nxt.getFullYear()); setSelectedMonth(nxt.getMonth()); setDateFilter("month"); }}>▶</button>
          </div>
          <div style={{ fontSize: 14, color: "#333", marginLeft: 6 }}>{selectedYear}</div>
        </div>

        {renderPage()}
      </main>
      {budgetModalOpen && (
        <div className="modal-overlay" onClick={() => closeBudgetModal()}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div className="modal-title">Edit Budgets</div>
                <div className="modal-sub">Set monthly budget and per-category budgets</div>
              </div>
              <button className="btn btn-ghost" onClick={() => closeBudgetModal()}>✕</button>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "#666" }}>Monthly Budget</label>
                <input type="number" className="modern-input" value={tempMonthlyBudget === null ? "" : tempMonthlyBudget} onChange={e => setTempMonthlyBudget(e.target.value === "" ? null : Number(e.target.value))} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 6 }}>Per-category budgets</label>
                <div style={{ display: "grid", gap: 8 }}>
                  {Object.keys(tempBudgets || {}).length === 0 ? (
                    <div style={{ color: "#666" }}>No categories available to set budgets for.</div>
                  ) : (
                    Object.keys(tempBudgets).map(cat => (
                      <div key={cat} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <div style={{ minWidth: 160 }}>{cat}</div>
                        <input type="number" className="modern-input" value={tempBudgets[cat] == null ? "" : tempBudgets[cat]} onChange={e => setTempBudgets(prev => ({ ...prev, [cat]: e.target.value === "" ? null : Number(e.target.value) }))} />
                        <button className="btn" onClick={() => setTempBudgets(prev => { const next = { ...prev }; delete next[cat]; return next; })}>Clear</button>
                      </div>
                    ))
                  )}

                  <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                    <input placeholder="Category name" className="modern-input" value={newBudgetCategory} onChange={e => setNewBudgetCategory(e.target.value)} />
                    <input placeholder="Amount" className="modern-input" type="number" value={newBudgetAmount} onChange={e => setNewBudgetAmount(e.target.value)} />
                    <button className="btn" onClick={() => {
                      if (!newBudgetCategory) return;
                      setTempBudgets(prev => ({ ...prev, [newBudgetCategory]: newBudgetAmount === "" ? null : Number(newBudgetAmount) }));
                      setNewBudgetCategory(""); setNewBudgetAmount("");
                    }}>Add</button>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button className="btn" onClick={() => closeBudgetModal()}>Cancel</button>
                <button className="btn btn-primary" onClick={() => saveBudgetModal()}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

import React, { useEffect, useState } from "react";
import toast, { Toaster } from 'react-hot-toast';
import { api, getCurrentUserId, clearCurrentUser, setCurrentUser } from "./services/api";
import "./App.css";

import Dashboard from "./pages/Dashboard/Dashboard";
import Transactions from "./pages/Transactions/Transactions";
import Income from "./pages/Income/Income";
import Expenses from "./pages/Expenses/Expenses";
import Savings from "./pages/Savings/Savings";
import Reports from "./pages/Reports/Reports";
import Profile from "./pages/Profile/Profile";
import Settings from "./pages/Settings/Settings";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

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

  // derive a user key from currentUser.id (fall back to guest) so budgets are per-user
  const getUserKey = () => {
    try {
      const id = getCurrentUserId();
      return id != null ? `user:${id}` : "guest";
    } catch {
      return "guest";
    }
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
      const pad = (n) => String(n + 1).padStart(2, "0");
      const monthKey = `${selectedYear}-${pad(selectedMonth)}`;
      const data = await api.get("/expenses", { params: { month: monthKey } });
      setExpenses(data);
    } catch (e) {
      console.warn("Failed to fetch expenses", e);
    }
  };

  const fetchIncomes = async () => {
    try {
      const pad = (n) => String(n + 1).padStart(2, "0");
      const monthKey = `${selectedYear}-${pad(selectedMonth)}`;
      const data = await api.get("/incomes", { params: { month: monthKey } });
      setIncomes(data);
    } catch (e) {
      console.warn("Failed to fetch incomes", e);
    }
  };

  const persistMonthlyBudget = async (val) => {
    try {
      const uid = getCurrentUserId();
      if (!uid) return null;
      if (val == null) {
        const resp = await api.delete('/user/budget');
        return resp;
      } else {
        const resp = await api.put('/user/budget', { monthlyBudget: val });
        return resp;
      }
    } catch (err) {
      console.warn('Failed to persist monthlyBudget', err);
      throw err;
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const u = await api.get('/user/me');
      setServerUser(u);
      try { setCurrentUser(u); } catch (e) { }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchIncomes();
    if (localStorage.getItem('token')) {
      fetchCurrentUser();
      fetchBudgets();
    }
  }, []);

  // Re-fetch transactions when selected month/year changes
  useEffect(() => {
    fetchExpenses();
    fetchIncomes();
    if (localStorage.getItem('token')) fetchBudgets();
  }, [selectedYear, selectedMonth]);

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

  const [perCategoryBudgets, setPerCategoryBudgets] = useState(() => {
    try {
      const raw = localStorage.getItem("perCategoryBudgetsMap");
      const map = raw ? JSON.parse(raw) : {};
      return map[userKey] || {};
    } catch {
      return {};
    }
  });
  const [budgetsMeta, setBudgetsMeta] = useState({});

  // fetch per-category budgets from server when logged in
  const fetchBudgets = async () => {
    try {
      const uid = getCurrentUserId();
      if (!uid) return;
      const monthKey = `${selectedYear}-${String((selectedMonth || 0) + 1).padStart(2, '0')}`;
      const list = await api.get('/budgets', { params: { month: monthKey } });
      const map = {};
      const meta = {};
      if (Array.isArray(list)) {
        list.forEach(b => { map[b.category] = Number(b.budgetLimit || 0); meta[b.category] = { id: b.id, budgetSpent: Number(b.budgetSpent || 0), budgetRemaining: Number(b.budgetRemaining || 0), month: b.month }; });
      }
      setPerCategoryBudgets(map);
      setBudgetsMeta(meta);
    } catch (e) {
      console.warn('Failed to fetch budgets', e);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('token')) fetchBudgets();
  }, [selectedYear, selectedMonth]);

  // budgets are persisted either locally or fetched from server; server sync handled by BudgetOverview component

  // persist per-category budgets per user
  useEffect(() => {
    try {
      const raw = localStorage.getItem("perCategoryBudgetsMap");
      const map = raw ? JSON.parse(raw) : {};
      map[userKey] = perCategoryBudgets || {};
      localStorage.setItem("perCategoryBudgetsMap", JSON.stringify(map));
    } catch {}
  }, [perCategoryBudgets, userKey]);

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
        const t = toast.loading('Updating expense...');
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
        try { fetchCurrentUser(); } catch (e) {}
        toast.success('Expense updated successfully', { id: t });
      } catch (e) {
        toast.error('Failed to update expense');
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
      const payload = {
        amount: form.amount,
        category: form.category,
        description: form.description,
        source: form.source,
        date: form.date,
        notes: form.notes,
        recurring: !!form.recurring,
        recurrence: form.recurrence || undefined,
        paymentMethod: form.paymentMethod || undefined,
        userId: getCurrentUserId()
      };

      const newExpense = await api.post("/expenses", payload);

      setExpenses(prev => [newExpense, ...prev]);
      try { fetchCurrentUser(); } catch (e) {}

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
        paymentMethod: form.paymentMethod || undefined,
        userId: getCurrentUserId()
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
    await fetchExpenses();
    try { fetchCurrentUser(); } catch (e) {}
  };

  const handleIncomeSubmit = async (e) => {
    e.preventDefault();
    if (editingIncomeId) {
      try {
        const t = toast.loading('Updating income...');
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
        try { fetchCurrentUser(); } catch (e) {}
        toast.success('Income updated successfully', { id: t });
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
      const payload = {
        amount: incomeForm.amount,
        source: incomeForm.source,
        date: incomeForm.date,
        category: incomeForm.category,
        notes: incomeForm.notes,
        recurring: !!incomeForm.recurring,
        recurrence: incomeForm.recurrence || undefined,
        userId: getCurrentUserId()
      };

      const t = toast.loading('Adding income...');
      const newIncome = await api.post("/incomes", payload);

      setIncomes(prev => [newIncome, ...prev]);
      try { fetchCurrentUser(); } catch (e) {}
      toast.success('Income added successfully', { id: t });

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
        recurrence: incomeForm.recurrence || undefined,
        userId: getCurrentUserId()
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
    const t = toast.loading('Deleting income...');
    try {
      await api.delete(`/incomes/${id}`);
      await fetchIncomes();
      try { fetchCurrentUser(); } catch (e) {}
      toast.success('Income deleted successfully', { id: t });
    } catch (err) {
      toast.error('Failed to delete income', { id: t });
      console.warn('Failed to delete income', err);
    }
  };

  const editCategoryBudget = (category) => {
    const current = perCategoryBudgets[category];
    const raw = window.prompt(`Set budget for ${category} (leave empty to clear):`, current == null ? "" : String(current));
    if (raw === null) return; // cancelled
    if (raw === "") {
      const uid = getCurrentUserId();
      const next = { ...perCategoryBudgets };
      delete next[category];
      setPerCategoryBudgets(next);
      // if logged in, delete on server as well
      if (uid) {
        const id = budgetsMeta[category];
          if (id) {
            const t = toast.loading('Deleting budget...');
            api.delete(`/budgets/${id}`).then(() => { fetchBudgets(); toast.success('Budget deleted successfully', { id: t }); }).catch(() => { toast.error('Failed to delete budget', { id: t }); });
          }
      }
      return;
    }
    const num = Number(raw);
    if (isNaN(num) || num < 0) {
      window.alert("Please enter a valid non-negative number for budget.");
      return;
    }
    setPerCategoryBudgets(prev => ({ ...prev, [category]: num }));
    const uid = getCurrentUserId();
    if (uid) {
      const id = budgetsMeta[category];
      const month = `${selectedYear}-${String((selectedMonth || 0) + 1).padStart(2, '0')}`;
      if (id) {
        const t = toast.loading('Updating budget...');
        api.put(`/budgets/${id}`, { category, budgetLimit: num })
          .then(() => { fetchBudgets(); toast.success('Budget updated successfully', { id: t }); })
          .catch(() => { toast.error('Failed to update budget', { id: t }); });
      } else {
        const t = toast.loading('Adding budget...');
        api.post('/budgets', { category, budgetLimit: num, month })
          .then(() => { fetchBudgets(); toast.success('Budget added successfully', { id: t }); })
          .catch(() => { toast.error('Failed to add budget', { id: t }); });
      }
    }
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
    const uid = getCurrentUserId();
    const userGoals = (sg || []).filter(g => g && g.userId != null && Number(g.userId) === Number(uid));
    const deposits = (userGoals || []).reduce((acc, g) => acc + ((g.history || []).reduce((a, h) => a + (h.amount > 0 ? h.amount : 0), 0)), 0);
    const withdrawals = (userGoals || []).reduce((acc, g) => acc + ((g.history || []).reduce((a, h) => a + (h.amount < 0 ? Math.abs(h.amount) : 0), 0)), 0);
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
  // Ensure budget calculations use the selected month
  const monthFilteredExpenses = filteredExpenses.filter(exp => {
    const d = exp.date ? new Date(exp.date) : null;
    return d && d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
  });

  const categorySummary = Object.values(
    monthFilteredExpenses.reduce((acc, expense) => {
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

  const computedAvailableBalance = monthlyIncomeTotal - monthlyExpenseTotal;
  const availableBalance = (serverUser && serverUser.availableBalance != null) ? Number(serverUser.availableBalance) : (computedAvailableBalance + (savingsBalanceAdjustment || 0));
  const totalNetWorth = totalIncomes - totalExpenses;

  const [page, setPage] = useState("dashboard");
  const [savingsBalanceAdjustment, setSavingsBalanceAdjustment] = useState(0);
  const [serverUser, setServerUser] = useState(null);
  const [authToken, setAuthToken] = useState(() => {
    try { return localStorage.getItem("token"); } catch { return null; }
  });

  const onAuthSuccess = (token) => {
    setAuthToken(token);
    fetchExpenses();
    fetchIncomes();
    fetchCurrentUser();
    setPage("dashboard");
  };

  const logout = () => {
    try { localStorage.removeItem("token"); } catch {}
    try { clearCurrentUser(); } catch {}
    setAuthToken(null);
    setPage("dashboard");
  };

  const renderPage = () => {
    if (page === "dashboard") {
      return (
        <Dashboard
          availableBalance={availableBalance}
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
          monthlyBudget={(serverUser && serverUser.monthlyBudget != null) ? Number(serverUser.monthlyBudget) : selectedMonthlyBudget}
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
          budgets={perCategoryBudgets}
          onBudgetsUpdated={fetchBudgets}
          budgetsMeta={budgetsMeta}
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
    if (page === "savings") return <Savings availableBalance={availableBalance} adjustAvailableBalance={(delta) => setSavingsBalanceAdjustment(prev => (prev || 0) + delta)} totalIncomes={totalIncomes} totalExpenses={totalExpenses} totalSavings={totalSavings} savingsRate={savingsRate} savingsRateColor={savingsRateColor} currencySymbol={currencySymbol} formatCurrency={formatCurrency} />;
    if (page === "reports") return <Reports combinedLineData={combinedLineData} pieData={pieData} currencySymbol={currencySymbol} formatCurrency={formatCurrency} />;
    if (page === "profile") return <Profile totalDeposits={totalIncomes} totalWithdrawals={totalExpenses} totalSavings={totalSavings} savingsRate={savingsRate} savingsRateColor={savingsRateColor} currencySymbol={currencySymbol} formatCurrency={formatCurrency} />;
    if (page === "settings") return <Settings currencyCode={currencyCode} setCurrencyCode={setCurrencyCode} currencySymbol={currencySymbol} formatCurrency={formatCurrency} />;

    if (page === "login") return <Login onAuthSuccess={onAuthSuccess} />;
    if (page === "register") return <Register onAuthSuccess={onAuthSuccess} />;

    return null;
  };

  return (
    <div className="app-root">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <nav className="sidebar">
        <h2 className="sidebar-title">Expense Analyzer</h2>
        <ul className="nav-list">
          {(() => {
            const base = [
              ["dashboard", "🏠 Dashboard"],
              ["transactions", "🧾 Transactions"],
              ["income", "💰 Income"],
              ["expenses", "💸 Expenses"],
              ["savings", "🏦 Savings"],
              ["reports", "📈 Reports"],
              ["profile", "👤 Profile"],
              ["settings", "⚙️ Settings"]
            ];
            if (!authToken) {
              base.push(["login", "🔐 Login"]);
              base.push(["register", "✍️ Register"]);
            } else {
              base.push(["logout", "🚪 Logout"]);
            }
            return base.map(([key, label]) => (
              <li key={key} className="nav-item">
                <button
                  onClick={() => {
                    if (key === "logout") return logout();
                    setPage(key);
                  }}
                  className={`btn nav-button ${page === key ? 'active' : ''}`}
                >{label}</button>
              </li>
            ));
          })()}
        </ul>
      </nav>
      <main className="main-content">
        <div className="top-controls">
          <div className="month-controls">
            <button className="btn" onClick={() => { const prev = new Date(selectedYear, selectedMonth, 1); prev.setMonth(prev.getMonth() - 1); setSelectedYear(prev.getFullYear()); setSelectedMonth(prev.getMonth()); setDateFilter("month"); }}>◀</button>
            <div className="month-buttons">
              {monthNames.map((m, idx) => (
                <button
                  key={m}
                  onClick={() => { setSelectedMonth(idx); setDateFilter("month"); }}
                  className={`btn month-btn ${idx === selectedMonth ? 'active' : ''}`}
                >
                  {m}
                </button>
              ))}
            </div>
            <button className="btn" onClick={() => { const nxt = new Date(selectedYear, selectedMonth, 1); nxt.setMonth(nxt.getMonth() + 1); setSelectedYear(nxt.getFullYear()); setSelectedMonth(nxt.getMonth()); setDateFilter("month"); }}>▶</button>
          </div>
          <div className="year-display">{selectedYear}</div>
        </div>

        {renderPage()}
      </main>
      
    </div>
  );
}

export default App;

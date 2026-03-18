import React, { useEffect, useState, useRef } from "react";
import { api } from "./api";
import "./App.css";

import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Income from "./pages/Income";
import Expenses from "./pages/Expenses";
import Savings from "./pages/Savings";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

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
  const [monthlyBudget, setMonthlyBudget] = useState(() => {
    try {
      const raw = localStorage.getItem("monthlyBudget");
      return raw ? Number(raw) : null;
    } catch {
      return null;
    }
  });

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

  const [perCategoryBudgets, setPerCategoryBudgets] = useState([]);

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
    setBudgetModalOpen(true);
  };

  const closeBudgetModal = () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    // revert to original budgets
    setPerCategoryBudgets({ ...originalBudgetsRef.current });
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
  }, [tempBudgets, budgetModalOpen]);

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
    const now = new Date();
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
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

  const percentBudgetUsed = monthlyBudget && monthlyBudget > 0 ? (totalExpenses / monthlyBudget) * 100 : null;
  const budgetColor =
    percentBudgetUsed === null
      ? "inherit"
      : percentBudgetUsed >= 100
      ? "#FF6B6B"
      : percentBudgetUsed >= 80
      ? "#FFD166"
      : "#2ED573";
  const budgetRemaining = monthlyBudget !== null ? monthlyBudget - totalExpenses : null;

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

  const renderPage = () => {
    if (page === "dashboard") {
      return (
        <Dashboard
          availableBalance={availableBalance}
          totalSavings={totalSavings}
          monthlyIncomeTotal={monthlyIncomeTotal}
          monthlyExpenseTotal={monthlyExpenseTotal}
          totalNetWorth={totalNetWorth}
          totalIncomes={totalIncomes}
          totalExpenses={totalExpenses}
          savingsRateColor={savingsRateColor}
          savingsRate={savingsRate}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          monthlyBudget={monthlyBudget}
          setMonthlyBudget={setMonthlyBudget}
          combinedLineData={combinedLineData}
          pieData={pieData}
          overBudgetCategories={overBudgetCategories}
          percentBudgetUsed={percentBudgetUsed}
          budgetColor={budgetColor}
          budgetRemaining={budgetRemaining}
          COLORS={COLORS}
        />
      );
    }

    if (page === "transactions") return <Transactions incomes={incomes} expenses={expenses} deleteIncome={deleteIncome} deleteExpense={deleteExpense} openEditIncome={openEditIncome} openEditExpense={openEditExpense} />;
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
      />
    );
    if (page === "savings") return <Savings totalIncomes={totalIncomes} totalExpenses={totalExpenses} totalSavings={totalSavings} savingsRate={savingsRate} savingsRateColor={savingsRateColor} />;
    if (page === "reports") return <Reports combinedLineData={combinedLineData} pieData={pieData} />;
    if (page === "profile") return <Profile />;
    if (page === "settings") return <Settings />;

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
      <main style={{ flex: 1, padding: "2rem" }}>{renderPage()}</main>
    </div>
  );
}

export default App;

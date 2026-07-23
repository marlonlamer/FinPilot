import React, { useEffect, useState } from "react";
import toast, { Toaster } from 'react-hot-toast';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AppLayout from "../layouts/AppLayout";
import AuthLayout from "../layouts/AuthLayout";

import Dashboard from "../pages/Dashboard/Dashboard";
import Expenses from "../pages/Expenses/Expenses";
import Income from "../pages/Income/Income";
import Transactions from "../pages/Transactions/Transactions";
import Budget from "../pages/Budget/Budget";
import DebtBills from "../pages/DebtBills/DebtBills";
import Analytics from "../pages/Analytics/Analytics";
import Profile from "../pages/Profile/Profile";
import Settings from "../pages/Settings/Settings";
import SavingsGoals from "../pages/SavingsGoals/SavingsGoals";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ProtectedRoute from "./ProtectedRoutes";
import { api, getCurrentUserId, clearCurrentUser } from "../services/api";
import { formatCurrency as formatCurrencyValue, getCurrencySymbol } from "../utils/formatCurrency";
import { formatYearMonth } from "../utils/dateUtils";

function AppController() {
	// Most of the application state and handlers were copied from App.jsx
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

	const [dashboardTotals, setDashboardTotals] = useState({ totalSavings: 0, availableBalance: 0 });
	const [savingsHistory, setSavingsHistory] = useState([]);

	const fetchSavingsHistory = async () => {
		try {
			const uid = getCurrentUserId();
			if (!uid) return setSavingsHistory([]);
			const pad = (n) => String(n + 1).padStart(2, "0");
			const monthKey = `${selectedYear}-${pad(selectedMonth)}`;
			const list = await api.get(`/savings/history/${uid}`, { params: { month: monthKey } });
			setSavingsHistory(Array.isArray(list) ? list : []);
		} catch (e) {
			console.warn('Failed to fetch savings history', e);
			setSavingsHistory([]);
		}
	};

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

	const getUserKey = () => {
		try {
			const id = getCurrentUserId();
			return id != null ? `user:${id}` : "guest";
		} catch { return "guest"; }
	};
	const userKey = getUserKey();

	const [monthlyBudgetMap, setMonthlyBudgetMap] = useState(() => {
		try {
			const raw = localStorage.getItem("monthlyBudgetMap");
			return raw ? JSON.parse(raw) : {};
		} catch {
			return {};
		}
	});

	const currentMonthKey = `${userKey}:${formatYearMonth(selectedYear, selectedMonth || 0)}`;
	const selectedMonthlyBudget = monthlyBudgetMap[currentMonthKey] != null ? Number(monthlyBudgetMap[currentMonthKey]) : null;

	const setMonthlyBudgetForCurrentMonth = (val) => {
		setMonthlyBudgetMap(prev => {
			const next = { ...prev };
			if (val == null) delete next[currentMonthKey]; else next[currentMonthKey] = Number(val);
			try { localStorage.setItem("monthlyBudgetMap", JSON.stringify(next)); } catch {}
			return next;
		});
	};

	const [currencyCode, setCurrencyCode] = useState(() => {
		try { return localStorage.getItem("currencyCode") || "PHP"; } catch { return "PHP"; }
	});

	const currencySymbol = getCurrencySymbol(currencyCode);

	useEffect(() => {
		try { localStorage.setItem("currencyCode", currencyCode); } catch {}
	}, [currencyCode]);

	const formatCurrency = (value) => formatCurrencyValue(value, { currencyCode, currencySymbol });

	const fetchExpenses = async () => {
		try {
			const monthKey = formatYearMonth(selectedYear, selectedMonth);
			const data = await api.get("/expenses", { params: { month: monthKey } });
			setExpenses(data);
		} catch (e) {
			console.warn("Failed to fetch expenses", e);
		}
	};

	const fetchIncomes = async () => {
		try {
			const monthKey = formatYearMonth(selectedYear, selectedMonth);
			const data = await api.get("/incomes", { params: { month: monthKey } });
			setIncomes(data);
		} catch (e) {
			console.warn("Failed to fetch incomes", e);
		}
	};

	// Persist or remove monthly budget on server. If `val` is null, delete on server.
	const persistMonthlyBudget = async (val) => {
		try {
			const uid = getCurrentUserId();
			if (!uid) return null;
			if (val == null) {
				// delete monthly budget on server
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

	useEffect(() => {
		fetchExpenses();
		fetchIncomes();
		fetchSavingsHistory();
		if (localStorage.getItem('token')) fetchBudgets();
		// fetch dashboard totals (savings, available balance)
		(async () => {
			try {
				const d = await api.get('/dashboard');
				setDashboardTotals(d.totals || {});
			} catch (e) { console.warn('Failed to fetch dashboard', e); }
		})();
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

	const [budgetSummary, setBudgetSummary] = useState({ totalMonthlyBudget: 0, totalBudgetSpent: 0, totalBudgetRemaining: 0 });

	const fetchBudgetSummary = async () => {
		try {
			const uid = getCurrentUserId();
			if (!uid) return;
			const monthKey = `${selectedYear}-${String((selectedMonth || 0) + 1).padStart(2, '0')}`;
			const resp = await api.get('/budgets/summary', { params: { month: monthKey } });
			if (resp) setBudgetSummary({ totalMonthlyBudget: Number(resp.totalMonthlyBudget || 0), totalBudgetSpent: Number(resp.totalBudgetSpent || 0), totalBudgetRemaining: Number(resp.totalBudgetRemaining || 0) });
		} catch (e) {
			console.warn('Failed to fetch budget summary', e);
		}
	};

	// ===== Budget Feature =====
	const [budgetsMeta, setBudgetsMeta] = useState({});

	const fetchBudgets = async () => {
		try {
			const uid = getCurrentUserId();
			if (!uid) return;
			const monthKey = `${selectedYear}-${String((selectedMonth || 0) + 1).padStart(2, '0')}`;
			const list = await api.get('/budgets', { params: { month: monthKey } });
            const { budgets, meta } = budgetService.mapBudgets(list);

			setPerCategoryBudgets(budgets);
			setBudgetsMeta(meta);
		} catch (e) {
			console.warn('Failed to fetch budgets', e);
		}
	};

	useEffect(() => {
		if (localStorage.getItem('token')) {
			fetchBudgets();
			fetchBudgetSummary();
		}
	}, [selectedYear, selectedMonth]);

	useEffect(() => {
		// refresh summary whenever budgets or expenses change
		if (localStorage.getItem('token')) fetchBudgetSummary();
	}, [perCategoryBudgets, expenses]);

	// persist per-category budgets per user
	useEffect(() => {
		try {
			const raw = localStorage.getItem("perCategoryBudgetsMap");
			const map = raw ? JSON.parse(raw) : {};
			map[userKey] = perCategoryBudgets || {};
			localStorage.setItem("perCategoryBudgetsMap", JSON.stringify(map));
		} catch {}
	}, [perCategoryBudgets, userKey]);

	const [incomeModalOpen, setIncomeModalOpen] = useState(false);
	const [expenseModalOpen, setExpenseModalOpen] = useState(false);
	const [editingExpenseId, setEditingExpenseId] = useState(null);
	const [editingIncomeId, setEditingIncomeId] = useState(null);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (editingExpenseId) {
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

			const t = toast.loading('Adding expense...');
			const newExpense = await api.post("/expenses", payload);

			setExpenses(prev => [newExpense, ...prev]);
			toast.success('Expense added successfully', { id: t });

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
		const t = toast.loading('Deleting expense...');
		try {
			await api.delete(`/expenses/${id}`);
			fetchExpenses();
			toast.success('Expense deleted successfully', { id: t });
		} catch (err) {
			toast.error('Failed to delete expense', { id: t });
			console.warn('Failed to delete expense', err);
		}
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
				toast.success('Income updated successfully', { id: t });
			} catch (e) {
				toast.error('Failed to update income');
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
			fetchIncomes();
			toast.success('Income deleted successfully', { id: t });
		} catch (err) {
			toast.error('Failed to delete income', { id: t });
			console.warn('Failed to delete income', err);
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

	// Use budgetSummary totals as source of truth for monthly budget values
	const monthlyBudgetValue = Number(budgetSummary.totalMonthlyBudget || 0);
	const monthlySpentValue = Number(budgetSummary.totalBudgetSpent || 0);
	const monthlyRemainingValue = Number(budgetSummary.totalBudgetRemaining || (monthlyBudgetValue - monthlySpentValue));
	const percentBudgetUsed = monthlyBudgetValue > 0 ? (monthlySpentValue / monthlyBudgetValue) * 100 : null;
	const budgetColor =
			percentBudgetUsed === null
				? "inherit"
				: percentBudgetUsed >= 100
				? "#FF6B6B"
				: percentBudgetUsed >= 80
				? "#FFD166"
				: "#2ED573";
	const budgetRemaining = monthlyBudgetValue !== null ? monthlyRemainingValue : null;

	// Category summary and over-budget calculation should use the selected month
	const monthFilteredExpenses = expenses.filter(exp => {
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

	const availableBalance = monthlyIncomeTotal - monthlyExpenseTotal;
	const totalNetWorth = totalIncomes - totalExpenses;

	const [savingsBalanceAdjustment, setSavingsBalanceAdjustment] = useState(0);

	// Keep dashboard totals in sync with local state so UI updates immediately
	useEffect(() => {
		setDashboardTotals(prev => ({
			...prev,
			availableBalance: (monthlyIncomeTotal - monthlyExpenseTotal) + (savingsBalanceAdjustment || 0)
		}));
	}, [monthlyIncomeTotal, monthlyExpenseTotal, savingsBalanceAdjustment]);
	const [authToken, setAuthToken] = useState(() => {
		try { return localStorage.getItem("token"); } catch { return null; }
	});

	const onAuthSuccess = (token) => {
		setAuthToken(token);
		fetchExpenses();
		fetchIncomes();
	};

	const logout = () => {
		try { localStorage.removeItem("token"); } catch {}
		try { clearCurrentUser(); } catch {}
		setAuthToken(null);
	};

	// AppLayout expects: monthNames, selectedMonth, setSelectedMonth, selectedYear, setSelectedYear, dateFilter, setDateFilter, authToken, logout
	const layoutProps = { monthNames, selectedMonth, setSelectedMonth, selectedYear, setSelectedYear, dateFilter, setDateFilter, authToken, logout };

	return (
		<BrowserRouter future={{ v7_startTransition: true }}>
			<Toaster position="top-right" toastOptions={{ duration: 3000 }} />
			<Routes>
				<Route element={<AuthLayout />}>
					<Route path="/login" element={<Login onAuthSuccess={(t) => onAuthSuccess(t)} />} />
					<Route path="/register" element={<Register onAuthSuccess={(t) => onAuthSuccess(t)} />} />
				</Route>

				<Route element={<ProtectedRoute />}>
					<Route element={<AppLayout {...layoutProps} />}>
												<Route index element={<Dashboard
							availableBalance={dashboardTotals.availableBalance != null ? dashboardTotals.availableBalance : (availableBalance + (savingsBalanceAdjustment || 0))}
							totalSavings={totalSavings}
							computedTotalSavings={dashboardTotals.totalSavings != null ? dashboardTotals.totalSavings : computedTotalSavingsFromGoals}
							monthlyIncomeTotal={monthlyIncomeTotal}
							monthlyExpenseTotal={monthlyExpenseTotal}
							totalNetWorth={totalNetWorth}
							totalIncomes={totalIncomes}
							totalExpenses={totalExpenses}
							savingsRateColor={savingsRateColor}
							savingsRate={savingsRate}
							dateFilter={dateFilter}
							setDateFilter={setDateFilter}
							monthlyBudget={monthlyBudgetValue}
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
							  expenses={expenses}
							budgets={perCategoryBudgets}
							budgetsMeta={budgetsMeta}
							onBudgetsUpdated={fetchBudgets}
							totalMonthlyBudget={budgetSummary.totalMonthlyBudget}
							totalBudgetSpent={budgetSummary.totalBudgetSpent}
							totalBudgetRemaining={budgetSummary.totalBudgetRemaining}
							selectedYear={selectedYear}
						selectedMonth={selectedMonth}
						/>} />

						<Route path="expenses" element={<Expenses
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
							budgets={perCategoryBudgets}
							budgetsMeta={budgetsMeta}
							onBudgetsUpdated={fetchBudgets}
							monthlyBudget={monthlyBudgetValue}
							percentBudgetUsed={percentBudgetUsed}
							budgetRemaining={monthlyRemainingValue}
							budgetColor={budgetColor}
							overBudgetCategories={overBudgetCategories}
							COLORS={COLORS}
							selectedYear={selectedYear}
							selectedMonth={selectedMonth}
							currencySymbol={currencySymbol}
							formatCurrency={formatCurrency}
						/>} />

						<Route path="income" element={<Income
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
						/>} />

						<Route path="transactions" element={<Transactions incomes={incomes} expenses={expenses} savingsHistory={savingsHistory} selectedYear={selectedYear} selectedMonth={selectedMonth} deleteIncome={deleteIncome} deleteExpense={deleteExpense} openEditIncome={openEditIncome} openEditExpense={openEditExpense} currencySymbol={currencySymbol} formatCurrency={formatCurrency} />} />

						<Route path="budget" element={<Budget budgets={perCategoryBudgets} budgetsMeta={budgetsMeta} onBudgetsUpdated={fetchBudgets} monthlyBudget={monthlyBudgetValue} setMonthlyBudget={setMonthlyBudgetForCurrentMonth} percentBudgetUsed={percentBudgetUsed} budgetRemaining={budgetRemaining} budgetColor={budgetColor} overBudgetCategories={overBudgetCategories} COLORS={COLORS} selectedYear={selectedYear} selectedMonth={selectedMonth} currencySymbol={currencySymbol} formatCurrency={formatCurrency} />} />

						<Route path="debt-bills" element={<DebtBills selectedYear={selectedYear} selectedMonth={selectedMonth} currencySymbol={currencySymbol} formatCurrency={formatCurrency} />} />

						<Route path="analytics" element={<Analytics combinedLineData={combinedLineData} pieData={pieData} currencySymbol={currencySymbol} formatCurrency={formatCurrency} />} />

						<Route path="profile" element={<Profile totalDeposits={totalIncomes} totalWithdrawals={totalExpenses} totalSavings={totalSavings} savingsRate={savingsRate} savingsRateColor={savingsRateColor} currencySymbol={currencySymbol} formatCurrency={formatCurrency} />} />

						<Route path="settings" element={<Settings currencyCode={currencyCode} setCurrencyCode={setCurrencyCode} currencySymbol={currencySymbol} formatCurrency={formatCurrency} />} />

						<Route path="savings" element={<SavingsGoals availableBalance={dashboardTotals.availableBalance != null ? dashboardTotals.availableBalance : (availableBalance + (savingsBalanceAdjustment || 0))} adjustAvailableBalance={(delta) => setSavingsBalanceAdjustment(prev => (prev || 0) + delta)} totalIncomes={totalIncomes} totalExpenses={totalExpenses} totalSavings={dashboardTotals.totalSavings != null ? dashboardTotals.totalSavings : totalSavings} savingsRate={savingsRate} savingsRateColor={savingsRateColor} currencySymbol={currencySymbol} formatCurrency={formatCurrency} selectedYear={selectedYear} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} onSavingsUpdated={async () => {
							// Refresh dashboard, transactions, and savings history after savings updates
							try {
								await fetchSavingsHistory();
								await fetchExpenses();
								await fetchIncomes();
								if (localStorage.getItem('token')) await fetchBudgets();
								const d = await api.get('/dashboard');
								setDashboardTotals(d.totals || {});
							} catch (e) { console.warn('failed savings-related refresh', e); }
						}} savingsHistory={savingsHistory} />} />
					</Route>
				</Route>

				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>

		
		</BrowserRouter>
	);
}

export default function AppRoutes() {
	return <AppController />;
}
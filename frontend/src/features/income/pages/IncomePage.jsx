import React, { useMemo, useState } from "react";
import "./IncomeModule.css";
import TransactionFeed from "../../../components/TransactionFeed/TransactionFeed";
import IncomeHeader from "../components/IncomeHeader";
import IncomeStats from "../components/IncomeStats";
import SourceBreakdownList from "../components/SourceBreakdownList";
import AddTransactionModal from "../../transactions/components/AddTransactionModal";
import "../components/IncomeHeader.css";
import "../components/IncomeStats.css";

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

  const lastMonthTotal = useMemo(() => {
    let prevMonth = selectedMonth - 1;
    let prevYear = selectedYear;
    if (prevMonth < 0) { prevMonth = 11; prevYear = selectedYear - 1; }
    return incomes.reduce((s, it) => {
      if (!it.date) return s;
      const d = new Date(it.date);
      if (d.getFullYear() === prevYear && d.getMonth() === prevMonth) {
        return s + (Number(it.amount) || 0);
      }
      return s;
    }, 0);
  }, [incomes, selectedYear, selectedMonth]);
  const monthlyTotal = useMemo(() => {
    return incomes.reduce((s, it) => {
      if (!it.date) return s;
      const d = new Date(it.date);
      if (d.getFullYear() === selectedYear && d.getMonth() === selectedMonth) {
        return s + (Number(it.amount) || 0);
      }
      return s;
    }, 0);
  }, [incomes, selectedYear, selectedMonth]);

  const bySource = useMemo(() => {
    const map = {};
    incomes.forEach(it => {
      const key = it.source || (it.category ? `${it.category}` : "Unspecified");
      map[key] = (map[key] || 0) + (Number(it.amount) || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [incomes]);

  const monthlyDisplay = formatCurrency ? formatCurrency(monthlyTotal) : `${currencySymbol}${monthlyTotal.toFixed(2)}`;
  const lastMonthDisplay = formatCurrency ? formatCurrency(lastMonthTotal) : `${currencySymbol}${lastMonthTotal.toFixed(2)}`;

  const monthlyIncomeCount = useMemo(() => {
    return incomes.filter(it => {
      if (!it.date) return false;
      const d = new Date(it.date);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    }).length;
  }, [incomes, selectedYear, selectedMonth]);

  const averageIncome = useMemo(() => {
    return monthlyIncomeCount > 0 ? monthlyTotal / monthlyIncomeCount : 0;
  }, [monthlyTotal, monthlyIncomeCount]);

  const averageIncomeDisplay = formatCurrency ? formatCurrency(averageIncome) : `${currencySymbol}${averageIncome.toFixed(2)}`;

  const monthOverMonthChange = useMemo(() => {
    // Check if there are any income records for last month
    let prevMonth = selectedMonth - 1;
    let prevYear = selectedYear;
    if (prevMonth < 0) { prevMonth = 11; prevYear = selectedYear - 1; }
    const lastMonthIncomes = incomes.filter(it => {
      if (!it.date) return false;
      const d = new Date(it.date);
      return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
    });
    
    // Only return null if there are no last month records at all
    if (lastMonthIncomes.length === 0) return null;
    
    // Calculate change even if lastMonthTotal is 0 (edge case of cancelled incomes)
    const change = ((monthlyTotal - lastMonthTotal) / (lastMonthTotal || 1)) * 100;
    return change;
  }, [monthlyTotal, lastMonthTotal, incomes, selectedYear, selectedMonth]);

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

      <IncomeStats
        monthlyDisplay={monthlyDisplay}
        averageIncomeDisplay={averageIncomeDisplay}
        monthOverMonthChange={monthOverMonthChange}
      />

      <h3 className="section-title">All Incomes</h3>
      <TransactionFeed
        transactions={incomes.map(i => ({ ...i, type: "income" }))}
        currencySymbol={currencySymbol}
        formatCurrency={formatCurrency}
        deleteIncome={deleteIncome}
        openEditIncome={handleEditIncome}
        onEditTransaction={handleEditIncome}
      />

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

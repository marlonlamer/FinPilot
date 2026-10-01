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

      <IncomeStats monthlyDisplay={monthlyDisplay} lastMonthDisplay={lastMonthDisplay} />

      <SourceBreakdownList bySource={bySource} formatCurrency={formatCurrency} currencySymbol={currencySymbol} />

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

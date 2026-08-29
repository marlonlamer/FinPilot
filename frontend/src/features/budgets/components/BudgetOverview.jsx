import React, { useEffect, useState } from "react";
import "../styles/BudgetOverview.css";
import ConfirmModal from "../../../components/ConfirmModal/ConfirmModal";
import BudgetSummaryCard from "./BudgetSummaryCard";
import BudgetCategoryItem from "./BudgetCategoryItem";
import BudgetCategoryList from "./BudgetCategoryList";
import BudgetHeader from "./BudgetHeader";
import BudgetModal from "./BudgetModal";
import BudgetHealth from "./OverallProgress";
import "./BudgetHeader.css";
import "./OverallProgress.css";
import "./BudgetCategoryItem.css";
import { api } from "../../../services/api";
import { formatYearMonth } from "../../../utils/dateUtils";
import { clampPercentage } from "../../../utils/clampPercentage";
import toast from 'react-hot-toast';
import BudgetSkeleton from "./BudgetSkeleton";

export default function BudgetOverview({ monthlyBudget, percentBudgetUsed, budgetRemaining, budgetColor, currencySymbol = "₱", formatCurrency, budgets = {}, budgetsMeta = {}, onBudgetsUpdated = () => {}, readOnly = false, externalAddOpen = false, onExternalAddHandled = () => {}, showAddButton = true, selectedYear = null, selectedMonth = null, showSummary = true, showCategoryList = true, isLoading = false, error = null }) {
  const localBudgets = budgets || {};
  const pct = percentBudgetUsed || 0;
  const [budgetModal, setBudgetModal] = useState({ open: false, mode: "create" });
  const [editInitial, setEditInitial] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, category: null, id: null });

  const openCreateModal = () => {
    setEditInitial({});
    setBudgetModal({ open: true, mode: "create" });
  };

  const closeBudgetModal = () => {
    if (isSubmitting) return;
    setBudgetModal({ open: false, mode: "create" });
    setEditInitial({});
  };

  useEffect(() => {
    if (externalAddOpen) {
      openCreateModal();
      try { onExternalAddHandled && onExternalAddHandled(); } catch (e) {}
    }
  }, [externalAddOpen]);

  async function refresh() {
    try {
      if (typeof onBudgetsUpdated === 'function') await onBudgetsUpdated();
    } catch (e) { console.warn('refresh budgets failed', e); }
  }

  const handleBudgetSubmit = async ({ category, amount }) => {
    const cat = String(category || "").trim();
    const num = Number(amount || 0);
    if (!cat || !Number.isFinite(num) || num <= 0) return;

    setIsSubmitting(true);
    try {
      if (budgetModal.mode === "edit") {
        const id = editInitial.id;
        if (id) {
          const t = toast.loading('Updating budget...');
          await api.put(`/budgets/${id}`, { category: cat, budgetLimit: num });
          toast.success('Budget updated successfully', { id: t });
        } else {
          const month = (selectedYear != null && selectedMonth != null)
            ? formatYearMonth(selectedYear, selectedMonth)
            : (() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`; })();
          const t = toast.loading('Adding budget...');
          await api.post('/budgets', { category: cat, budgetLimit: num, month });
          toast.success('Budget added successfully', { id: t });
        }
      } else {
        const month = (selectedYear != null && selectedMonth != null)
          ? formatYearMonth(selectedYear, selectedMonth)
          : (() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`; })();
        const t = toast.loading('Adding budget...');
        await api.post('/budgets', { category: cat, budgetLimit: num, month });
        toast.success('Budget added successfully', { id: t });
      }
      setBudgetModal({ open: false, mode: "create" });
      setEditInitial({});
      await refresh();
    } catch (e) {
      console.error(e);
      toast.error(budgetModal.mode === "edit" ? "Failed to update budget" : "Failed to add budget");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      if (deleteConfirm.id) {
        const t = toast.loading('Deleting budget...');
        await api.delete(`/budgets/${deleteConfirm.id}`);
        setDeleteConfirm({ open: false, category: null, id: null });
        await refresh();
        toast.success('Budget deleted successfully', { id: t });
      } else {
        // local-only removal
        setDeleteConfirm({ open: false, category: null, id: null });
        await refresh();
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete budget');
    }
  };

  const entries = Object.keys(localBudgets || {}).map(k => ({ category: k, budget: Number(localBudgets[k] || 0) }));

  return (
    <div className="budget-overview">
      {isLoading && <BudgetSkeleton />}

      {error && (
        <div className="budget-error">
          <div>{error}</div>
        </div>
      )}

      {!isLoading && !error && (
        <>
          <BudgetHeader 
            onAddBudget={openCreateModal}
            showAddButton={showAddButton}
            readOnly={readOnly}
          />

          <BudgetHealth
            monthlyBudget={monthlyBudget}
            percentBudgetUsed={percentBudgetUsed}
            budgetRemaining={budgetRemaining}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            currencySymbol={currencySymbol}
            formatCurrency={formatCurrency}
          />

          {showSummary && (
            <BudgetSummaryCard
              monthlyBudget={monthlyBudget}
              percentBudgetUsed={percentBudgetUsed}
              budgetRemaining={budgetRemaining}
              currencySymbol={currencySymbol}
              formatCurrency={formatCurrency}
              showAddButton={false}
              readOnly={readOnly}
              onAddBudget={openCreateModal}
            />
          )}

          {showCategoryList && (
            <BudgetCategoryList hasItems={entries.length > 0} onAddBudget={openCreateModal}>
              {entries.map((e) => {
                const meta = budgetsMeta[e.category] || {};
                const spent = Number(meta.budgetSpent || 0);
                const remaining = (meta.budgetRemaining != null) ? Number(meta.budgetRemaining) : (Number(e.budget || 0) - spent);
                const pct = e.budget > 0 ? (spent / e.budget) * 100 : 0;
                const severity = pct > 100 ? 'over' : (pct > 80 ? 'warning' : 'normal');
                return (
                  <BudgetCategoryItem
                    key={e.category}
                    category={e.category}
                    budget={e.budget}
                    spent={spent}
                    remaining={remaining}
                    severity={severity}
                    readOnly={readOnly}
                    currencySymbol={currencySymbol}
                    formatCurrency={formatCurrency}
                    progressPercent={clampPercentage(pct || 0)}
                    onEdit={() => { const meta = budgetsMeta[e.category] || null; setEditInitial({ id: meta ? meta.id : null, category: e.category, amount: e.budget }); setBudgetModal({ open: true, mode: "edit" }); }}
                    onDelete={() => { const meta = budgetsMeta[e.category] || null; setDeleteConfirm({ open: true, category: e.category, id: meta ? meta.id : null }); }}
                  />
                );
              })}
            </BudgetCategoryList>
          )}

          <BudgetModal
            open={budgetModal.open}
            mode={budgetModal.mode}
            initialValues={budgetModal.mode === "edit" ? editInitial : { category: "", amount: "" }}
            onClose={closeBudgetModal}
            onSubmit={handleBudgetSubmit}
            isSubmitting={isSubmitting}
            currencySymbol={currencySymbol}
          />

          <ConfirmModal
            open={deleteConfirm.open}
            message={deleteConfirm.category ? `Delete budget for ${deleteConfirm.category}? This cannot be undone.` : 'Delete budget?'}
            onConfirm={handleDelete}
            onCancel={() => setDeleteConfirm({ open: false, category: null, id: null })}
            confirmLabel="Delete"
          />
        </>
      )}
    </div>
  );
}

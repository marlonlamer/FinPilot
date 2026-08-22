import React, { useEffect, useState } from "react";
import "../styles/BudgetOverview.css";
import ConfirmModal from "../../../components/ConfirmModal/ConfirmModal";
import BudgetSummaryCard from "./BudgetSummaryCard";
import BudgetCategoryItem from "./BudgetCategoryItem";
import BudgetCategoryList from "./BudgetCategoryList";
import BudgetModal from "./BudgetModal";
import { api } from "../../../services/api";
import { formatYearMonth } from "../../../utils/dateUtils";
import { clampPercentage } from "../../../utils/clampPercentage";
import toast from 'react-hot-toast';
import BudgetSkeleton from "./BudgetSkeleton";

export default function BudgetOverview({ monthlyBudget, percentBudgetUsed, budgetRemaining, budgetColor , currencySymbol = "₱", formatCurrency, budgets = {}, budgetsMeta = {}, onBudgetsUpdated = () => {}, readOnly = false, externalAddOpen = false, onExternalAddHandled = () => {}, showAddButton = true, selectedYear = null, selectedMonth = null, showSummary = true, showCategoryList = true, isLoading = false, error = null }) {
  const pct = percentBudgetUsed || 0;
  const localBudgets = budgets || {};
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editInitial, setEditInitial] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, category: null, id: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (externalAddOpen) {
      setAddOpen(true);
      try { onExternalAddHandled && onExternalAddHandled(); } catch (e) {}
    }
  }, [externalAddOpen]);

  async function refresh() {
    try {
      if (typeof onBudgetsUpdated === 'function') await onBudgetsUpdated();
    } catch (e) { console.warn('refresh budgets failed', e); }
  }

  const handleAdd = async ({ category, amount }) => {
    setIsSubmitting(true);
    try {
      const month = (selectedYear != null && selectedMonth != null)
        ? formatYearMonth(selectedYear, selectedMonth)
        : (() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`; })();
      const t = toast.loading('Creating budget...');
      await api.post('/budgets', { category, budgetLimit: amount, month });
      setAddOpen(false);
      await refresh();
      toast.success('Budget created successfully', { id: t });
    } catch (e) {
      console.error(e);
      toast.error('Failed to create budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async ({ category, amount }) => {
    setIsSubmitting(true);
    try {
      const id = editInitial.id;
      if (id) {
        const t = toast.loading('Updating budget...');
        await api.put(`/budgets/${id}`, { category, budgetLimit: amount });
        toast.success('Budget updated successfully', { id: t });
      } else {
        const month = (selectedYear != null && selectedMonth != null)
          ? formatYearMonth(selectedYear, selectedMonth)
          : (() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`; })();
        const t = toast.loading('Creating budget...');
        await api.post('/budgets', { category, budgetLimit: amount, month });
        toast.success('Budget created successfully', { id: t });
      }
      setEditOpen(false);
      await refresh();
    } catch (e) {
      console.error(e);
      toast.error('Failed to update budget');
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
          {showSummary && (
            <BudgetSummaryCard
              monthlyBudget={monthlyBudget}
              percentBudgetUsed={percentBudgetUsed}
              budgetRemaining={budgetRemaining}
              budgetColor={budgetColor}
              currencySymbol={currencySymbol}
              formatCurrency={formatCurrency}
              showAddButton={showAddButton}
              readOnly={readOnly}
              progressPercent={clampPercentage(pct)}
              onAddBudget={() => setAddOpen(true)}
            />
          )}

          {showCategoryList && (
            <BudgetCategoryList hasItems={entries.length > 0}>
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
                    onEdit={() => { const meta = budgetsMeta[e.category] || null; setEditInitial({ id: meta ? meta.id : null, category: e.category, amount: String(e.budget) }); setEditOpen(true); }}
                    onDelete={() => { const meta = budgetsMeta[e.category] || null; setDeleteConfirm({ open: true, category: e.category, id: meta ? meta.id : null }); }}
                  />
                );
              })}
            </BudgetCategoryList>
          )}

          <BudgetModal
            open={addOpen}
            mode="create"
            onClose={() => setAddOpen(false)}
            onSubmit={handleAdd}
            currencySymbol={currencySymbol}
            isLoading={isSubmitting}
          />

          <BudgetModal
            open={editOpen}
            mode="edit"
            onClose={() => setEditOpen(false)}
            onSubmit={handleEdit}
            initialData={editInitial}
            currencySymbol={currencySymbol}
            isLoading={isSubmitting}
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

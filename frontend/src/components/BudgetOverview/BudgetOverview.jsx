import React, { useEffect, useState } from "react";
import "./BudgetOverview.css";
import FormModal from "../../components/FormModal/FormModal";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import BudgetSummaryCard from "./BudgetSummaryCard";
import { api } from "../../services/api";
import { formatYearMonth } from "../../utils/dateUtils";
import { clampPercentage } from "../../utils/clampPercentage";
import toast from 'react-hot-toast';

export default function BudgetOverview({ monthlyBudget, percentBudgetUsed, budgetRemaining, budgetColor , currencySymbol = "₱", formatCurrency, budgets = {}, budgetsMeta = {}, onBudgetsUpdated = () => {}, readOnly = false, externalAddOpen = false, onExternalAddHandled = () => {}, showAddButton = true, selectedYear = null, selectedMonth = null, showSummary = true, showCategoryList = true }) {
  const pct = percentBudgetUsed || 0;
  const localBudgets = budgets || {};
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editInitial, setEditInitial] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, category: null, id: null });


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
    const cat = String(category || "").trim();
    const num = Number(amount || 0);
    if (!cat) return window.alert('Category name is required');
    try {
      const month = (selectedYear != null && selectedMonth != null)
        ? formatYearMonth(selectedYear, selectedMonth)
        : (() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`; })();
      const t = toast.loading('Adding budget...');
      await api.post('/budgets', { category: cat, budgetLimit: num, month });
      setAddOpen(false);
      await refresh();
      toast.success('Budget added successfully', { id: t });
    } catch (e) {
      console.error(e);
      toast.error('Failed to add budget');
    }
  };

  const handleEdit = async ({ category, amount }) => {
    try {
      const id = editInitial.id;
      if (id) {
        const t = toast.loading('Updating budget...');
        await api.put(`/budgets/${id}`, { category, budgetLimit: Number(amount || 0) });
        toast.success('Budget updated successfully', { id: t });
      } else {
        const month = (selectedYear != null && selectedMonth != null)
          ? formatYearMonth(selectedYear, selectedMonth)
          : (() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`; })();
        const t = toast.loading('Adding budget...');
        await api.post('/budgets', { category, budgetLimit: Number(amount || 0), month });
        toast.success('Budget added successfully', { id: t });
      }
      setEditOpen(false);
      await refresh();
    } catch (e) {
      console.error(e);
      toast.error('Failed to update budget');
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
        <div className="budget-card small">
          <div className="card-label">Budgets by Category</div>
          {entries.length > 0 ? (
            <div className="budget-grid">
              {entries.map((e) => {
                const meta = budgetsMeta[e.category] || {};
                const spent = Number(meta.budgetSpent || 0);
                const remaining = (meta.budgetRemaining != null) ? Number(meta.budgetRemaining) : (Number(e.budget || 0) - spent);
                const pct = e.budget > 0 ? (spent / e.budget) * 100 : 0;
                return (
                  <div key={e.category} className="budget-category-card">
                    <div className="budget-row-header">
                      <div className="budget-name">{e.category}</div>
                      <div className="category-actions">
                        {!readOnly && (
                          <>
                            <button className="icon-btn" onClick={() => { const meta = budgetsMeta[e.category] || null; setEditInitial({ id: meta ? meta.id : null, category: e.category, amount: e.budget }); setEditOpen(true); }}>✏️</button>
                            <button className="icon-btn" onClick={() => { const meta = budgetsMeta[e.category] || null; setDeleteConfirm({ open: true, category: e.category, id: meta ? meta.id : null }); }}>❌</button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="budget-progress">
                      <div className="progress-track">
                        <div className={"progress-fill " + (pct > 100 ? 'over' : (pct > 80 ? 'warning' : 'normal'))} style={{ width: `${clampPercentage(pct || 0)}%` }} />
                      </div>
                    </div>
                    <div className="budget-amount">{formatCurrency ? formatCurrency(spent) : `${currencySymbol}${spent.toFixed(2)}`} / {formatCurrency ? formatCurrency(e.budget) : `${currencySymbol}${e.budget.toFixed(2)}`} — Remaining: {formatCurrency ? formatCurrency(remaining) : `${currencySymbol}${remaining.toFixed(2)}`}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="muted">No budgets set. Click "Add Budget" to create one.</div>
          )}
        </div>
      )}

      <FormModal
        open={addOpen}
        title="Add Budget"
        fields={[{ name: 'category', label: 'Category Name' }, { name: 'amount', label: 'Budget Amount', type: 'number' }]}
        initialValues={{ category: '', amount: '' }}
        onCancel={() => setAddOpen(false)}
        onSubmit={handleAdd}
        submitLabel="Add"
      />

      <FormModal
        open={editOpen}
        title="Edit Budget"
        fields={[{ name: 'category', label: 'Category Name' }, { name: 'amount', label: 'Budget Amount', type: 'number' }]}
        initialValues={{ category: editInitial.category || '', amount: editInitial.amount || '' }}
        onCancel={() => setEditOpen(false)}
        onSubmit={handleEdit}
        submitLabel="Save"
      />

      <ConfirmModal
        open={deleteConfirm.open}
        message={deleteConfirm.category ? `Delete budget for ${deleteConfirm.category}? This cannot be undone.` : 'Delete budget?'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, category: null, id: null })}
        confirmLabel="Delete"
      />
    </div>
  );
}

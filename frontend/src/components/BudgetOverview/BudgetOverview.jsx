import React, { useEffect, useState } from "react";
import "./BudgetOverview.css";
import FormModal from "../../components/FormModal/FormModal";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import { api } from "../../services/api";

export default function BudgetOverview({ monthlyBudget, percentBudgetUsed, budgetRemaining, budgetColor, overBudgetCategories, COLORS, currencySymbol = "₱", formatCurrency, budgets = {}, budgetsMeta = {}, onBudgetsUpdated = () => {} }) {
  const pct = percentBudgetUsed || 0;
  const [localBudgets, setLocalBudgets] = useState(budgets || {});
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editInitial, setEditInitial] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, category: null, id: null });

  useEffect(() => setLocalBudgets(budgets || {}), [budgets]);

  const refresh = async () => {
    try {
      if (typeof onBudgetsUpdated === 'function') await onBudgetsUpdated();
    } catch (e) { console.warn('refresh budgets failed', e); }
  };

  const handleAdd = async ({ category, amount }) => {
    const cat = String(category || "").trim();
    const num = Number(amount || 0);
    if (!cat) return window.alert('Category name is required');
    try {
      await api.post('/budgets', { category: cat, amount: num });
      setAddOpen(false);
      await refresh();
    } catch (e) {
      console.error(e);
      window.alert('Failed to add budget');
    }
  };

  const handleEdit = async ({ category, amount }) => {
    try {
      const id = editInitial.id;
      if (id) {
        await api.put(`/budgets/${id}`, { category, amount: Number(amount || 0) });
      } else {
        await api.post('/budgets', { category, amount: Number(amount || 0) });
      }
      setEditOpen(false);
      await refresh();
    } catch (e) {
      console.error(e);
      window.alert('Failed to update budget');
    }
  };

  const handleDelete = async () => {
    try {
      if (deleteConfirm.id) {
        await api.delete(`/budgets/${deleteConfirm.id}`);
        setDeleteConfirm({ open: false, category: null, id: null });
        await refresh();
      } else {
        // local-only removal
        setDeleteConfirm({ open: false, category: null, id: null });
        await refresh();
      }
    } catch (e) {
      console.error(e);
      window.alert('Failed to delete budget');
    }
  };

  const entries = Object.keys(localBudgets || {}).map(k => ({ category: k, budget: Number(localBudgets[k] || 0) }));

  return (
    <div className="budget-overview">
      <div className="budget-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="card-label">Monthly Budget</div>
            <div className="card-value">{monthlyBudget === null ? "Not set" : (formatCurrency ? formatCurrency(monthlyBudget) :typeof monthlyBudget === "number" ? `${currencySymbol}${monthlyBudget.toFixed(2)}` : "Not set")}</div>
          </div>
          <div>
            <button className="btn btn-primary" onClick={() => setAddOpen(true)}>＋ Add Budget</button>
          </div>
        </div>

        <div className="budget-progress-block">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: budgetColor || "#60a5fa" }} />
          </div>
          <div className="progress-subtext">
            {typeof percentBudgetUsed === "number"
            ? `${percentBudgetUsed.toFixed(1)}% used`
            : "Usage not available"}
            {budgetRemaining !== null && ` — Remaining: ${formatCurrency ? formatCurrency(budgetRemaining) : typeof budgetRemaining === "number"
              ? `${currencySymbol}${budgetRemaining.toFixed(2)}`
              : "N/A"} `}
          </div>
        </div>
      </div>

      <div className="budget-card small">
        <div className="card-label">Budgets by Category</div>
        {entries.length > 0 ? (
          <div className="budget-grid">
            {entries.map((e) => {
              const spent = 0; // parent computes spent in Expenses; Dashboard shows top overbudget separately
              const pct = e.budget > 0 ? (spent / e.budget) * 100 : 0;
              return (
                <div key={e.category} className="budget-category-card">
                  <div className="budget-row-header">
                    <div className="budget-name">{e.category}</div>
                    <div className="category-actions">
                      <button className="icon-btn" onClick={() => { setEditInitial({ id: budgetsMeta[e.category] || null, category: e.category, amount: e.budget }); setEditOpen(true); }}>✏️</button>
                      <button className="icon-btn" onClick={() => { setDeleteConfirm({ open: true, category: e.category, id: budgetsMeta[e.category] || null }); }}>❌</button>
                    </div>
                  </div>
                  <div className="budget-progress">
                    <div className="progress-track">
                      <div className={"progress-fill " + (pct > 100 ? 'over' : 'normal')} style={{ width: `${Math.min(100, Math.max(0, pct || 0))}%` }} />
                    </div>
                  </div>
                  <div className="budget-amount">{formatCurrency ? formatCurrency(spent) : `${currencySymbol}${spent.toFixed(2)}`} / {formatCurrency ? formatCurrency(e.budget) : `${currencySymbol}${e.budget.toFixed(2)}`}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="muted">No budgets set. Click "Add Budget" to create one.</div>
        )}
      </div>

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

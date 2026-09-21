import React, { useEffect, useState } from "react";
import { EXPENSE_CATEGORIES } from "../../../constants/expenseCategories";
import { INCOME_CATEGORIES } from "../../../constants/incomeCategories";
import "./AddTransactionModal.css";

const today = () => new Date().toISOString().slice(0, 10);

const defaultCategory = (isExpense) => (isExpense ? EXPENSE_CATEGORIES[0]?.value : INCOME_CATEGORIES[0]?.value) || "";

const emptyForm = {
  amount: "",
  category: defaultCategory(true),
  description: "",
  source: "",
  date: today(),
  time: new Date().toTimeString().slice(0, 5),
  notes: "",
  customCategory: ""
};

const normalizeTransactionType = (transaction) => {
  const type = String(transaction?.type || "").toLowerCase();
  if (type.includes("income")) return "income";
  if (type.includes("expense")) return "expense";
  const amount = Number(transaction?.amount || 0);
  if (amount >= 0) return "income";
  return "expense";
};

const toFormValues = (transaction, fallbackType = "expense") => {
  const isExpenseType = transaction ? normalizeTransactionType(transaction) === "expense" : fallbackType === "expense";
  const categoryOptions = isExpenseType ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const actualCategory = transaction?.category || defaultCategory(isExpenseType);
  const isCustomCategory = actualCategory && !categoryOptions.some((category) => category.value === actualCategory) && actualCategory !== "Other";
  const dateValue = transaction?.date ? new Date(transaction.date) : null;
  const dateString = dateValue && !Number.isNaN(dateValue.getTime()) ? dateValue.toISOString().slice(0, 10) : today();
  const timeString = dateValue && !Number.isNaN(dateValue.getTime()) ? dateValue.toTimeString().slice(0, 5) : new Date().toTimeString().slice(0, 5);

  return {
    amount: transaction?.amount != null ? String(transaction.amount) : "",
    category: isCustomCategory ? "Other" : actualCategory || defaultCategory(isExpenseType),
    description: transaction?.description || transaction?.merchant || transaction?.payer || transaction?.source || "",
    source: transaction?.destination || transaction?.account || transaction?.paymentSource || transaction?.source || "",
    date: dateString,
    time: timeString,
    notes: transaction?.notes || "",
    customCategory: isCustomCategory ? actualCategory : ""
  };
};

export default function AddTransactionModal({
  open,
  onClose,
  onCreateExpense,
  onCreateIncome,
  onUpdateExpense,
  onUpdateIncome,
  editingTransaction = null,
  currencySymbol = "₱"
}) {
  const [transactionType, setTransactionType] = useState("expense");
  const [values, setValues] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(editingTransaction && editingTransaction.id);

  useEffect(() => {
    if (open) {
      const nextType = editingTransaction ? normalizeTransactionType(editingTransaction) : "expense";
      setTransactionType(nextType);
      setValues(toFormValues(editingTransaction, nextType));
      setError("");
    }
  }, [open, editingTransaction]);

  const update = (name, value) => setValues(previous => ({ ...previous, [name]: value }));

  const handleTypeChange = (nextType) => {
    const nextDefaultCategory = defaultCategory(nextType === "expense");
    setTransactionType(nextType);
    setError("");
    setValues(previous => ({
      ...previous,
      category: nextDefaultCategory,
      description: "",
      source: "",
      customCategory: ""
    }));
  };

  const handleCategoryChange = (event) => {
    const nextCategory = event.target.value;
    update("category", nextCategory);
    if (nextCategory !== "Other") {
      update("customCategory", "");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const amount = Number(values.amount);
    const selectedCategory = values.category === "Other" ? values.customCategory.trim() : values.category;

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (!selectedCategory) {
      setError(values.category === "Other" ? "Enter a custom category." : "Select a category.");
      return;
    }
    if (!values.source.trim()) {
      setError(transactionType === "expense" ? "Enter a payment source." : "Enter an income source.");
      return;
    }

    const date = values.time ? `${values.date}T${values.time}:00` : values.date;
    const payload = {
      amount,
      category: selectedCategory,
      customCategory: values.category === "Other" ? selectedCategory : undefined,
      source: values.source.trim(),
      date,
      notes: values.notes.trim(),
      description: values.description.trim(),
      ...(transactionType === "expense" ? {} : {})
    };

    setSaving(true);
    setError("");
    try {
      if (isEditing && transactionType === "expense" && typeof onUpdateExpense === "function") {
        await onUpdateExpense(editingTransaction.id, payload);
      } else if (isEditing && transactionType === "income" && typeof onUpdateIncome === "function") {
        await onUpdateIncome(editingTransaction.id, payload);
      } else if (transactionType === "expense") {
        await onCreateExpense(payload);
      } else {
        await onCreateIncome(payload);
      }
      onClose();
    } catch (submissionError) {
      setError(submissionError?.message || "Unable to save this transaction. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const isExpense = transactionType === "expense";
  const categoryOptions = isExpense ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const categories = values.category && !categoryOptions.some((category) => category.value === values.category)
    ? [{ value: values.category, label: values.category }, ...categoryOptions]
    : categoryOptions;

  if (!open) return null;

  return (
    <div className="add-transaction-overlay" onMouseDown={onClose}>
      <div className="add-transaction-modal" onMouseDown={event => event.stopPropagation()}>
        <div className="add-transaction-header">
          <div>
            <p className="add-transaction-eyebrow">Money movement</p>
            <h2>{isEditing ? "Update Transaction" : "Add Transaction"}</h2>
            <p>Record an expense or income without leaving your overview.</p>
          </div>
          <button type="button" className="add-transaction-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="add-transaction-typeSwitch" role="tablist" aria-label="Transaction type">
          <button type="button" className={isExpense ? "is-active expense" : ""} onClick={() => handleTypeChange("expense")} role="tab" aria-selected={isExpense}>
            ↓ Expense Out
          </button>
          <button type="button" className={!isExpense ? "is-active income" : ""} onClick={() => handleTypeChange("income")} role="tab" aria-selected={!isExpense}>
            ↑ Income In
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-transaction-form">
          <div className="add-transaction-field add-transaction-field--amount">
            <label htmlFor="transaction-amount">Amount</label>
            <div className="add-transaction-amountInput">
              <span>{currencySymbol}</span>
              <input id="transaction-amount" type="number" min="0.01" step="0.01" value={values.amount} onChange={event => update("amount", event.target.value)} placeholder="0.00" required />
            </div>
          </div>

          <label className="add-transaction-field">
            <span>{isExpense ? "Category" : "Income Category"}</span>
            <select value={values.category} onChange={handleCategoryChange} required>
              {categories.map(category => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>
          </label>

          {values.category === "Other" ? (
            <label className="add-transaction-field add-transaction-customCategory">
              <span>{isExpense ? "Custom expense category" : "Custom income category"}</span>
              <input
                type="text"
                value={values.customCategory}
                onChange={event => update("customCategory", event.target.value)}
                placeholder="e.g. Pet Supplies, Gifts, Miscellaneous"
                required
              />
            </label>
          ) : null}

          <label className="add-transaction-field">
            <span>{isExpense ? "Merchant / Recipient" : "Payer / Source"}</span>
            <input value={values.description} onChange={event => update("description", event.target.value)} placeholder={isExpense ? "e.g. Grocery Store" : "e.g. Company or client"} />
          </label>

          <label className="add-transaction-field">
            <span>{isExpense ? "Payment Source / Account" : "Destination / Account"}</span>
            <input value={values.source} onChange={event => update("source", event.target.value)} placeholder="Cash, bank, or e-wallet" required />
          </label>

          <div className="add-transaction-dateRow">
            <label className="add-transaction-field">
              <span>Date</span>
              <input type="date" value={values.date} onChange={event => update("date", event.target.value)} required />
            </label>
            <label className="add-transaction-field">
              <span>Time</span>
              <input type="time" value={values.time} onChange={event => update("time", event.target.value)} />
            </label>
          </div>

          <label className="add-transaction-field">
            <span>Optional Notes</span>
            <textarea value={values.notes} onChange={event => update("notes", event.target.value)} placeholder="Add context for this transaction" rows="2" />
          </label>

          {error ? <p className="add-transaction-error" role="alert">{error}</p> : null}

          <div className="add-transaction-actions">
            <button type="button" className="add-transaction-cancel" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className={`add-transaction-save ${isExpense ? "expense" : "income"}`} disabled={saving}>
              {saving ? "Saving..." : isEditing ? "Update Transaction" : "Save Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

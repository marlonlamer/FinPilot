import React, { useEffect, useState } from "react";
import { EXPENSE_CATEGORIES } from "../../../constants/expenseCategories";
import { INCOME_CATEGORIES } from "../../../constants/incomeCategories";
import {
  getIncomeEditFormFields,
  getIncomeRequestFields
} from "../../income/utils/incomeTransactionMapping";
import {
  getIncomeDateTimeInputValues,
  getRecurrenceFormValues,
  serializeIncomeDateTime
} from "../../income/utils/incomeDateTime";
import "./AddTransactionModal.css";

const today = () => new Date().toISOString().slice(0, 10);
const localToday = () => {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const defaultCategory = (isExpense) => (isExpense ? EXPENSE_CATEGORIES[0]?.value : INCOME_CATEGORIES[0]?.value) || "";

const emptyForm = {
  amount: "",
  category: defaultCategory(true),
  description: "",
  source: "",
  date: today(),
  time: new Date().toTimeString().slice(0, 5),
  notes: "",
  customCategory: "",
  paymentMethod: ""
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
  const validDateValue = dateValue && !Number.isNaN(dateValue.getTime());
  const incomeDateTime = !isExpenseType && validDateValue ? getIncomeDateTimeInputValues(dateValue) : null;
  const dateString = incomeDateTime
    ? incomeDateTime.date
    : validDateValue
      ? dateValue.toISOString().slice(0, 10)
      : transaction?.date
        ? ""
        : !isExpenseType
          ? localToday()
          : today();
  const timeString = incomeDateTime
    ? incomeDateTime.time
    : validDateValue
      ? dateValue.toTimeString().slice(0, 5)
      : new Date().toTimeString().slice(0, 5);
  const incomeFields = !isExpenseType && transaction ? getIncomeEditFormFields(transaction) : null;

  return {
    amount: transaction?.amount != null ? String(transaction.amount) : "",
    category: isCustomCategory ? "Other" : actualCategory || defaultCategory(isExpenseType),
    description: isExpenseType
      ? transaction?.description || transaction?.merchant || transaction?.source || ""
      : incomeFields?.description || "",
    source: isExpenseType
      ? transaction?.paymentSource || transaction?.paymentSourceAccount || transaction?.account || transaction?.source || ""
      : incomeFields?.source || "",
    date: dateString,
    time: timeString,
    notes: transaction?.notes || "",
    customCategory: isCustomCategory ? actualCategory : "",
    paymentMethod: transaction?.paymentMethod || ""
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
  defaultType = "expense",
  mode = "both",
  currencySymbol = "₱"
}) {
  const [transactionType, setTransactionType] = useState("expense");
  const [values, setValues] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState("monthly");
  const [recurringEndDate, setRecurringEndDate] = useState("");

  const isEditing = Boolean(editingTransaction && editingTransaction.id);
  const restrictedType = mode === "income" || mode === "expense" ? mode : null;
  const activeTransactionType = restrictedType || transactionType;
  const headerContent = mode === "income"
    ? {
      eyebrow: "Income",
      title: isEditing ? "Update Income" : "Add Income",
      description: "Record your income and keep your finances up to date."
    }
    : mode === "expense"
      ? {
        eyebrow: "Expense",
        title: isEditing ? "Update Expense" : "Add Expense",
        description: "Record and track where your money goes."
      }
      : {
        eyebrow: "Money movement",
        title: isEditing ? "Update Transaction" : "Add Transaction",
        description: "Record an expense or income without leaving your overview."
      };

  useEffect(() => {
    if (open) {
      const nextType = restrictedType || (editingTransaction ? normalizeTransactionType(editingTransaction) : defaultType);
      setTransactionType(nextType);
      setValues(toFormValues(editingTransaction, nextType));
      setError("");
      setIsRecurring(false);
      setRecurringFrequency("monthly");
      setRecurringEndDate("");
    }
  }, [open, editingTransaction, defaultType, restrictedType]);

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
    if (activeTransactionType === "expense" && !values.source.trim()) {
      setError("Enter a payment source.");
      return;
    }

    const date = activeTransactionType === "income"
      ? serializeIncomeDateTime(values.date, values.time)
      : values.time ? `${values.date}T${values.time}:00` : values.date;
    if (!date) {
      setError("Enter a valid date and time.");
      return;
    }
    const payload = {
      amount,
      category: selectedCategory,
      customCategory: values.category === "Other" ? selectedCategory : undefined,
      ...(activeTransactionType === "income"
        ? getIncomeRequestFields({ payer: values.description, destination: values.source })
        : { source: values.source.trim() }),
      date,
      notes: values.notes.trim(),
      description: values.description.trim(),
      isRecurring,
      ...(isRecurring ? {
        recurrenceFrequency: recurringFrequency,
        recurrenceEndDate: recurringEndDate || undefined
      } : {}),
      ...(activeTransactionType === "expense" ? {} : {})
    };

    setSaving(true);
    setError("");
    try {
      if (isEditing && activeTransactionType === "expense" && typeof onUpdateExpense === "function") {
        await onUpdateExpense(editingTransaction.id, payload);
      } else if (isEditing && activeTransactionType === "income" && typeof onUpdateIncome === "function") {
        await onUpdateIncome(editingTransaction.id, payload);
      } else if (activeTransactionType === "expense") {
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

  const isExpense = activeTransactionType === "expense";
  const categoryOptions = isExpense ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const categories = values.category && !categoryOptions.some((category) => category.value === values.category)
    ? [{ value: values.category, label: values.category }, ...categoryOptions]
    : categoryOptions;

  if (!open) return null;

  return (
    <div className="add-transaction-overlay" onMouseDown={onClose}>
      <div className={`add-transaction-modal${mode === "expense" ? " add-transaction-modal--expense" : ""}`} onMouseDown={event => event.stopPropagation()}>
        <div className="add-transaction-header">
          <div>
            <p className="add-transaction-eyebrow">{headerContent.eyebrow}</p>
            <h2>{headerContent.title}</h2>
            <p>{headerContent.description}</p>
          </div>
          <button type="button" className="add-transaction-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {!restrictedType ? <div className="add-transaction-typeSwitch" role="tablist" aria-label="Transaction type">
          <button type="button" className={isExpense ? "is-active expense" : ""} onClick={() => handleTypeChange("expense")} role="tab" aria-selected={isExpense}>
            ↓ Expense Out
          </button>
          <button type="button" className={!isExpense ? "is-active income" : ""} onClick={() => handleTypeChange("income")} role="tab" aria-selected={!isExpense}>
            ↑ Income In
          </button>
        </div> : null}

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

          {!isEditing ? (
            <div className="add-transaction-recurring">
              <label className="add-transaction-recurringToggle">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={event => setIsRecurring(event.target.checked)}
                />
                <span>{isExpense ? "Make this a recurring expense" : "Make this a recurring transaction"}</span>
              </label>

              {isRecurring ? (
                <div className="add-transaction-recurringDetails">
                  <label className="add-transaction-field">
                    <span>Frequency</span>
                    <select value={recurringFrequency} onChange={event => setRecurringFrequency(event.target.value)}>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </label>

                  <label className="add-transaction-field">
                    <span>Repeat Until <em>(Optional)</em></span>
                    <input type="date" value={recurringEndDate} onChange={event => setRecurringEndDate(event.target.value)} />
                  </label>
                </div>
              ) : null}
            </div>
          ) : null}

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
              {saving ? "Saving..." : mode === "expense" ? (isEditing ? "Update Expense" : "Add Expense") : isEditing ? "Update Transaction" : "Save Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

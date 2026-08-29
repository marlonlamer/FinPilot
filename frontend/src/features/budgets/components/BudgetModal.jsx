import React, { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { EXPENSE_CATEGORIES } from "../../../constants/expenseCategories";
import "./BudgetModal.css";

function parseAmount(raw) {
  if (raw == null || raw === "") return NaN;
  const cleaned = String(raw).replace(/,/g, "").trim();
  return Number(cleaned);
}

export default function BudgetModal({
  open = false,
  mode = "create",
  initialValues = {},
  onClose = () => {},
  onSubmit = () => {},
  isSubmitting = false,
  currencySymbol = "₱",
}) {
  const isEdit = mode === "edit";
  const categoryRef = useRef(null);

  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState({});

  const categoryOptions = useMemo(() => {
    const initial = String(initialValues.category || "").trim();
    if (initial && !EXPENSE_CATEGORIES.some((c) => c.value === initial)) {
      return [{ value: initial, label: initial, icon: "📌" }, ...EXPENSE_CATEGORIES];
    }
    return EXPENSE_CATEGORIES;
  }, [initialValues.category]);

  useEffect(() => {
    if (!open) return;

    setCategory(String(initialValues.category || ""));
    setAmount(
      initialValues.amount != null && initialValues.amount !== ""
        ? String(initialValues.amount)
        : ""
    );
    setErrors({});

    const id = window.setTimeout(() => {
      categoryRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(id);
  }, [open, initialValues.category, initialValues.amount]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, isSubmitting, onClose]);

  if (!open) return null;

  const validate = () => {
    const next = {};
    if (!String(category || "").trim()) {
      next.category = "Select a category";
    }

    const num = parseAmount(amount);
    if (!String(amount || "").trim()) {
      next.amount = "Enter a monthly limit";
    } else if (!Number.isFinite(num) || num <= 0) {
      next.amount = "Enter a valid amount greater than 0";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;

    await onSubmit({
      category: String(category).trim(),
      amount: parseAmount(amount),
    });
  };

  const handleBackdropClick = (event) => {
    if (isSubmitting) return;
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div className="budget-modal-overlay" onClick={handleBackdropClick}>
      <div
        className="budget-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="budget-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="budget-modal-header">
          <div>
            <h2 id="budget-modal-title" className="budget-modal-title">
              {isEdit ? "Edit Budget" : "Add Budget"}
            </h2>
            <p className="budget-modal-subtitle">
              {isEdit ? "Update this category limit." : "Set a monthly spending limit."}
            </p>
          </div>
          <button
            type="button"
            className="budget-modal-close"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
          >
            <X size={22} strokeWidth={2.25} />
          </button>
        </header>

        <form className="budget-modal-form" onSubmit={handleSubmit} noValidate>
          <div className="budget-modal-body">
            <div className="budget-modal-field">
              <label className="budget-modal-label" htmlFor="budget-category">
                Category
              </label>
              <div className="budget-modal-select-wrap">
                <select
                  id="budget-category"
                  ref={categoryRef}
                  className={`budget-modal-select${errors.category ? " is-invalid" : ""}`}
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    if (errors.category) setErrors((prev) => ({ ...prev, category: "" }));
                  }}
                  disabled={isSubmitting}
                  required
                >
                  <option value="">Choose a category</option>
                  {categoryOptions.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.icon} {c.label}
                    </option>
                  ))}
                </select>
              </div>
              {errors.category ? <p className="budget-modal-error">{errors.category}</p> : null}
            </div>

            <div className="budget-modal-field">
              <label className="budget-modal-label" htmlFor="budget-amount">
                Monthly limit
              </label>
              <div className={`budget-modal-amount${errors.amount ? " is-invalid" : ""}`}>
                <span className="budget-modal-currency" aria-hidden="true">
                  {currencySymbol}
                </span>
                <input
                  id="budget-amount"
                  className="budget-modal-amount-input"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    const next = e.target.value.replace(/[^\d.,]/g, "");
                    setAmount(next);
                    if (errors.amount) setErrors((prev) => ({ ...prev, amount: "" }));
                  }}
                  disabled={isSubmitting}
                  required
                  aria-describedby="budget-amount-hint"
                />
              </div>
              <p id="budget-amount-hint" className="budget-modal-hint">
                How much you plan to spend in this category this month.
              </p>
              {errors.amount ? <p className="budget-modal-error">{errors.amount}</p> : null}
            </div>
          </div>

          <footer className="budget-modal-footer">
            <button
              type="button"
              className="budget-modal-btn budget-modal-btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="budget-modal-btn budget-modal-btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? isEdit
                  ? "Saving..."
                  : "Creating..."
                : isEdit
                  ? "Save Changes"
                  : "Create Budget"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

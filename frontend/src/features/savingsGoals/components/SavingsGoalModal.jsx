import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import "./SavingsGoalModal.css";

const CATEGORY_OPTIONS = [
  "Emergency Fund",
  "Vacation / Travel",
  "Car Purchase & Maintenance",
  "House / Property",
  "Wedding Fund",
  "Gadget & Tech Upgrade",
  "Education",
  "Medical / Health",
  "Business / Side Hustle",
  "Custom / Other"
];

const EMPTY_VALUES = {
  goalName: "",
  category: "",
  targetAmount: "",
  savedAmount: "",
  startDate: "",
  targetDate: "",
  notes: ""
};

export default function SavingsGoalModal({
  open = false,
  mode = "create",
  initialValues = EMPTY_VALUES,
  onClose = () => {},
  onSubmit = async () => {},
  isSubmitting = false,
  currencySymbol = "₱"
}) {
  const [values, setValues] = useState(() => ({ ...EMPTY_VALUES, ...initialValues }));
  const [errors, setErrors] = useState({});
  const nameRef = useRef(null);
  const isEdit = mode === "edit";

  useEffect(() => {
    if (!open) return;
    const focusTimer = window.setTimeout(() => nameRef.current?.focus(), 0);
    return () => window.clearTimeout(focusTimer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, isSubmitting, onClose]);

  if (!open) return null;

  const updateValue = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    const target = Number(values.targetAmount);
    const saved = Number(values.savedAmount || 0);

    if (!values.goalName.trim()) nextErrors.goalName = "Enter a goal name";
    if (!String(values.targetAmount).trim() || !Number.isFinite(target) || target <= 0) {
      nextErrors.targetAmount = "Enter an amount greater than 0";
    }
    if (String(values.savedAmount).trim() && (!Number.isFinite(saved) || saved < 0)) {
      nextErrors.savedAmount = "Enter a valid saved amount";
    } else if (saved > target) {
      nextErrors.savedAmount = "Saved amount cannot exceed the target";
    }
    if (!values.targetDate) nextErrors.targetDate = "Choose a target date";
    if (values.startDate && values.targetDate && values.targetDate < values.startDate) {
      nextErrors.targetDate = "Target date cannot be before the start date";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting || !validate()) return;
    await onSubmit({
      ...values,
      goalName: values.goalName.trim(),
      category: values.category.trim(),
      notes: values.notes.trim(),
      targetAmount: Number(values.targetAmount),
      savedAmount: values.savedAmount === "" ? 0 : Number(values.savedAmount)
    });
  };

  const handleBackdropClick = (event) => {
    if (!isSubmitting && event.target === event.currentTarget) onClose();
  };

  return (
    <div className="savings-goal-modal-overlay" onClick={handleBackdropClick}>
      <div className="savings-goal-modal" role="dialog" aria-modal="true" aria-labelledby="savings-goal-modal-title">
        <header className="savings-goal-modal-header">
          <div>
            <h2 id="savings-goal-modal-title">{isEdit ? "Edit Saving Goal" : "New Saving Goal"}</h2>
            <p>{isEdit ? "Update your saving goal." : "Plan something worth saving for."}</p>
          </div>
          <button type="button" className="savings-goal-modal-close" onClick={onClose} disabled={isSubmitting} aria-label="Close">
            <X size={21} strokeWidth={2.25} aria-hidden="true" />
          </button>
        </header>

        <form className="savings-goal-modal-form" onSubmit={handleSubmit} noValidate>
          <div className="savings-goal-modal-body">
            <div className="savings-goal-modal-field savings-goal-modal-field-full">
              <label htmlFor="savings-goal-name">Goal Name</label>
              <input id="savings-goal-name" ref={nameRef} type="text" value={values.goalName} onChange={(event) => updateValue("goalName", event.target.value)} placeholder="e.g. Emergency Fund, Japan Trip, New Laptop" disabled={isSubmitting} />
              {errors.goalName && <p className="savings-goal-modal-error">{errors.goalName}</p>}
            </div>

            <div className="savings-goal-modal-field savings-goal-modal-field-full">
              <label htmlFor="savings-goal-category">Category</label>
              <select id="savings-goal-category" value={values.category} onChange={(event) => updateValue("category", event.target.value)} disabled={isSubmitting}>
                <option value="">Choose a category</option>
                {CATEGORY_OPTIONS.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
              {errors.category && <p className="savings-goal-modal-error">{errors.category}</p>}
            </div>

            <div className="savings-goal-modal-field">
              <label htmlFor="savings-goal-target">Target Amount</label>
              <div className="savings-goal-modal-amount">
                <span aria-hidden="true">{currencySymbol}</span>
                <input id="savings-goal-target" type="number" min="0.01" step="0.01" value={values.targetAmount} onChange={(event) => updateValue("targetAmount", event.target.value)} placeholder="0.00" disabled={isSubmitting} />
              </div>
              {errors.targetAmount && <p className="savings-goal-modal-error">{errors.targetAmount}</p>}
            </div>

            <div className="savings-goal-modal-field">
              <label htmlFor="savings-goal-saved">Starting Saved Amount <span>(optional)</span></label>
              <div className="savings-goal-modal-amount">
                <span aria-hidden="true">{currencySymbol}</span>
                <input id="savings-goal-saved" type="number" min="0" step="0.01" value={values.savedAmount} onChange={(event) => updateValue("savedAmount", event.target.value)} placeholder="0.00" disabled={isSubmitting} />
              </div>
              {errors.savedAmount && <p className="savings-goal-modal-error">{errors.savedAmount}</p>}
            </div>

            <div className="savings-goal-modal-field">
              <label htmlFor="savings-goal-start">Start Date</label>
              <input id="savings-goal-start" type="date" value={values.startDate} onChange={(event) => updateValue("startDate", event.target.value)} disabled={isSubmitting} />
            </div>

            <div className="savings-goal-modal-field">
              <label htmlFor="savings-goal-target-date">Target Date</label>
              <input id="savings-goal-target-date" type="date" min={values.startDate || undefined} value={values.targetDate} onChange={(event) => updateValue("targetDate", event.target.value)} disabled={isSubmitting} required />
              {errors.targetDate && <p className="savings-goal-modal-error">{errors.targetDate}</p>}
            </div>

            <div className="savings-goal-modal-field savings-goal-modal-field-full">
              <label htmlFor="savings-goal-notes">Notes <span>(optional)</span></label>
              <textarea id="savings-goal-notes" rows="3" maxLength="500" value={values.notes} onChange={(event) => updateValue("notes", event.target.value)} placeholder="Add a note about this saving goal..." disabled={isSubmitting} />
            </div>
          </div>

          <footer className="savings-goal-modal-footer">
            <button type="button" className="savings-goal-modal-button savings-goal-modal-button-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="savings-goal-modal-button savings-goal-modal-button-primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Goal"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef, useCallback } from "react";
import "./BudgetModal.css";

const EXPENSE_CATEGORIES = [
  { value: "Food", label: "🍔 Food" },
  { value: "Transportation", label: "🚗 Transportation" },
  { value: "Rent", label: "🏠 Rent" },
  { value: "Shopping", label: "🛍️ Shopping" },
  { value: "Bills", label: "💡 Bills" },
  { value: "Health", label: "🩺 Health" },
  { value: "Entertainment", label: "🎬 Entertainment" },
  { value: "Education", label: "🎓 Education" },
  { value: "Other", label: "➕ Other" }
];

const EMPTY_INITIAL_DATA = {
  category: "",
  amount: "",
};

export default function BudgetModal({ 
  open, 
  mode = "create", 
  onClose, 
  onSubmit, 
  initialData = EMPTY_INITIAL_DATA,
  currencySymbol = "₱",
  isLoading = false
}) {
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
  });
  const [errors, setErrors] = useState({});
  const modalRef = useRef(null);
  const firstInputRef = useRef(null);
  const previousActiveElement = useRef(null);
  const initialDataRef = useRef(initialData);

  // Update ref when initialData changes
  useEffect(() => {
    initialDataRef.current = initialData;
  }, [initialData]);

  const handleClose = useCallback(() => {
    if (!isLoading) {
      onClose();
    }
  }, [isLoading, onClose]);

  useEffect(() => {
    if (open) {
      // Store the currently focused element for restoration later
      previousActiveElement.current = document.activeElement;
      
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        category: initialData.category || "",
        amount: initialData.amount || "",
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setErrors({});
      
      // Focus first input when modal opens
      setTimeout(() => {
        if (firstInputRef.current) {
          firstInputRef.current.focus();
        }
      }, 100);
    } else {
      // Restore focus when modal closes
      if (previousActiveElement.current && document.contains(previousActiveElement.current)) {
        previousActiveElement.current.focus();
      }
    }
  }, [open, initialData]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && open && !isLoading) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, isLoading, handleClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) {
      handleClose();
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.category || formData.category.trim() === "") {
      newErrors.category = "Category is required";
    }

    if (!formData.amount || formData.amount.trim() === "") {
      newErrors.amount = "Amount is required";
    } else {
      const num = parseFloat(formData.amount);
      if (isNaN(num)) {
        newErrors.amount = "Amount must be a valid number";
      } else if (num <= 0) {
        newErrors.amount = "Amount must be greater than 0";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    await onSubmit({
      category: formData.category.trim(),
      amount: parseFloat(formData.amount),
    });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const isEditMode = mode === "edit";
  const title = isEditMode ? "Edit Budget" : "Create Budget";
  const subtitle = isEditMode 
    ? "Update your monthly spending limit for this category."
    : "Set a monthly spending limit for a category.";
  const submitLabel = isEditMode ? "Save Changes" : "Create Budget";
  const loadingLabel = isEditMode ? "Saving..." : "Creating...";

  if (!open) return null;

  return (
    <div 
      className="budget-modal-overlay" 
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="budget-modal-title"
    >
      <div 
        className="budget-modal" 
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="budget-modal-header">
          <div className="budget-modal-title-section">
            <h2 id="budget-modal-title" className="budget-modal-title">{title}</h2>
            <p className="budget-modal-subtitle">{subtitle}</p>
          </div>
          <button 
            className="budget-modal-close" 
            onClick={handleClose}
            disabled={isLoading}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="budget-modal-form">
          <div className="budget-modal-field">
            <label htmlFor="category" className="budget-modal-label">
              Category
            </label>
            <select
              id="category"
              ref={firstInputRef}
              className="budget-modal-select"
              value={formData.category}
              onChange={(e) => handleChange("category", e.target.value)}
              disabled={isLoading}
              aria-invalid={!!errors.category}
              aria-describedby={errors.category ? "category-error" : undefined}
            >
              <option value="">Select category</option>
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <span id="category-error" className="budget-modal-error" role="alert">
                {errors.category}
              </span>
            )}
          </div>

          <div className="budget-modal-field">
            <label htmlFor="amount" className="budget-modal-label">
              Monthly Budget
            </label>
            <div className="budget-modal-input-wrapper">
              <span className="budget-modal-currency">{currencySymbol}</span>
              <input
                id="amount"
                type="number"
                className="budget-modal-input"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                disabled={isLoading}
                step="0.01"
                min="0"
                aria-invalid={!!errors.amount}
                aria-describedby={errors.amount ? "amount-error" : undefined}
              />
            </div>
            {errors.amount && (
              <span id="amount-error" className="budget-modal-error" role="alert">
                {errors.amount}
              </span>
            )}
          </div>

          <div className="budget-modal-footer">
            <button
              type="button"
              className="budget-modal-button budget-modal-button-secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="budget-modal-button budget-modal-button-primary"
              disabled={isLoading}
            >
              {isLoading ? loadingLabel : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
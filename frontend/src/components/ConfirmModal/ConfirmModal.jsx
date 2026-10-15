import React, { useEffect, useRef, useState } from "react";
import "./ConfirmModal.css";

export default function ConfirmModal({ open, message = "Are you sure?", onConfirm, onCancel, confirmLabel = "Delete", cancelLabel = "Cancel" }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!open) {
      setSubmitting(false);
      setError("");
      submittingRef.current = false;
    }
  }, [open]);

  if (!open) return null;

  const confirm = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError("");
    try {
      await onConfirm?.();
    } catch {
      setError("Unable to complete this action. Please try again.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={event => {
      if (event.target === event.currentTarget && !submitting) onCancel?.();
    }}>
      <div className="modal confirm-modal" role="dialog" aria-modal="true" onMouseDown={event => event.stopPropagation()}>
        <div className="confirm-message">{message}</div>
        {error ? <div className="confirm-error" role="alert">{error}</div> : null}
        <div className="modal-footer">
          <button type="button" className="btn" onClick={onCancel} disabled={submitting}>{cancelLabel}</button>
          <button type="button" className="btn btn-danger" onClick={confirm} disabled={submitting}>
            {submitting ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

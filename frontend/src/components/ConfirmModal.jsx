import React from "react";
import "./ConfirmModal.css";

export default function ConfirmModal({ open, message = "Are you sure?", onConfirm, onCancel, confirmLabel = "Delete", cancelLabel = "Cancel" }) {
  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal confirm-modal">
        <div className="confirm-message">{message}</div>
        <div className="modal-footer">
          <button className="btn" onClick={onCancel}>{cancelLabel}</button>
          <button className="btn btn-danger" onClick={() => { onConfirm && onConfirm(); }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

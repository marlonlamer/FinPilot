import React from "react";

export default function ConfirmModal({ open, message = "Are you sure?", onConfirm, onCancel, confirmLabel = "Delete", cancelLabel = "Cancel" }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-body">
          <div className="modal-message">{message}</div>
          <div className="modal-footer">
            <button className="btn" onClick={onCancel}>{cancelLabel}</button>
            <button className="btn btn-danger" onClick={() => { onConfirm && onConfirm(); }}>{confirmLabel}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from "react";

export default function ConfirmModal({ open, message = "Are you sure?", onConfirm, onCancel, confirmLabel = "Delete", cancelLabel = "Cancel" }) {
  if (!open) return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
      <div style={{ background: "#fff", padding: 18, borderRadius: 10, width: "90%", maxWidth: 420, boxShadow: "0 6px 20px rgba(0,0,0,0.12)" }}>
        <div style={{ marginBottom: 12, fontSize: 15, color: "#111" }}>{message}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="btn" onClick={onCancel}>{cancelLabel}</button>
          <button className="btn btn-danger" onClick={() => { onConfirm && onConfirm(); }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

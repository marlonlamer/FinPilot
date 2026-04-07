import React, { useState, useEffect } from "react";

export default function FormModal({ open, title = "", initialValues = {}, fields = [], onCancel, onSubmit, submitLabel = "Save" }) {
  const [values, setValues] = useState(initialValues || {});

  useEffect(() => {
    setValues(initialValues || {});
  }, [initialValues, open]);

  if (!open) return null;

  const handleChange = (name, v) => setValues(prev => ({ ...prev, [name]: v }));

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2200 }}>
      <div style={{ background: "#fff", padding: 18, borderRadius: 10, width: "95%", maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
          <button className="btn btn-ghost" onClick={onCancel}>✕</button>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {fields.map(f => (
            <div key={f.name}>
              {f.label ? <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#333" }}>{f.label}</label> : null}
              {f.type === "textarea" ? (
                <textarea value={values[f.name] ?? ""} onChange={e => handleChange(f.name, e.target.value)} placeholder={f.placeholder || ""} />
              ) : (
                <input
                  type={f.type || "text"}
                  value={values[f.name] ?? ""}
                  onChange={e => handleChange(f.name, f.type === 'number' ? e.target.value : e.target.value)}
                  placeholder={f.placeholder || ""}
                />
              )}
            </div>
          ))}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
            <button className="btn" onClick={onCancel}>Cancel</button>
            <button className="btn btn-primary" onClick={() => onSubmit(values)}>{submitLabel}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

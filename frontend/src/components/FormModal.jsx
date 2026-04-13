import React, { useState, useEffect } from "react";
import "./FormModal.css";

export default function FormModal({ open, title = "", initialValues = {}, fields = [], onCancel, onSubmit, submitLabel = "Save" }) {
  const [values, setValues] = useState(initialValues || {});

  useEffect(() => {
    setValues(initialValues || {});
  }, [initialValues, open]);

  if (!open) return null;

  const handleChange = (name, v) => setValues(prev => ({ ...prev, [name]: v }));

  return (
    <div className="modal-overlay">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="btn btn-ghost" onClick={onCancel}>✕</button>
        </div>

        <div className="form-grid">
          {fields.map(f => (
            <div key={f.name}>
              {f.label ? <label className="modal-label">{f.label}</label> : null}
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

          <div className="modal-footer">
            <button className="btn" onClick={onCancel}>Cancel</button>
            <button className="btn btn-primary" onClick={() => onSubmit(values)}>{submitLabel}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

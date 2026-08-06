import React, { useState, useEffect } from "react";
import { api, getCurrentUser, setCurrentUser } from "../../services/api";

export default function Profile() {
  const current = getCurrentUser() || {};
  const [name, setName] = useState(current.name || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    setName(current.name || "");
  }, [current.name]);

  const save = async () => {
    setError(null); setSuccess(null);
    if (!name || String(name).trim() === "") return setError("Name cannot be empty");
    setSaving(true);
    try {
      const resp = await api.put('/user/profile', { name: String(name).trim() });
      // update local currentUser
      const next = { ...(current || {}), name: resp.name };
      try { setCurrentUser(next); } catch {}
      setSuccess("Profile updated");
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2>Profile</h2>
      <div style={{ maxWidth: 480 }}>
        <label className="label-block">Name</label>
        <input className="modern-input" value={name} onChange={e => setName(e.target.value)} />
        <div style={{ marginTop: 8 }}>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          {error && <div className="text-error" style={{ marginTop: 8 }}>{error}</div>}
          {success && <div className="text-success" style={{ marginTop: 8 }}>{success}</div>}
        </div>
      </div>
    </div>
  );
}
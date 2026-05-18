import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setCurrentUser } from "../../services/api";
import "./AuthModule.css";

export default function Register({ onAuthSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.post("/auth/register", { name, email, password });
      const token = res.token || res?.data?.token;
      const user = res.user || (res.id && res.email ? { id: res.id, email: res.email, name: res.name, availableBalance: res.availableBalance || 0, monthlyBudget: res.monthlyBudget || 0, monthlySpent: res.monthlySpent || 0 } : null);
      if (token) {
        try { localStorage.setItem("token", token); } catch {}
        if (user) setCurrentUser(user);
        if (typeof onAuthSuccess === "function") onAuthSuccess(token);
        try {
          navigate("/", { replace: true });
        } catch (e) {
          setTimeout(() => { window.location.href = '/'; }, 50);
        }
        return;
      }

      // fallback: no token returned — show message and go to login
      setSuccess("Registered successfully. You can now log in.");
      try {
        navigate("/login", { replace: true });
      } catch (e) {
        setTimeout(() => { window.location.href = '/login'; }, 50);
      }
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <h2>Register</h2>
      <form className="auth-form" onSubmit={submit}>
        <label>Name</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} required />
        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <label>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}
        <div className="auth-actions">
          <button className="btn btn-primary" disabled={loading}>{loading ? "Registering..." : "Create Account"}</button>
        </div>
      </form>
    </div>
  );
}

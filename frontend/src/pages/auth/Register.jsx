import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import "./AuthModule.css";

export default function Register({ onAuthSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
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
      const res = await api.post("/auth/register", { email, password });
      setSuccess("Registered successfully. You can now log in.");
      const token = res.token || res?.data?.token;
      if (token) {
        try { localStorage.setItem("token", token); } catch {}
        if (typeof onAuthSuccess === "function") onAuthSuccess(token);
      }
      navigate("/login");
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

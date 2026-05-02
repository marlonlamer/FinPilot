import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import "./AuthModule.css";

export default function Login({ onAuthSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/auth/login", { email, password });
      const token = res.token || res?.data?.token;
      if (token) {
        try { localStorage.setItem("token", token); } catch {}
        if (typeof onAuthSuccess === "function") onAuthSuccess(token);
        try {
          navigate("/", { replace: true });
        } catch (e) {
          setTimeout(() => { window.location.href = '/'; }, 50);
        }
      } else {
        setError("No token returned from server");
      }
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <h2>Login</h2>
      <form className="auth-form" onSubmit={submit}>
        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <label>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        {error && <div className="auth-error">{error}</div>}
        <div className="auth-actions">
          <button className="btn btn-primary" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</button>
        </div>
      </form>
      <div className="auth-footer">
        Don't have an account? <Link to="/register">Register here</Link>
      </div>
    </div>
  );
}

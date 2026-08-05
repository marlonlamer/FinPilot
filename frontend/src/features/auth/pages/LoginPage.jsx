import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setCurrentUser } from "../../../services/api";
import AuthHeader from "../components/AuthHeader";
import AuthFooter from "../components/AuthFooter";
import AuthSubmitButton from "../components/AuthSubmitButton";
import "./AuthModule.css";

export default function LoginPage({ onAuthSuccess }) {
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
      <AuthHeader title="Login" />
      <form className="auth-form" onSubmit={submit}>
        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <label>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        {error && <div className="auth-error">{error}</div>}
        <div className="auth-actions">
          <AuthSubmitButton loading={loading} buttonText={loading ? "Signing in..." : "Sign In"} />
        </div>
      </form>
      <AuthFooter text="Don't have an account?" linkTo="/register" linkLabel="Register here" />
    </div>
  );
}

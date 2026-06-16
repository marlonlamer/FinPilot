import React from "react";
import { NavLink } from "react-router-dom";

const linkStyle = ({ isActive }) => ({
  display: "block",
  padding: "10px 12px",
  color: isActive ? "#fff" : "#222",
  background: isActive ? "#1976d2" : "transparent",
  textDecoration: "none",
  borderRadius: 6,
  marginBottom: 6
});

export default function Sidebar() {
  return (
    <aside style={{ width: 220, padding: 16, borderRight: "1px solid #eee", background: "#fafafa" }}>
      <h3 style={{ margin: "0 0 12px 0" }}>Finance</h3>
      <nav>
        <NavLink to="/" style={linkStyle} end>Dashboard</NavLink>
        <NavLink to="/transactions" style={linkStyle}>Transactions</NavLink>
        <NavLink to="/income" style={linkStyle}>Income</NavLink>
        <NavLink to="/expenses" style={linkStyle}>Expenses</NavLink>
        <NavLink to="/savings" style={linkStyle}>Savings</NavLink>
        <NavLink to="/reports" style={linkStyle}>Reports</NavLink>
        <NavLink to="/profile" style={linkStyle}>Profile</NavLink>
        <NavLink to="/settings" style={linkStyle}>Settings</NavLink>
      </nav>
    </aside>
  );
}

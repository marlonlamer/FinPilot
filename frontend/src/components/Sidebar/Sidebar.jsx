import React from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const linkStyle = ({ isActive }) => ({
  display: "block",
  padding: "10px 12px",
  color: isActive ? "#fff" : "#222",
  background: isActive ? "#1976d2" : "transparent",
  textDecoration: "none",
  borderRadius: 6,
  marginBottom: 6
});


export default function Sidebar({
      isOpen,
      onClose
  }) {

  const handleLinkClick = () => {
    if (window.innerWidth <= 900) {
      onClose?.();  
    }
  };
  return (
    <aside 
      className={`sidebar ${isOpen ? "open" : ""}`}
    >
      <h3 className="sidebar-title">
        FinPilot
      </h3>
      <button
        className="sidebar-close"
        onClick={onClose}
      >
        ✕
      </button>
      <nav>
        <NavLink to="/" style={linkStyle} end onClick={handleLinkClick}>
          Dashboard
        </NavLink>
        <NavLink to="/transactions" style={linkStyle} onClick={handleLinkClick}>
          Transactions
        </NavLink>
        <NavLink to="/income" style={linkStyle} onClick={handleLinkClick}>
          Income
        </NavLink>
        <NavLink to="/expenses" style={linkStyle} onClick={handleLinkClick}>
          Expenses
        </NavLink>
        <NavLink to="/savings" style={linkStyle} onClick={handleLinkClick}>
          Savings
        </NavLink>
        <NavLink to="/reports" style={linkStyle} onClick={handleLinkClick}>
          Reports
        </NavLink>
        <NavLink to="/profile" style={linkStyle} onClick={handleLinkClick}>
          Profile
        </NavLink>
        <NavLink to="/settings" style={linkStyle} onClick={handleLinkClick}>
          Settings
        </NavLink>
      </nav>
    </aside>
  );
}

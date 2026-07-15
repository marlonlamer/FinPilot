import React from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  TrendingDown,
  PiggyBank,
  BarChart3,
  User,
  Settings,
  X
} from "lucide-react";

const menuItems = [
  {
    label: "Dashboard",
    path: "/",
    icon: LayoutDashboard
  },
  {
    label: "Transactions",
    path: "/transactions",
    icon: Receipt
  },
  {
    label: "Income",
    path: "/income",
    icon: Wallet
  },
  {
    label: "Expenses",
    path: "/expenses",
    icon: TrendingDown
  },
  {
    label: "Savings",
    path: "/savings",
    icon: PiggyBank
  },
  {
    label: "Reports",
    path: "/reports",
    icon: BarChart3
  },
  {
    label: "Profile",
    path: "/profile",
    icon: User
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings
  }
];

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
      <div className="sidebar-header">
          <div>
              <h2 className="sidebar-title">FinPilot</h2>

              <p className="sidebar-subtitle">
                  Personal Finance Tracker
              </p>
          </div>
          <button
              className="sidebar-close"
              onClick={onClose}
          >
            <X size={20}/>
          </button>
      </div>
      <nav className="sidebar-nav">

      {menuItems.map(item => {
        const Icon=item.icon;

        return(
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
             className={({isActive})=>
                `sidebar-link ${
                    isActive ? "active":""
                }`
            }
            onClick={handleLinkClick}
          >
            <Icon size={20}/>

            <span>
                {item.label}
            </span>
          </NavLink>
        );
      })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-balance">
            <p className="balance-label">
                Available Balance
            </p>
            <h3>
                ₱73,500
            </h3>
        </div>
      </div>
    </aside>
  );
}

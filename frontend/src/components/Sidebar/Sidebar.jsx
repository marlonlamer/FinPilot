import React from "react";
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
  Target,
  Landmark
} from "lucide-react";
import SidebarHeader from "./SidebarHeader";
import SidebarNavigation from "./SidebarNavigation";
import SidebarFooter from "./SidebarFooter";

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
    label: "Budgets",
    path: "/budget",
    icon: Target
  },
  {
    label: "Debt & bills",
    path: "/debt-bills",
    icon: Landmark
  },
  {
    label: "Savings & Goals",
    path: "/savings",
    icon: PiggyBank
  },
  {
    label: "Analytics",
    path: "/analytics",
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
      <SidebarHeader onClose={onClose} />

      <SidebarNavigation items={menuItems} onLinkClick={handleLinkClick} />

      <SidebarFooter />
    </aside>
  );
}

import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import Navbar from "../components/Navbar/Navbar";
import "./AppLayout.css";

export default function AppLayout(props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { logout } = props;

  useEffect(() => {
    if (!isSidebarOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const mainContent = document.querySelector(".app-main");
    const previousMainOverflow = mainContent?.style.overflow;
    document.body.style.overflow = "hidden";
    if (mainContent) mainContent.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      if (mainContent) mainContent.style.overflow = previousMainOverflow;
    };
  }, [isSidebarOpen]);

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />  
      {isSidebarOpen && (
          <div
            className="sidebar-overlay"
            onClick={() => setIsSidebarOpen(false)}
          />
      )}
      <div className="app-content">
        <Navbar logout={logout}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

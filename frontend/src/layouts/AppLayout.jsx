import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import Navbar from "../components/Navbar/Navbar";
import "./AppLayout.css";

export default function AppLayout(props) {
  const { monthNames, selectedMonth, setSelectedMonth, selectedYear, setSelectedYear, dateFilter, setDateFilter, authToken, logout } = props;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-content">
        <Navbar monthNames={monthNames} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} selectedYear={selectedYear} setSelectedYear={setSelectedYear} dateFilter={dateFilter} setDateFilter={setDateFilter} authToken={authToken} logout={logout} />
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

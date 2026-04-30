import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import Navbar from "../components/Navbar/Navbar";

export default function AppLayout(props) {
  const { monthNames, selectedMonth, setSelectedMonth, selectedYear, setSelectedYear, dateFilter, setDateFilter, authToken, logout } = props;

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: 'sans-serif' }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Navbar monthNames={monthNames} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} selectedYear={selectedYear} setSelectedYear={setSelectedYear} dateFilter={dateFilter} setDateFilter={setDateFilter} authToken={authToken} logout={logout} />
        <main style={{ padding: 16, flex: 1, overflow: "auto" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

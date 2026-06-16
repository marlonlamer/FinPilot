import React from "react";

export default function Navbar({ monthNames = [], selectedMonth, setSelectedMonth, selectedYear, setSelectedYear, authToken, logout }) {
  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  return (
    <header style={{ padding: 12, borderBottom: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={prevMonth} style={{ padding: "6px 10px" }}>{"<"}</button>
        <div style={{ minWidth: 160, textAlign: "center", fontWeight: 600 }}>{monthNames[selectedMonth] || ""} {selectedYear}</div>
        <button onClick={nextMonth} style={{ padding: "6px 10px" }}>{">"}</button>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ fontSize: 14, color: "#555" }}>{authToken ? "Signed in" : "Guest"}</div>
        <button onClick={logout} style={{ padding: "6px 10px" }}>Logout</button>
      </div>
    </header>
  );
}

import React from "react";
import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: 420, maxWidth: "100%", background: "#fff", padding: 24, borderRadius: 8, boxShadow: "0 6px 18px rgba(0,0,0,0.06)" }}>
        <Outlet />
      </div>
    </div>
  );
}

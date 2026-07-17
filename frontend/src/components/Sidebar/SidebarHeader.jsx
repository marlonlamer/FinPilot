import React from "react";
import { X } from "lucide-react";

export default function SidebarHeader({ onClose }) {
  return (
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
  );
}

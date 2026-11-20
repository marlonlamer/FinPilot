import React from "react";
import { X } from "lucide-react";

export default function SidebarHeader({ onClose }) {
  return (
    <div className="sidebar-header">
      <div>
        <h2 className="sidebar-title">FinPilot</h2>
        <h2 className="sidebar-mobile-title">Navigation</h2>

        <p className="sidebar-subtitle">
            Personal Finance Tracker
        </p>
      </div>
      <button
          className="sidebar-close"
          onClick={onClose}
          type="button"
          aria-label="Close navigation menu"
      >
        <X size={20} aria-hidden="true" />
      </button>
    </div>
  );
}

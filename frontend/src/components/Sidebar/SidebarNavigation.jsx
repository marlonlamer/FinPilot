import React from "react";
import SidebarMenuItem from "./SidebarMenuItem";

export default function SidebarNavigation({ items, onLinkClick }) {
  return (
    <nav className="sidebar-nav">
      {items.map(item => (
        <SidebarMenuItem key={item.path} item={item} onLinkClick={onLinkClick} />
      ))}
    </nav>
  );
}

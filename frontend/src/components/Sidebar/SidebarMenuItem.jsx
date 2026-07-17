import React from "react";
import { NavLink } from "react-router-dom";

export default function SidebarMenuItem({ item, onLinkClick }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      end={item.path === "/"}
      className={({isActive})=>
         `sidebar-link ${isActive ? "active":""}`
      }
      onClick={onLinkClick}
    >
      <Icon size={20}/>

      <span>
          {item.label}
      </span>
    </NavLink>
  );
}

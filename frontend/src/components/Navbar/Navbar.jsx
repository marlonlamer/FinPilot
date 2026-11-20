import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { getCurrentUser } from "../../services/api";
import "./Navbar.css";

export default function Navbar({ logout, onMenuClick }) {
  const navigate = useNavigate();
  const navbarRef = useRef(null);
  const profileTriggerRef = useRef(null);
  const closeTimerRef = useRef(null);
  const [isProfileMenuMounted, setIsProfileMenuMounted] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const user = getCurrentUser();
  const displayName = user?.name?.trim() || user?.email || "My Account";
  const initials = user?.name?.trim()
    ? user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
    : null;

  const closeProfileMenu = () => setIsProfileMenuOpen(false);

  const toggleProfileMenu = () => {
    if (isProfileMenuOpen) {
      closeProfileMenu();
      return;
    }

    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsProfileMenuMounted(true);
    requestAnimationFrame(() => setIsProfileMenuOpen(true));
  };

  useEffect(() => {
    if (isProfileMenuOpen) {
      const handlePointerDown = (event) => {
        if (!navbarRef.current?.contains(event.target)) closeProfileMenu();
      };
      const handleKeyDown = (event) => {
        if (event.key === "Escape") {
          closeProfileMenu();
          profileTriggerRef.current?.focus();
        }
      };
      document.addEventListener("pointerdown", handlePointerDown);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("pointerdown", handlePointerDown);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }

    if (isProfileMenuMounted) {
      closeTimerRef.current = setTimeout(() => setIsProfileMenuMounted(false), 140);
    }

    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [isProfileMenuOpen, isProfileMenuMounted]);

  const handleLogout = () => {
    closeProfileMenu();
    logout?.();
    navigate("/login", { replace: true });
  };

  return (
    <header className="navbar">
      <button
        className="menu-button"
        onClick={onMenuClick}
        type="button"
        aria-label="Open navigation menu"
      >
        ☰
      </button>
      <div className="navbar-profile" ref={navbarRef}>
        <button
          ref={profileTriggerRef}
          className="navbar-profile-trigger"
          type="button"
          onClick={toggleProfileMenu}
          aria-label="Open profile menu"
          aria-haspopup="menu"
          aria-expanded={isProfileMenuOpen}
          aria-controls="navbar-profile-menu"
        >
          <span className="navbar-profile-avatar" aria-hidden="true">
            {initials || <UserRound size={20} />}
          </span>
          <ChevronDown className="navbar-profile-chevron" size={15} aria-hidden="true" />
        </button>
        {isProfileMenuMounted ? (
          <div
            id="navbar-profile-menu"
            className={`navbar-profile-menu${isProfileMenuOpen ? " is-open" : ""}`}
            role="menu"
            aria-label="Profile menu"
            aria-hidden={!isProfileMenuOpen}
          >
            <div className="navbar-profile-menu-header">
              <span className="navbar-profile-menu-avatar" aria-hidden="true">
                {initials || <UserRound size={19} />}
              </span>
              <span className="navbar-profile-menu-user">
                <strong>{displayName}</strong>
                <small>My Account</small>
              </span>
            </div>
            <Link
              to="/profile"
              className="navbar-profile-menu-item"
              role="menuitem"
              onClick={closeProfileMenu}
            >
              <UserRound size={17} aria-hidden="true" />
              <span>View Profile</span>
            </Link>
            <button
              type="button"
              className="navbar-profile-menu-item"
              role="menuitem"
              onClick={handleLogout}
            >
              <LogOut size={17} aria-hidden="true" />
              <span>Logout</span>
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}

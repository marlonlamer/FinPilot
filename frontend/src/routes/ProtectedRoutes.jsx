import React from "react";
import { Navigate, Outlet } from "react-router-dom";

/**
 * ProtectedRoute
 * - Reads a JWT token from localStorage (defensive)
 * - If token found -> renders nested routes (<Outlet />)
 * - If not -> redirects to /login
 */
export default function ProtectedRoute() {
	let token = null;
	try {
		token = localStorage.getItem("token");
	} catch (e) {
		token = null;
	}

	if (!token) return <Navigate to="/login" replace />;
	return <Outlet />;
}
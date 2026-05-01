import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AppLayout from "../layouts/AppLayout";
import AuthLayout from "../layouts/AuthLayout";

import Dashboard from "../pages/Dashboard/Dashboard";
import Expenses from "../pages/Expenses/Expenses";
import Income from "../pages/Income/Income";
import Transactions from "../pages/Transactions/Transactions";
import Reports from "../pages/Reports/Reports";
import Profile from "../pages/Profile/Profile";
import Settings from "../pages/Settings/Settings";
import Savings from "../pages/Savings/Savings";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ProtectedRoute from "./ProtectedRoutes";

export default function AppRoutes() {
	return (
		<BrowserRouter>
			<Routes>
				{/* Public/auth routes */}
				<Route element={<AuthLayout />}>
					<Route path="/login" element={<Login />} />
					<Route path="/register" element={<Register />} />
				</Route>

				{/* Protected app routes */}
				<Route element={<ProtectedRoute />}>
					<Route element={<AppLayout />}>
						<Route index element={<Dashboard />} />
						<Route path="expenses" element={<Expenses />} />
						<Route path="income" element={<Income />} />
						<Route path="transactions" element={<Transactions />} />
						<Route path="reports" element={<Reports />} />
						<Route path="profile" element={<Profile />} />
						<Route path="settings" element={<Settings />} />
						<Route path="savings" element={<Savings />} />
					</Route>
				</Route>

				{/* Fallback: redirect unknown paths to app root */}
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</BrowserRouter>
	);
}
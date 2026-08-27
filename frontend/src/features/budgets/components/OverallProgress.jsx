import React from "react";
import { CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react";
import "./OverallProgress.css";

function displayAmount(value, formatCurrency, currencySymbol) {
  if (value == null || !Number.isFinite(Number(value))) {
    return "Not set";
  }

  if (formatCurrency) {
    const formatted = formatCurrency(value);
    if (formatted) return formatted;
  }

  return `${currencySymbol}${Number(value).toFixed(2)}`;
}

export default function BudgetHealth({
  monthlyBudget,
  percentBudgetUsed,
  budgetRemaining,
  selectedYear,
  selectedMonth,
  currencySymbol = "₱",
  formatCurrency,
}) {
  const totalBudget = monthlyBudget == null || monthlyBudget === "" ? null : Number(monthlyBudget);
  const remaining = budgetRemaining == null || budgetRemaining === "" ? null : Number(budgetRemaining);
  const hasBudget = Number.isFinite(totalBudget) && totalBudget > 0;
  const hasRemaining = Number.isFinite(remaining);
  const totalSpent = hasBudget && hasRemaining ? totalBudget - remaining : 0;
  const isOverspent = hasRemaining && remaining < 0;

  const usagePercent = typeof percentBudgetUsed === "number"
    ? percentBudgetUsed
    : hasBudget && totalBudget > 0
      ? (totalSpent / totalBudget) * 100
      : null;

  // Calculate month progress for intelligent insights
  const getMonthProgress = () => {
    if (selectedYear == null || selectedMonth == null) return null;
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    if (currentYear !== selectedYear || currentMonth !== selectedMonth) return null;
    
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const currentDay = now.getDate();
    const monthProgress = (currentDay / daysInMonth) * 100;
    
    return monthProgress;
  };

  const monthProgress = getMonthProgress();

  // Determine health state and messaging
  let healthState = "neutral";
  let icon = <Info size={20} strokeWidth={2} />;
  let title = "No monthly budget yet";
  let message = "Set a budget to start tracking your spending progress.";
  let detail = null;
  let accentColor = "#6b7280";

  if (hasBudget) {
    if (isOverspent) {
      healthState = "overspent";
      icon = <AlertCircle size={20} strokeWidth={2} />;
      title = "You're over budget";
      message = `You've exceeded your monthly budget by ${displayAmount(Math.abs(remaining), formatCurrency, currencySymbol)}.`;
      detail = "Review your category spending to see where you can adjust.";
      accentColor = "#ef4444";
    } else if (usagePercent >= 90) {
      healthState = "critical";
      icon = <AlertTriangle size={20} strokeWidth={2} />;
      title = "Watch your spending";
      message = `You've used ${Math.round(usagePercent)}% of your monthly budget.`;
      
      // Add intelligent insight about month progress
      if (monthProgress != null && monthProgress < 50) {
        message = `You've used ${Math.round(usagePercent)}% of your budget with about half the month remaining.`;
        detail = "Your spending pace is higher than expected.";
      } else {
        detail = "Consider slowing down spending for the rest of the month.";
      }
      accentColor = "#f59e0b";
    } else if (usagePercent >= 70) {
      healthState = "warning";
      icon = <AlertTriangle size={20} strokeWidth={2} />;
      title = "Watch your spending";
      message = `You've used ${Math.round(usagePercent)}% of your monthly budget.`;
      
      if (monthProgress != null && monthProgress < 50) {
        message = `You've used ${Math.round(usagePercent)}% of your budget with about half the month remaining.`;
        detail = "Your spending pace is higher than expected.";
      } else {
        detail = "You have room to adjust your spending pace.";
      }
      accentColor = "#fbbf24";
    } else {
      healthState = "healthy";
      icon = <CheckCircle size={20} strokeWidth={2} />;
      title = "You're on track";
      message = `You've used ${Math.round(usagePercent)}% of your monthly budget.`;
      
      const remainingPercent = Math.round(100 - usagePercent);
      detail = `${remainingPercent}% of your budget remains (${displayAmount(remaining, formatCurrency, currencySymbol)} available).`;
      accentColor = "#10b981";
    }
  }

  return (
    <section className="budget-health" aria-label="Budget health insights">
      <div className="budget-health-content">
        <div className="budget-health-header">
          <div className={`budget-health-icon budget-health-icon--${healthState}`} style={{ color: accentColor }}>
            {icon}
          </div>
          <div className="budget-health-text">
            <h3 className="budget-health-title">{title}</h3>
            <p className="budget-health-message">{message}</p>
          </div>
        </div>
        
        {detail && (
          <div className="budget-health-detail">
            {detail}
          </div>
        )}
      </div>
    </section>
  );
}
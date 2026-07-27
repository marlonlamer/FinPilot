import React from "react";

export default function BudgetSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Summary card skeleton */}
      <div className="budget-card">
        <div className="card-label">
          <span className="bg-gray-200 rounded w-24 h-4 inline-block"></span>
        </div>

        <div className="card-value mt-1">
          <span className="bg-gray-200 rounded w-32 h-8 inline-block"></span>
        </div>

        <div className="budget-progress-block mt-3">
          <div className="progress-track">
            <div className="h-full bg-gray-200" style={{ width: "40%" }}></div>
          </div>
          <div className="progress-subtext mt-2">
            <span className="bg-gray-200 rounded w-1/3 h-3 inline-block"></span>
          </div>
        </div>
      </div>

      {/* Budgets by Category skeleton */}
      <div className="budget-card small">
        <div className="card-label">
          <span className="bg-gray-200 rounded w-32 h-4 inline-block"></span>
        </div>

        <div className="budget-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="budget-category-card">
              <div className="budget-row-header">
                <div className="budget-name">
                  <span className="bg-gray-200 rounded w-28 h-4 inline-block"></span>
                </div>
                <div className="category-actions">
                  <span className="bg-gray-200 rounded w-8 h-8 inline-block"></span>
                </div>
              </div>

              <div className="budget-amount mt-2">
                <span className="bg-gray-200 rounded w-20 h-3 inline-block"></span>
              </div>

              <div className="budget-progress mt-3">
                <div className="progress-track">
                  <div className="h-full bg-gray-200" style={{ width: "60%" }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
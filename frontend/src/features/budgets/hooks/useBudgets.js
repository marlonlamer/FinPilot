import { useState, useCallback } from "react";
import { budgetService } from "../services/budgetServices";

const MIN_SKELETON_MS = 400;

export function useBudgets({selectedYear, selectedMonth}) {
  const [perCategoryBudgets, setPerCategoryBudgets] = useState({});
  const [budgetsMeta, setBudgetsMeta] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const monthKey = `${selectedYear}-${String((selectedMonth || 0) + 1).padStart(2, "0")}`;

  const applyBudgets = ({ budgets, meta }) => {
    setPerCategoryBudgets(budgets);
    setBudgetsMeta(meta);
  };

  const loadBudgets = useCallback(async ({ silent = false } = {}) => {
    const startTime = Date.now();
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const list = await budgetService.getBudgets(monthKey);
      const { budgets, meta } = budgetService.mapBudgets(list);
      applyBudgets({
        budgets,
        meta,
      });
      if (silent) setError(null);
    } catch (err) {
      if (!silent) {
        setError(err.message || "Failed to load budgets");
      } else {
        console.warn("Failed to refresh budgets", err);
      }
    } finally {
      if (!silent) {
        const elapsed = Date.now() - startTime;
        const delay = MIN_SKELETON_MS - elapsed;
        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
        setIsLoading(false);
      }
    }
  }, [monthKey]);

  return {
    perCategoryBudgets,
    budgetsMeta,
    loadBudgets,
    applyBudgets,
    monthKey,
    isLoading,
    error,
  };
}
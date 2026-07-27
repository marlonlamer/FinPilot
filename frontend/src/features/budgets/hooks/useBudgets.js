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

  const loadBudgets = useCallback(async () => {
    const startTime = Date.now();
    setIsLoading(true);
    setError(null);

    try {
      const list = await budgetService.getBudgets(monthKey);
      const { budgets, meta } = budgetService.mapBudgets(list);
      applyBudgets({
        budgets,
        meta,
      });
    } catch (err) {
      setError(err.message || "Failed to load budgets");
    } finally {
      const elapsed = Date.now() - startTime;
      const delay = MIN_SKELETON_MS - elapsed;
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
      setIsLoading(false);
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
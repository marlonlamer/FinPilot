import { useState } from "react";
import { budgetService } from "../services/budgetServices";

export function useBudgets({selectedYear, selectedMonth}) {
  const [perCategoryBudgets, setPerCategoryBudgets] = useState({});
  const [budgetsMeta, setBudgetsMeta] = useState({});

  const monthKey = `${selectedYear}-${String((selectedMonth || 0) + 1).padStart(2, "0")}`;

  const applyBudgets = ({ budgets, meta }) => {
    setPerCategoryBudgets(budgets);
    setBudgetsMeta(meta);
  };

  const loadBudgets = async () => {
    const list = await budgetService.getBudgets(monthKey);
      
    const { budgets, meta } = budgetService.mapBudgets(list);
      
    applyBudgets({
      budgets, 
      meta 
    });
  };

  return {
    perCategoryBudgets,
    budgetsMeta,
    loadBudgets,
    applyBudgets,
    monthKey,
  };
}
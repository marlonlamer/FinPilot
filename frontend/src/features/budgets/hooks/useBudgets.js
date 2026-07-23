import { useState } from "react";

export function useBudgets() {
  const [perCategoryBudgets, setPerCategoryBudgets] = useState({});
  const [budgetsMeta, setBudgetsMeta] = useState({});

  const applyBudgets = ({ budgets, meta }) => {
    setPerCategoryBudgets(budgets);
    setBudgetsMeta(meta);
};

  return {
    perCategoryBudgets,
    budgetsMeta,
    applyBudgets,
  };
}
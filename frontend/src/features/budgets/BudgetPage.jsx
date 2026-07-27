import BudgetOverview from "./components/BudgetOverview";
import { useBudgets } from "./hooks/useBudgets";
import { useEffect } from "react";

export default function BudgetPage(props) {
  const {
    perCategoryBudgets,
    budgetsMeta,
    loadBudgets,
    isLoading,
    error,
  } = useBudgets({
    selectedYear: props.selectedYear,
    selectedMonth: props.selectedMonth,
  });

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  return (
    <BudgetOverview
      {...props}
      budgets={perCategoryBudgets}
      budgetsMeta={budgetsMeta}
      isLoading={isLoading}
      error={error}
    />
  );
}
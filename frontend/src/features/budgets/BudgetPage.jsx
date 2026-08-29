import BudgetOverview from "./components/BudgetOverview";
import { useBudgets } from "./hooks/useBudgets";
import { budgetService } from "./services/budgetServices";
import { useEffect, useMemo } from "react";

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

  const totals = useMemo(
    () => budgetService.totalsFromBudgets(perCategoryBudgets, budgetsMeta),
    [perCategoryBudgets, budgetsMeta]
  );

  const handleBudgetsUpdated = async () => {
    await loadBudgets({ silent: true });
    if (typeof props.onBudgetsUpdated === "function") {
      await props.onBudgetsUpdated();
    }
  };

  return (
    <BudgetOverview
      {...props}
      budgets={perCategoryBudgets}
      budgetsMeta={budgetsMeta}
      monthlyBudget={totals.totalBudget}
      budgetRemaining={totals.totalRemaining}
      percentBudgetUsed={totals.percentUsed}
      isLoading={isLoading}
      error={error}
      onBudgetsUpdated={handleBudgetsUpdated}
    />
  );
}

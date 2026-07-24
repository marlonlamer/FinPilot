import BudgetOverview from "./components/BudgetOverview";
import { useBudgets } from "./hooks/useBudgets";

export default function BudgetPage(props) {
  const {
    perCategoryBudgets,
    budgetsMeta,
    loadBudgets,
  } = useBudgets({
    selectedYear: props.selectedYear,
    selectedMonth: props.selectedMonth,
  });

  return (
    <BudgetOverview
      {...props}
      budgets={perCategoryBudgets}
      budgetsMeta={budgetsMeta}
    />
  );
}
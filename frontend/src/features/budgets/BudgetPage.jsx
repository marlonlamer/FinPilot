import BudgetOverview from "./components/BudgetOverview";
import { useBudgets } from "./hooks/useBudgets";

export default function BudgetPage(props) {
  const {
    budgets,
    budgetsMeta,
  } = useBudgets();

  return (
    <BudgetOverview
      {...props}
      budgets={budgets}
      budgetsMeta={budgetsMeta}
    />
  );
}
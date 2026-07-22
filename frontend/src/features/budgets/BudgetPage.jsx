import BudgetOverview from "./components/BudgetOverview";
import { useBudgets } from "./hooks/useBudgets";

export default function BudgetPage(props) {
  useBudgets();

  return (
    <BudgetOverview
      {...props}
    />
  );
}
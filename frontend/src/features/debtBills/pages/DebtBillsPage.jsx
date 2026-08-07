import DebtBillsHeader from "../components/DebtBillsHeader";
import DebtBillsSummary from "../components/DebtBillsSummary";
import DebtBillFilters from "../components/DebtBillFilters";
import DebtBillList from "../components/DebtBillList";
import "../styles/DebtBillsModule.css";

const summaryCards = [
  { label: "Total debt", value: "$48,320.00", note: "All open balances" },
  { label: "Outstanding", value: "$39,120.00", note: "Remaining repayment" },
  { label: "Overdue", value: "$1,840.00", note: "Past due amount" },
  { label: "Next payment", value: "$620.00", note: "Due in 5 days" },
];

export default function DebtBillsPage() {
  return (
    <div className="debt-bills-root">
      <DebtBillsHeader title="Debt & Bills" subtitle="Track loans, credit cards, and recurring payments in one place." />
      <DebtBillsSummary cards={summaryCards} />

      <section className="debt-section">
        <h2>Debt Tracker</h2>
        <DebtBillFilters />
        <DebtBillList />
      </section>

      <section className="debt-section">
        <h2>Bills & Subscriptions</h2>
        <DebtBillFilters />
        <DebtBillList />
      </section>
    </div>
  );
}

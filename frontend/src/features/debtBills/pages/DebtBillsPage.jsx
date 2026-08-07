import { useState } from "react";
import DebtBillsHeader from "../components/DebtBillsHeader";
import DebtBillsSummary from "../components/DebtBillsSummary";
import DebtBillList from "../components/DebtBillList";
import BillCard from "../components/BillCard";
import DebtBillSearchFilters from "../components/DebtBillSearchFilters";
import useDebtFilters from "../hooks/useDebtFilters";
import "../styles/DebtBillsModule.css";

const summaryCards = [
  { label: "Total debt", value: "$48,320.00", note: "All open balances" },
  { label: "Outstanding", value: "$39,120.00", note: "Remaining repayment" },
  { label: "Overdue", value: "$1,840.00", note: "Past due amount" },
  { label: "Next payment", value: "$620.00", note: "Due in 5 days" },
];

const debtTrackerItems = [
  {
    id: "d1",
    name: "Auto Loan",
    debtType: "Loan",
    amountDue: "$1,250.00",
    remainingBalance: "$12,500.00",
    nextPaymentDate: "Sep 10",
    status: "Due Soon",
    repaymentPercentage: "24%",
  },
  {
    id: "d2",
    name: "Credit Card",
    debtType: "Card",
    amountDue: "$320.00",
    remainingBalance: "$4,750.00",
    nextPaymentDate: "Sep 7",
    status: "Overdue",
    repaymentPercentage: "13%",
  },
  {
    id: "d3",
    name: "Mortgage",
    debtType: "Home Loan",
    amountDue: "$850.00",
    remainingBalance: "$143,200.00",
    nextPaymentDate: "Sep 15",
    status: "On Track",
    repaymentPercentage: "42%",
  },
];

const billsItems = [
  {
    id: "b1",
    name: "Utility Provider",
    category: "Electricity",
    amount: "$78.50",
    billingCycle: "Monthly",
    nextBillingDate: "Sep 12",
    paymentMethod: "Visa •••• 2104",
    status: "Active",
    autoPay: true,
  },
  {
    id: "b2",
    name: "Streaming Plus",
    category: "Entertainment",
    amount: "$15.99",
    billingCycle: "Monthly",
    nextBillingDate: "Sep 20",
    paymentMethod: "Mastercard •••• 0119",
    status: "Upcoming",
    autoPay: false,
  },
  {
    id: "b3",
    name: "Home Internet",
    category: "Internet",
    amount: "$63.00",
    billingCycle: "Monthly",
    nextBillingDate: "Oct 1",
    paymentMethod: "Amex •••• 4321",
    status: "Paused",
    autoPay: false,
  },
  {
    id: "b4",
    name: "Gym Membership",
    category: "Health",
    amount: "$42.00",
    billingCycle: "Monthly",
    nextBillingDate: "Sep 18",
    paymentMethod: "Visa •••• 9876",
    status: "Cancelled",
    autoPay: false,
  },
  {
    id: "b5",
    name: "Phone Plan",
    category: "Mobile",
    amount: "$89.99",
    billingCycle: "Monthly",
    nextBillingDate: "Aug 30",
    paymentMethod: "Visa •••• 3344",
    status: "Overdue",
    autoPay: true,
  },
];

export default function DebtBillsPage() {
  const [debtSearch, setDebtSearch] = useState("");
  const [billSearch, setBillSearch] = useState("");
  const [debtFilters, setDebtFilters] = useState({ status: "All", debtType: "All", timeframe: "All" });
  const [billFilters, setBillFilters] = useState({ status: "All", category: "All", billingFrequency: "All" });
  const [debtSortBy, setDebtSortBy] = useState("Due date");
  const [billSortBy, setBillSortBy] = useState("Due date");

  const filteredDebtTrackerItems = useDebtFilters(debtTrackerItems, {
    searchQuery: debtSearch,
    filters: debtFilters,
    sortBy: debtSortBy,
    section: "debt",
  });

  const filteredBillsItems = useDebtFilters(billsItems, {
    searchQuery: billSearch,
    filters: billFilters,
    sortBy: billSortBy,
    section: "bills",
  });

  const updateDebtFilter = (field, value) => {
    setDebtFilters((prev) => ({ ...prev, [field]: value }));
  };

  const updateBillFilter = (field, value) => {
    setBillFilters((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="debt-bills-root">
      <DebtBillsHeader title="Debt & Bills" subtitle="Track loans, credit cards, and recurring payments in one place." />
      <DebtBillsSummary cards={summaryCards} />

      <section className="debt-section">
        <h2>Debt Tracker</h2>
        <DebtBillSearchFilters
          section="debt"
          searchQuery={debtSearch}
          onSearchChange={setDebtSearch}
          filters={debtFilters}
          onFilterChange={updateDebtFilter}
          sortBy={debtSortBy}
          onSortChange={setDebtSortBy}
        />

        {filteredDebtTrackerItems.length === 0 ? (
          <div className="debt-empty-state">No matching debt tracker items found.</div>
        ) : (
          <DebtBillList items={filteredDebtTrackerItems} />
        )}
      </section>

      <section className="debt-section">
        <h2>Bills & Subscriptions</h2>
        <DebtBillSearchFilters
          section="bills"
          searchQuery={billSearch}
          onSearchChange={setBillSearch}
          filters={billFilters}
          onFilterChange={updateBillFilter}
          sortBy={billSortBy}
          onSortChange={setBillSortBy}
        />

        {filteredBillsItems.length === 0 ? (
          <div className="debt-empty-state">No matching bills or subscriptions found.</div>
        ) : (
          <div className="debt-bill-list">
            {filteredBillsItems.map((item) => (
              <BillCard key={item.id} {...item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

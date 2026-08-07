import { useState } from "react";
import DebtBillsHeader from "../components/DebtBillsHeader";
import DebtBillsSummary from "../components/DebtBillsSummary";
import DebtBillList from "../components/DebtBillList";
import BillCard from "../components/BillCard";
import DebtBillSearchFilters from "../components/DebtBillSearchFilters";
import useDebtFilters from "../hooks/useDebtFilters";
import useDebtSummary from "../hooks/useDebtSummary";
import { formatCurrency as formatCurrencyValue, getCurrencySymbol } from "../../../utils/formatCurrency";
import "../styles/DebtBillsModule.css";

const currencyCode = "USD";
const currencySymbol = getCurrencySymbol(currencyCode);
const formatCurrency = (value) => formatCurrencyValue(value, { currencyCode, currencySymbol });

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

  const { normalizedDebtItems, normalizedBillItems, debtSummary, billSummary } = useDebtSummary(debtTrackerItems, billsItems);

  const filteredDebtTrackerItems = useDebtFilters(normalizedDebtItems, {
    searchQuery: debtSearch,
    filters: debtFilters,
    sortBy: debtSortBy,
    section: "debt",
  });

  const filteredBillsItems = useDebtFilters(normalizedBillItems, {
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

  const debtSummaryCards = [
    { label: "Total debt", value: formatCurrency(debtSummary.totalDebt), note: "All open balances" },
    { label: "Outstanding", value: formatCurrency(debtSummary.outstandingBalance), note: "Remaining repayment" },
    { label: "Overdue", value: formatCurrency(debtSummary.overdueAmount), note: "Past due amount" },
    { label: "Next payment", value: debtSummary.nextPaymentDate ? debtSummary.nextPaymentDate.toLocaleDateString() : "—", note: "Next upcoming debt payment" },
  ];

  const billSummaryCards = [
    { label: "Monthly recurring", value: formatCurrency(billSummary.monthlyRecurringCost), note: "Estimated active recurring bills" },
    { label: "Annual recurring", value: formatCurrency(billSummary.estimatedAnnualCost), note: "Estimated yearly recurring cost" },
    { label: "Active subscriptions", value: `${billSummary.activeSubscriptions}`, note: "Currently active bills" },
    { label: "Upcoming bills", value: `${billSummary.upcomingBills}`, note: "Scheduled bills arriving soon" },
  ];

  return (
    <div className="debt-bills-root">
      <DebtBillsHeader title="Debt & Bills" subtitle="Track loans, credit cards, and recurring payments in one place." />
      <DebtBillsSummary cards={debtSummaryCards} />
      <DebtBillsSummary cards={billSummaryCards} />

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

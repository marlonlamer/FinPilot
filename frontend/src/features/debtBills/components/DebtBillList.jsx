import DebtBillItem from "./DebtBillItem";

const debtItems = [
  { title: "Auto Loan", type: "Loan", amount: "$1,250.00", balance: "$12,500.00", dueDate: "Sep 10", status: "Due Soon", progress: "24%" },
  { title: "Home Loan", type: "Mortgage", amount: "$850.00", balance: "$143,200.00", dueDate: "Sep 15", status: "On Track", progress: "42%" },
  { title: "Credit Card", type: "Card", amount: "$320.00", balance: "$4,750.00", dueDate: "Sep 7", status: "Overdue", progress: "13%" },
];

export default function DebtBillList() {
  return (
    <div className="debt-bill-list">
      {debtItems.map((item) => (
        <DebtBillItem key={item.title} {...item} />
      ))}
    </div>
  );
}

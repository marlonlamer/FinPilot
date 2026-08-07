import DebtBillItem from "./DebtBillItem";

export default function DebtBillList({ items }) {
  return (
    <div className="debt-bill-list">
      {items.map((item) => (
        <DebtBillItem key={item.id} {...item} />
      ))}
    </div>
  );
}

import { useMemo } from "react";

const parseAmount = (value) => {
  if (value == null) return 0;
  const numeric = String(value).replace(/[^0-9.-]+/g, "");
  const parsed = Number(numeric);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseDateValue = (value) => {
  if (!value) return null;
  const directParse = new Date(value);
  if (!Number.isNaN(directParse.getTime())) {
    return directParse;
  }

  const fallback = new Date(`${value} ${new Date().getFullYear()}`);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

const matchesSearch = (item, query) => {
  if (!query) return true;
  const normalized = query.trim().toLowerCase();
  const fields = [
    item.name,
    item.category,
    item.account,
    item.debtType,
    item.paymentMethod,
    item.status,
  ];
  return fields.some((field) => field && String(field).toLowerCase().includes(normalized));
};

const filterByTimeframe = (item, timeframe) => {
  if (!timeframe || timeframe === "All") return true;
  const date = parseDateValue(item.nextPaymentDate || item.nextBillingDate);
  if (!date) return true;

  const now = new Date();
  const days = Math.floor((date - now) / (1000 * 60 * 60 * 24));
  switch (timeframe) {
    case "This week":
      return days >= 0 && days <= 7;
    case "This month":
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && days >= 0;
    case "Past due":
      return days < 0;
    default:
      return true;
  }
};

const sortItems = (items, sortBy) => {
  const list = [...items];
  if (sortBy === "Amount") {
    return list.sort((a, b) => parseAmount(a.amount || a.amountDue) - parseAmount(b.amount || b.amountDue));
  }

  if (sortBy === "Oldest") {
    return list.sort((a, b) => {
      const aDate = parseDateValue(a.createdAt || a.addedAt);
      const bDate = parseDateValue(b.createdAt || b.addedAt);
      return (aDate?.getTime() || 0) - (bDate?.getTime() || 0);
    });
  }

  return list.sort((a, b) => {
    const aDate = parseDateValue(a.nextPaymentDate || a.nextBillingDate);
    const bDate = parseDateValue(b.nextPaymentDate || b.nextBillingDate);
    return (aDate?.getTime() || 0) - (bDate?.getTime() || 0);
  });
};

export default function useDebtFilters(items, { searchQuery, filters, sortBy, section }) {
  return useMemo(() => {
    const filtered = items.filter((item) => {
      const matchesQuery = matchesSearch(item, searchQuery);
      if (!matchesQuery) return false;

      if (section === "debt") {
        if (filters.status && filters.status !== "All" && String(item.status).toLowerCase() !== String(filters.status).toLowerCase()) {
          return false;
        }
        if (filters.debtType && filters.debtType !== "All" && String(item.debtType).toLowerCase() !== String(filters.debtType).toLowerCase()) {
          return false;
        }
        if (!filterByTimeframe(item, filters.timeframe)) {
          return false;
        }
      }

      if (section === "bills") {
        if (filters.status && filters.status !== "All" && String(item.status).toLowerCase() !== String(filters.status).toLowerCase()) {
          return false;
        }
        if (filters.category && filters.category !== "All" && String(item.category).toLowerCase() !== String(filters.category).toLowerCase()) {
          return false;
        }
        if (filters.billingFrequency && filters.billingFrequency !== "All" && String(item.billingCycle).toLowerCase() !== String(filters.billingFrequency).toLowerCase()) {
          return false;
        }
      }

      return true;
    });

    return sortItems(filtered, sortBy);
  }, [items, searchQuery, filters.status, filters.debtType, filters.timeframe, filters.category, filters.billingFrequency, sortBy, section]);
}

const CATEGORY_COLORS = [
  "#0f766e",
  "#2563eb",
  "#7c3aed",
  "#d97706",
  "#db2777",
  "#0891b2",
  "#65a30d",
  "#ea580c",
  "#4f46e5",
  "#059669"
];

export const buildIncomeCategoryData = (incomes = []) => {
  const categories = new Map();

  (Array.isArray(incomes) ? incomes : []).forEach((income) => {
    const amount = Number(income?.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;

    const label = String(income?.category || income?.title || income?.type || "Uncategorized").trim() || "Uncategorized";
    const key = label.toLowerCase();
    const category = categories.get(key);
    if (category) {
      category.value += amount;
    } else {
      categories.set(key, { name: label, value: amount });
    }
  });

  const sortedCategories = [...categories.values()].sort((a, b) => b.value - a.value);
  const total = sortedCategories.reduce((sum, category) => sum + category.value, 0);
  const data = sortedCategories.map((category, index) => ({
    ...category,
    percent: total > 0 ? category.value / total * 100 : 0,
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
  }));

  return { data, total };
};

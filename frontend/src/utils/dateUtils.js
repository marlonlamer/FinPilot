export function formatYearMonth(year, month) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

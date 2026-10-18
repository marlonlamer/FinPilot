const COMPARISON_LABELS = {
  day: "vs previous day",
  week: "vs previous week",
  month: "vs previous month",
  year: "vs previous year"
};

export const getIncomeComparisonSummary = (currentTotal, previousTotal, timeframe) => {
  if (timeframe === "all") return { text: "Total income", direction: null };
  if (previousTotal === 0) return { text: "No previous data", direction: null };

  const percentChange = ((currentTotal - previousTotal) / previousTotal) * 100;
  if (!Number.isFinite(percentChange)) return { text: "No previous data", direction: null };

  const direction = percentChange > 0 ? "up" : percentChange < 0 ? "down" : null;
  const arrow = direction === "up" ? "↑ " : direction === "down" ? "↓ " : "";
  const percentage = `${Math.abs(percentChange).toFixed(1)}%`;
  const comparisonLabel = COMPARISON_LABELS[timeframe] || "vs previous period";

  return {
    text: `${arrow}${percentage} ${comparisonLabel}`,
    direction
  };
};

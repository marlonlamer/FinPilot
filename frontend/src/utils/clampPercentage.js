export function clampPercentage(value) {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return 0;
  }

  return Math.min(100, Math.max(0, numericValue));
}

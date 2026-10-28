export const getAdjacentMonth = ({ year, month }, offset) => {
  const date = new Date(Number(year), Number(month) + Number(offset), 1);
  return { year: date.getFullYear(), month: date.getMonth() };
};

export const getAdjacentYear = (year, offset) => Number(year) + Number(offset);

export const isValidAnalyticsYear = (year) => Number.isInteger(Number(year)) &&
  Number(year) >= 1900 &&
  Number(year) <= 9999;

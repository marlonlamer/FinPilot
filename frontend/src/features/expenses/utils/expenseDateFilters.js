export const getLocalDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getIsoWeekValue = (date) => {
  const value = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  value.setUTCDate(value.getUTCDate() + 4 - (value.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((value - yearStart) / 86400000 + 1) / 7);
  return `${value.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};

const parseLocalDate = (value) => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) return null;
  return date;
};

const getIsoWeekStart = (weekValue) => {
  const match = weekValue.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return null;
  const [, year, week] = match;
  const januaryFourth = new Date(Date.UTC(Number(year), 0, 4));
  const monday = new Date(januaryFourth);
  monday.setUTCDate(januaryFourth.getUTCDate() - ((januaryFourth.getUTCDay() || 7) - 1) + (Number(week) - 1) * 7);
  const weekStart = new Date(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate());
  if (getIsoWeekValue(weekStart) !== weekValue) return null;
  return weekStart;
};

export const getExpenseDateRange = ({ timeframe, dayValue, weekValue, monthValue, yearValue }) => {
  let start;
  let end;

  if (timeframe === "day") {
    start = parseLocalDate(dayValue);
    if (!start) return null;
    end = new Date(start);
    end.setDate(end.getDate() + 1);
  } else if (timeframe === "week") {
    start = getIsoWeekStart(weekValue);
    if (!start) return null;
    end = new Date(start);
    end.setDate(end.getDate() + 7);
  } else if (timeframe === "month") {
    const match = monthValue.match(/^(\d{4})-(\d{2})$/);
    if (!match || Number(match[2]) < 1 || Number(match[2]) > 12) return null;
    start = new Date(Number(match[1]), Number(match[2]) - 1, 1);
    end = new Date(Number(match[1]), Number(match[2]), 1);
  } else if (timeframe === "year") {
    if (!/^\d{4}$/.test(yearValue)) return null;
    start = new Date(Number(yearValue), 0, 1);
    end = new Date(Number(yearValue) + 1, 0, 1);
  } else {
    return null;
  }

  return { start, end };
};

export const isDateWithinRange = (date, range) => Boolean(
  date && range && date >= range.start && date < range.end
);

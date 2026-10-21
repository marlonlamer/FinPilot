export const matchesExpenseMerchant = (expense, searchValue) => {
  const query = String(searchValue ?? "").trim().toLowerCase();
  if (!query) return true;

  const merchantValue = [
    expense?.merchant,
    expense?.merchantRecipient,
    expense?.recipient,
    expense?.description
  ].find(value => value !== null && value !== undefined && String(value).trim());

  return String(merchantValue ?? "").trim().toLowerCase().includes(query);
};

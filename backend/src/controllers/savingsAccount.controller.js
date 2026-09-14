const savingsAccountService = require("../services/savingsAccount.service");

const ACCOUNT_TYPES = new Set(["CASH_WALLET", "BANK_ACCOUNT", "E_WALLET", "VISUAL_BANK_CARD"]);
const MASKED_ACCOUNT_PATTERN = /^(?:\*{4}|•{4})\s?\d{4}$/;

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const validatePayload = (body, partial = false) => {
  const data = {};

  if (!partial || body.accountName !== undefined) {
    if (typeof body.accountName !== "string" || !body.accountName.trim()) return "Account name is required";
    data.accountName = body.accountName.trim();
  }

  if (!partial || body.accountType !== undefined) {
    if (typeof body.accountType !== "string" || !ACCOUNT_TYPES.has(body.accountType)) return "Invalid account type";
    data.accountType = body.accountType;
  }

  if (!partial || body.provider !== undefined) {
    const provider = typeof body.provider === "string" ? body.provider.trim() : "";
    const accountType = body.accountType;
    if (accountType !== "CASH_WALLET" && !provider) return "Provider is required";
    data.provider = provider || "Cash Wallet";
  }

  if (body.maskedAccountNumber !== undefined) {
    if (body.maskedAccountNumber !== null && (
      typeof body.maskedAccountNumber !== "string" ||
      !MASKED_ACCOUNT_PATTERN.test(body.maskedAccountNumber.trim())
    )) {
      return "Masked account number must use the format **** 1234";
    }
    data.maskedAccountNumber = body.maskedAccountNumber ? body.maskedAccountNumber.trim() : null;
  }

  if (!partial || body.balance !== undefined) {
    const balance = Number(body.balance);
    if (!Number.isFinite(balance) || balance < 0) return "Balance must be a valid non-negative amount";
    data.balance = balance;
  }

  if (body.isPrimary !== undefined) {
    if (typeof body.isPrimary !== "boolean") return "isPrimary must be a boolean";
    data.isPrimary = body.isPrimary;
  }

  return data;
};

const getAccounts = async (req, res) => {
  try {
    const accounts = await savingsAccountService.getAllAccounts(req.userId);
    res.json(accounts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch savings accounts" });
  }
};

const createAccount = async (req, res) => {
  const data = validatePayload(req.body || {});
  if (typeof data === "string") return res.status(400).json({ error: data });

  try {
    const account = await savingsAccountService.createAccount(data, req.userId);
    res.status(201).json(account);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create savings account" });
  }
};

const updateAccount = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid account ID" });

  const data = validatePayload(req.body || {}, true);
  if (typeof data === "string") return res.status(400).json({ error: data });

  try {
    const account = await savingsAccountService.updateAccount(id, data, req.userId);
    if (!account) return res.status(404).json({ error: "Savings account not found" });
    res.json(account);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update savings account" });
  }
};

const deleteAccount = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid account ID" });

  try {
    const deleted = await savingsAccountService.deleteAccount(id, req.userId);
    if (!deleted) return res.status(404).json({ error: "Savings account not found" });
    res.json({ message: "Savings account deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete savings account" });
  }
};

module.exports = { getAccounts, createAccount, updateAccount, deleteAccount };


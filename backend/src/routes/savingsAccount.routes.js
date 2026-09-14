const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount
} = require("../controllers/savingsAccount.controller");

const router = express.Router();

router.get("/", authMiddleware, getAccounts);
router.post("/", authMiddleware, createAccount);
router.put("/:id", authMiddleware, updateAccount);
router.delete("/:id", authMiddleware, deleteAccount);

module.exports = router;


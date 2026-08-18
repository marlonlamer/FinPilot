const express = require("express");
const { getDebts, getDebtSummary, getDebtById, createDebt, updateDebt, deleteDebt, payDebt } = require("../controllers/debt.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", authMiddleware, getDebts);
router.get("/summary", authMiddleware, getDebtSummary);
router.get("/:id", authMiddleware, getDebtById);
router.post("/", authMiddleware, createDebt);
router.post("/:id/pay", authMiddleware, payDebt);
router.put("/:id", authMiddleware, updateDebt);
router.delete("/:id", authMiddleware, deleteDebt);

module.exports = router;

const express = require("express");
const { getDebts, getDebtById, createDebt, updateDebt, deleteDebt } = require("../controllers/debt.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", authMiddleware, getDebts);
router.get("/:id", authMiddleware, getDebtById);
router.post("/", authMiddleware, createDebt);
router.put("/:id", authMiddleware, updateDebt);
router.delete("/:id", authMiddleware, deleteDebt);

module.exports = router;

const express = require("express");
const { getIncomes, createIncome, deleteIncome, updateIncome } = require("../controllers/income.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/incomes", authMiddleware, getIncomes);
router.post("/incomes", authMiddleware, createIncome);
router.delete("/incomes/:id", authMiddleware, deleteIncome);
router.put("/incomes/:id", authMiddleware, updateIncome);

module.exports = router;

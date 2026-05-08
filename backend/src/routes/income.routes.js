const express = require("express");
const { getIncomes, createIncome, deleteIncome, updateIncome } = require("../controllers/income.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", authMiddleware, getIncomes);
router.post("/", authMiddleware, createIncome);
router.delete("/:id", authMiddleware, deleteIncome);
router.put("/:id", authMiddleware, updateIncome);

module.exports = router;

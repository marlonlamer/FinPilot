const express = require("express");
const { getSavings, createSavings, deleteSavings, updateSavings, deposit, withdraw, getBalance } = require("../controllers/savings.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", authMiddleware, getSavings);
router.post("/", authMiddleware, createSavings);
router.delete("/:id", authMiddleware, deleteSavings);
router.put("/:id", authMiddleware, updateSavings);
router.post("/deposit", authMiddleware, deposit);
router.post("/withdraw", authMiddleware, withdraw);
router.get("/balance/:userId", authMiddleware, getBalance);
router.get("/history/:userId", authMiddleware, getHistory);

module.exports = router;

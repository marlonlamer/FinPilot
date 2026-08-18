const express = require("express");
const { getBills, getBillSummary, getBillById, createBill, updateBill, deleteBill, payBill } = require("../controllers/bill.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", authMiddleware, getBills);
router.get("/summary", authMiddleware, getBillSummary);
router.get("/:id", authMiddleware, getBillById);
router.post("/", authMiddleware, createBill);
router.post("/:id/pay", authMiddleware, payBill);
router.put("/:id", authMiddleware, updateBill);
router.delete("/:id", authMiddleware, deleteBill);

module.exports = router;

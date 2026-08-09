const express = require("express");
const { getBills, getBillById, createBill, updateBill, deleteBill } = require("../controllers/bill.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", authMiddleware, getBills);
router.get("/:id", authMiddleware, getBillById);
router.post("/", authMiddleware, createBill);
router.put("/:id", authMiddleware, updateBill);
router.delete("/:id", authMiddleware, deleteBill);

module.exports = router;

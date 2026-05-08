const express = require("express");
const { getSavings, createSavings, deleteSavings, updateSavings } = require("../controllers/savings.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", authMiddleware, getSavings);
router.post("/", authMiddleware, createSavings);
router.delete("/:id", authMiddleware, deleteSavings);
router.put("/:id", authMiddleware, updateSavings);

module.exports = router;

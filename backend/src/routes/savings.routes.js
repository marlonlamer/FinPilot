const express = require("express");
const { getSavings, createSavings, deleteSavings, updateSavings } = require("../controllers/savings.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/savings", authMiddleware, getSavings);
router.post("/savings", authMiddleware, createSavings);
router.delete("/savings/:id", authMiddleware, deleteSavings);
router.put("/savings/:id", authMiddleware, updateSavings);

module.exports = router;

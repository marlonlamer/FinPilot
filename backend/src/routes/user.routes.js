const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const { updateProfile, getUser, updateBudget, deleteBudget } = require("../controllers/user.controller");

const router = express.Router();

router.put("/profile", authMiddleware, updateProfile);
router.get('/me', authMiddleware, getUser);
router.put('/budget', authMiddleware, updateBudget);
router.delete('/budget', authMiddleware, deleteBudget);

module.exports = router;

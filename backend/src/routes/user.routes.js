const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const { updateProfile, getUser, updateBudget } = require("../controllers/user.controller");

const router = express.Router();

router.put("/profile", authMiddleware, updateProfile);
router.get('/me', authMiddleware, getUser);
router.put('/budget', authMiddleware, updateBudget);

module.exports = router;

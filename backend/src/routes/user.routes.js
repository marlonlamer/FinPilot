const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const { updateProfile, getUser, updateBudget, deleteBudget, deleteAccount } = require("../controllers/user.controller");

const router = express.Router();

router.put("/profile", authMiddleware, updateProfile);
router.get('/me', authMiddleware, getUser);
router.put('/budget', authMiddleware, updateBudget);
router.delete('/budget', authMiddleware, deleteBudget);
router.delete('/account', authMiddleware, deleteAccount);

module.exports = router;

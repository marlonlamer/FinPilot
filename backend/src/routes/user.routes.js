const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const { updateProfile } = require("../controllers/user.controller");

const router = express.Router();

router.put("/profile", authMiddleware, updateProfile);

module.exports = router;

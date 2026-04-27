const express = require("express");
const { getCharts } = require("../controllers/reports.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/reports/charts", authMiddleware, getCharts);

module.exports = router;

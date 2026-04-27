const reportsService = require("../services/reports.service");

const getCharts = async (req, res) => {
  try {
    const { months, startDate, endDate, top } = req.query;
    const data = await reportsService.getReports(req.userId, { months, startDate, endDate, top });
    res.json(data);
  } catch (error) {
    console.error("Reports fetch error:", error);
    res.status(500).json({ error: "Failed to fetch reports data" });
  }
};

module.exports = { getCharts };

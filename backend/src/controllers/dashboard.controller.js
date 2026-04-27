const dashboardService = require("../services/dashboard.service");

const getDashboard = async (req, res) => {
  try {
    const data = await dashboardService.getDashboard(req.userId);
    res.json(data);
  } catch (error) {
    console.error("Dashboard fetch error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
};

module.exports = { getDashboard };

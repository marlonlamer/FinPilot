const express = require("express");
const cors = require("cors");

const expenseRoutes = require("./routes/expense.routes");
const incomeRoutes = require("./routes/income.routes");
const authRoutes = require("./routes/auth.routes");
const savingsRoutes = require("./routes/savings.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const reportsRoutes = require("./routes/reports.routes");
const userRoutes = require("./routes/user.routes");
const budgetsRoutes = require("./routes/budgets.routes");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://fin-pilot-ten-alpha.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.options("*", cors());

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server working");
});

app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/incomes", incomeRoutes);
app.use("/api/savings", savingsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/user", userRoutes);
app.use("/api/budgets", budgetsRoutes);

module.exports = app;

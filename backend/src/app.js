const express = require("express");
const cors = require("cors");

const expenseRoutes = require("./routes/expense.routes");
const incomeRoutes = require("./routes/income.routes");
const authRoutes = require("./routes/auth.routes");
const savingsRoutes = require("./routes/savings.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server working");
});

app.use(expenseRoutes);
app.use(incomeRoutes);
app.use(authRoutes);
app.use(savingsRoutes);

module.exports = app;

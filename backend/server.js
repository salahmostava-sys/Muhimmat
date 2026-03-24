require("dotenv").config();
const express = require("express");
const cors = require("cors");

const employeesRoutes = require("./src/routes/employeesRoutes");
const ordersRoutes = require("./src/routes/ordersRoutes");
const salaryRoutes = require("./src/routes/salaryRoutes");
const attendanceRoutes = require("./src/routes/attendanceRoutes");
const rolesRoutes = require("./src/routes/rolesRoutes");
const { notFound, errorHandler } = require("./src/middlewares/errorHandler");
const { requireRoles } = require("./src/middlewares/authz");

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "backend-api" });
});

app.use("/employees", requireRoles(["admin", "hr"]), employeesRoutes);
app.use("/orders", requireRoles(["admin", "operations", "hr"]), ordersRoutes);
app.use("/salary", requireRoles(["admin", "finance"]), salaryRoutes);
app.use("/attendance", requireRoles(["admin", "hr", "operations"]), attendanceRoutes);
app.use("/roles", requireRoles(["admin"]), rolesRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend API listening on port ${port}`);
});

const express = require("express");
const {
  listEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employeesController");

const router = express.Router();

router.get("/", listEmployees);
router.post("/", createEmployee);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

module.exports = router;

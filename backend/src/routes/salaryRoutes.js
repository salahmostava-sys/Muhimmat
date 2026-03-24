const express = require("express");
const { calcSalary } = require("../controllers/salaryController");

const router = express.Router();

router.get("/calc", calcSalary);

module.exports = router;

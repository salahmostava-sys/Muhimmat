const express = require("express");
const {
  checkIn,
  checkOut,
  getAttendanceByEmployee,
} = require("../controllers/attendanceController");

const router = express.Router();

router.post("/check-in", checkIn);
router.post("/check-out", checkOut);
router.get("/:employee", getAttendanceByEmployee);

module.exports = router;

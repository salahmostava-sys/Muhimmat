const express = require("express");
const { listRoles } = require("../controllers/rolesController");

const router = express.Router();

router.get("/", listRoles);

module.exports = router;

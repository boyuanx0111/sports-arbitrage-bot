const express = require("express");
const router = express.Router();
const controller = require("../controllers/simulationController");

router.get("/", controller.status);
router.post("/start", controller.start);
router.post("/stop", controller.stop);

module.exports = router;

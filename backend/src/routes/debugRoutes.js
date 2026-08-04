const express = require("express");
const router = express.Router();

const { activeLeagues } = require("../controllers/debugController");
const { arbitrageTest } = require("../controllers/debugController");

router.get("/active-leagues", activeLeagues);
router.get("/arbitrage-test", arbitrageTest)

module.exports = router;
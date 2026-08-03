const express = require("express");
const router = express.Router();

const { activeLeagues } = require("../controllers/debugController");

router.get("/active-leagues", activeLeagues);

module.exports = router;
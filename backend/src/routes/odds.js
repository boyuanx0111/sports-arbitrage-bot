const express = require("express");

const { fetchOdds } = require("../controllers/oddsController");

const router = express.Router();

router.get("/", fetchOdds);

module.exports = router;
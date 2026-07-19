const express = require("express");
const router = express.Router();

const {
  calculateArbitrage,
} = require("../controllers/arbitrageController");

router.post("/", calculateArbitrage);

module.exports = router;
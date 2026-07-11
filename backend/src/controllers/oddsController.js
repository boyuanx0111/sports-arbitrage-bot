const { getOdds } = require("../services/oddsService");

function fetchOdds(req, res) {
  res.json(getOdds());
}

module.exports = {
  fetchOdds,
};
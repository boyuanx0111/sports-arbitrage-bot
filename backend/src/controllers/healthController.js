const { getHealthStatus } = require("../services/healthService");

function getHealth(req, res) {
  const health = getHealthStatus();

  res.json(health);
}

module.exports = {
  getHealth,
};
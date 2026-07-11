function getHealthStatus() {
  return {
    status: "OK",
    message: "Sports Arbitrage Bot backend is running",
  };
}

module.exports = {
  getHealthStatus,
};
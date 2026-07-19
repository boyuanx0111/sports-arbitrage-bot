const arbitrageService = require("../services/arbitrageService");

const calculateArbitrage = (req, res) => {
  try {
    const { odds, bankroll } = req.body;

    if (!Array.isArray(odds) || odds.length < 2) {
      return res.status(400).json({
        error: "Odds must be an array containing at least two values.",
      });
    }

    if (typeof bankroll !== "number" || bankroll <= 0) {
      return res.status(400).json({
        error: "Bankroll must be a positive number.",
      });
    }

    const result = arbitrageService.calculateArbitrage(odds, bankroll);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Arbitrage calculation failed:", error);

    return res.status(500).json({
      error: "Internal server error.",
    });
  }
};

module.exports = {
  calculateArbitrage,
};
const express = require("express");

const healthRoutes = require("./routes/health");

const oddsRoutes = require("./routes/odds");

const arbitrageRoutes = require("./routes/arbitrage");

const app = express();

// Parse incoming JSON request bodies.
app.use(express.json());

// Register application routes.
app.use("/health", healthRoutes);
app.use("/odds", oddsRoutes);
app.use("/arbitrage", arbitrageRoutes);

module.exports = app;
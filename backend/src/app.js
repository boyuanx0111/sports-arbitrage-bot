const express = require("express");

const healthRoutes = require("./routes/health");

const oddsRoutes = require("./routes/odds");

const arbitrageRoutes = require("./routes/arbitrage");

const debugRoutes = require("./routes/debugRoutes");

const app = express();

// Parse incoming JSON request bodies.
app.use(express.json());

// Register application routes.
app.use("/health", healthRoutes);
app.use("/odds", oddsRoutes);
app.use("/arbitrage", arbitrageRoutes);
app.use("/debug", debugRoutes);

//cache mount
const cacheRoutes = require("./routes/cacheRoutes");
app.use("/cache", cacheRoutes);

module.exports = app;
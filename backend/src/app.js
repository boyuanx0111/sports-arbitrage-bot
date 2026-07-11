const express = require("express");

const healthRoutes = require("./routes/health");

const oddsRoutes = require("./routes/odds");

const app = express();

app.use(express.json());

app.use("/health", healthRoutes);
app.use("/odds", oddsRoutes);

module.exports = app;
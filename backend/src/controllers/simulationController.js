const simulationService = require("../services/simulationService");

function status(req, res) { res.json(simulationService.getStatus()); }
function start(req, res) { res.status(200).json(simulationService.start(req.body || {})); }
function stop(req, res) { res.status(200).json(simulationService.stop()); }

module.exports = { status, start, stop };

const fs = require("fs");
const path = require("path");

const logDirectory = path.join(
    __dirname,
    "../../logs"
);

const logFile = path.join(
    logDirectory,
    "arbitrage.log"
);


function logArbitrage(opportunity) {

    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logDirectory)) {
        fs.mkdirSync(logDirectory, {
            recursive: true
        });
    }

    const logEntry = {
        detectedAt: new Date().toISOString(),
        ...opportunity
    };

    fs.appendFileSync(
        logFile,
        JSON.stringify(logEntry) + "\n"
    );
}


module.exports = {
    logArbitrage
};
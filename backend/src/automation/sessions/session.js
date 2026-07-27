const path = require("path");

function getStoragePath(bookmaker) {
    return path.join(__dirname, "storage", `${bookmaker}.json`);
}

module.exports = {
    getStoragePath
};
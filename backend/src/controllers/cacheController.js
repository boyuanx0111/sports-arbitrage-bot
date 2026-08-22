const {
    refreshUKEvents,
    refreshSGOEvents
} = require("../services/eventRefreshService");

const {
    getEvents
} = require("../services/eventCacheService");

async function refreshEvents(req, res) {

    try {

        const result =
            await refreshUKEvents();

        res.json({
            message: "Event cache refreshed",
            result
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });
    }
}

async function refreshSGO(req, res) {

    try {

        const result =
            await refreshSGOEvents();

        res.json({
            message: "SGO event cache refreshed",
            result
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });
    }
}

async function getCachedEvents(req, res) {

    try {

        const ukEvents = getEvents("uk");
        const sgoEvents = getEvents("sgo");

        res.json({
            ukCount: ukEvents.length,
            sgoCount: sgoEvents.length,
            ukEvents,
            sgoEvents
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });
    }
}


module.exports = {
    refreshEvents,
    refreshSGO,
    getCachedEvents
};
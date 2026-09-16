const {
    refreshUKEvents,
    refreshSGOEvents
} = require("./eventRefreshService");

const {
    getOdds
} = require("./oddsService");

const {
    logArbitrage
} = require("../utils/arbLogger");

async function initialiseCaches() {

    console.log("Initialising event caches...");

    await refreshUKEvents();
    console.log("UK event cache initialised");

    await refreshSGOEvents();
    console.log("SGO event cache initialised");

    console.log("Event caches initialised");
}


//slow refresh events

const SLOW_REFRESH_INTERVAL =
    90 * 60 * 1000; // 90 minutes


function startSlowRefresh() {

    setInterval(async () => {

        console.log("Starting slow event refresh...");

        try {

            await refreshUKEvents();
            console.log("UK event cache refreshed");

            await refreshSGOEvents();
            console.log("SGO event cache refreshed");

            console.log("Slow event refresh complete");

        } catch (error) {

            console.error(
                "Slow event refresh failed:",
                error
            );
        }

    }, SLOW_REFRESH_INTERVAL);
}

// fast refresh odds (not cached)

const FAST_REFRESH_INTERVAL =
    5 * 60 * 1000; // 1 minute

function startFastRefresh() {

    setInterval(async () => {

        console.log("Starting fast odds refresh...");

        try {

            const result = await getOdds();

            const opportunities = result.combinedArbitrageOpportunities;

            console.log(
                `[${new Date().toISOString()}] Fast odds refresh complete: ${opportunities.length} arbitrage opportunities found`
            );

            for (const opportunity of opportunities) {

                logArbitrage(opportunity);

                console.log(
                    "ARBITRAGE DETECTED:",
                    opportunity
                );
            }

        } catch (error) {

            console.error(
                "Fast odds refresh failed:",
                error.message
            );
        }

    }, FAST_REFRESH_INTERVAL);
}

module.exports = {
    initialiseCaches,
    startSlowRefresh,
    startFastRefresh
};
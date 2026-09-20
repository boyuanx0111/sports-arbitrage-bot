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

const { SPORTSGAMEODDS, UKODDS } = require("../config");

const providers = {
    uk: Boolean(UKODDS.API_KEY),
    sgo: Boolean(SPORTSGAMEODDS.API_KEY)
};

async function refreshConfiguredCaches() {
    if (providers.uk) {
        await refreshUKEvents();
        console.log("UK event cache refreshed");
    } else {
        console.log("UK Odds API not configured; skipping UK event cache");
    }

    if (providers.sgo) {
        await refreshSGOEvents();
        console.log("SGO event cache refreshed");
    } else {
        console.log("SportsGameOdds not configured; skipping SGO event cache");
    }
}

async function initialiseCaches() {

    console.log("Initialising event caches...");

    if (!providers.uk && !providers.sgo) {
        throw new Error("No odds provider configured. Set SPORTSGAMEODDS_KEY and/or UKODDS_API_KEY.");
    }

    await refreshConfiguredCaches();

    console.log("Event caches initialised");
}


//slow refresh events

const SLOW_REFRESH_INTERVAL =
    90 * 60 * 1000; // 90 minutes


function startSlowRefresh() {

    setInterval(async () => {

        console.log("Starting slow event refresh...");

        try {

            await refreshConfiguredCaches();

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

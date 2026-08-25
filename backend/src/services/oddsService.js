const axios = require("axios");

const { SPORTSGAMEODDS } = require("../config");

const {
    getFootballEventsRange,
    getEventOdds,
    getEventOddsBatch
} = require("./ukOddsApiService");

const {
    transformSGOapi,
    transformUKOddsAPI,
    createEventKey,
    createMarketKey
} = require("../utils/helpers");

const { findArbitrageOpportunities } = require("./arbitrageService")

const { executeOpportunity } = require("../automation/automationManager");

const {
    getEvents
} = require("./eventCacheService");

const {
    getSGOEventsByIDs
} = require("./sgoAPIService");

// avoid rate limit (ukodds)
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// fetch odds from ukapiservice
async function getUKOdds() {
    // Read UK fixtures from event cache
    const eventsWithOdds =
        getEvents("uk");

    // Allow the odds endpoint to continue when the UK cache is empty; treat it as no UK data.
    if (eventsWithOdds.length === 0) {
        console.log("UK event cache is empty; continuing without UK data.");
        return {
            events: [],
            oddsResponses: []
        };
    }

    // Collect fixture IDs and fetch their odds in one batch request via batch endpoint on ukoddsapi
    const eventIDs = eventsWithOdds.map(
        event => event.event_id
    );

    let oddsResponses = [];

    if (eventIDs.length > 0) {
        try {
            const batchResponse =
                await getEventOddsBatch(eventIDs);

            oddsResponses =
                Object.values(batchResponse.odds || {});

            console.log(
                `UK batch success: returned ${oddsResponses.length}/${eventIDs.length} events`
            );

        } catch (error) {
            const apiError = error.response?.data?.error;

            // Only retry if UK Odds API specifically rate limited us
            if (apiError?.code !== "rate_limit_exceeded") {
                throw error;
            }

            // Retry-After header supplied by the API
            const retryAfter =
                Number(error.response?.headers?.["retry-after"]) || 5;

            console.log(
                `UK batch rate limited, waiting ${retryAfter}s...`
            );

            await sleep((retryAfter + 1) * 1000);

            console.log(
                `UK batch: retrying ${eventIDs.length} events...`
            );

            // Retry the batch once
            const batchResponse =
                await getEventOddsBatch(eventIDs);

            oddsResponses =
                Object.values(batchResponse.odds || {});

            console.log(
                `UK batch retry success: returned ${oddsResponses.length}/${eventIDs.length} events`
            );
        }
    }

    return {
        events: eventsWithOdds,
        oddsResponses
    };
}

async function getOdds() {

    try {
        // // raw fetch for each league
        // const responses = await Promise.all(
        //     SPORTSGAMEODDS.LEAGUES.map(({ leagueID, sportID }) =>
        //         axios.get(
        //             `${SPORTSGAMEODDS.BASE_URL}/events`,
        //             {
        //                 headers: {
        //                     "X-API-Key": SPORTSGAMEODDS.API_KEY
        //                 },
        //                 params: {
        //                     leagueID, //in config
        //                     sportID,
        //                     oddsAvailable: "true",
        //                     oddsPresent: "true",
        //                     limit: 20
        //                 }
        //             }
        //         )
        //     )
        // );

        // // Store the raw SGO events by league before transforming them
        // const eventsByLeague = {};

        // SPORTSGAMEODDS.LEAGUES.forEach((league, index) => {
        //     eventsByLeague[league.leagueID] = responses[index].data.data;
        // });

        // read from cache instead of direct fetch above (just keeping to show you get rid once you see ^)@pandley
        const cachedSGOEvents =
            getEvents("sgo");

        const cachedUKEvents =
            getEvents("uk");

        console.log(`Cached SGO events: ${cachedSGOEvents.length}`);
        console.log(`Cached UK events: ${cachedUKEvents.length}`);

        // Allow the odds endpoint to continue when only one data source is populated.
        if (cachedSGOEvents.length === 0 && cachedUKEvents.length === 0) {
            throw new Error(
                "SGO and UK event cache is empty. Refresh event cache before scanning odds."
            );
        }

        let allTransformedSGO = [];

        if (cachedSGOEvents.length > 0) {
            const sgoEventIDs =
                cachedSGOEvents.map(
                    event => event.eventID
                );

            // get fresh odds from cached event ids
            const freshSGOEvents =
                await getSGOEventsByIDs(
                    sgoEventIDs
                );

            // Transform raw API response into standardized format (deleteed SGO separate arb logic)
            allTransformedSGO = freshSGOEvents.map(transformSGOapi).flat();
        }

        let allTransformedUK = [];

        if (cachedUKEvents.length > 0) {
            // Fetch and transform UK Odds API data
            const ukOddsData = await getUKOdds();

            const transformedUKEvents = ukOddsData.oddsResponses.map(transformUKOddsAPI);

            allTransformedUK = transformedUKEvents.flat();
        }

        // Combine transformed odds from both APIs into single structure per event
        const combinedEvents = {};

        const allOdds = [
            ...allTransformedSGO,
            ...allTransformedUK
        ];

        for (const standardOdds of allOdds) {

            const eventKey = createEventKey(standardOdds);

            if (!combinedEvents[eventKey]) {
                combinedEvents[eventKey] = [];
            }

            combinedEvents[eventKey].push(standardOdds);
        }

        // Group markets by event 
        const combinedMarketsByEvent = {};

        for (const [eventKey, eventOdds] of Object.entries(combinedEvents)) {

            const markets = {};

            for (const standardOdds of eventOdds) {

                const marketKey = createMarketKey(standardOdds);

                if (!marketKey) {
                    continue;
                }

                if (!markets[marketKey]) {
                    markets[marketKey] = [];
                }

                markets[marketKey].push(standardOdds);
            }

            combinedMarketsByEvent[eventKey] = markets;
        }

        // arb for combined apis
        const combinedArbitrageOpportunities = [];

        for (const [eventKey, markets] of Object.entries(combinedMarketsByEvent)) {

            for (const [marketKey, marketOdds] of Object.entries(markets)) {

                if (marketOdds.length < 2) {
                    continue;
                }

                const arbitrageOpportunity =
                    findArbitrageOpportunities(marketOdds, 100);

                if (arbitrageOpportunity) {

                    combinedArbitrageOpportunities.push({
                        eventKey,
                        marketKey,
                        ...arbitrageOpportunity
                    });
                }
            }
        }

        const totalProfit = combinedArbitrageOpportunities.reduce(
            (sum, opportunity) =>
                sum + (opportunity.guaranteedProfit || 0),
            0
        );

        return {
            allOdds,
            totalProfit,    // Also returned the total profit across all the events
            combinedArbitrageOpportunities
        };
        // To inspect the data must alter the response of this function as this is sent as a json response to the website
    } catch (error) {

        console.log("API error:");
        console.log(error.response?.data || error.message);
        throw error;
    }
}

async function getActiveLeagues() {
    const response = await axios.get(`${SPORTSGAMEODDS.BASE_URL}/leagues/`, {
        headers: {
            "X-API-Key": SPORTSGAMEODDS.API_KEY
        }
    });
    const supportedLeagues = SPORTSGAMEODDS.LEAGUES.map(league => league.leagueID);
    const leagues = response.data.data;

    const activeLeagues = leagues.filter(league => league.enabled);
    const supportedActiveLeagues = activeLeagues.filter(league => supportedLeagues.includes(league.leagueID));

    return { activeLeagues, supportedActiveLeagues };
}

module.exports = {
    getOdds,
    getActiveLeagues
};
const axios = require("axios");

const { SPORTSGAMEODDS } = require("../config");

const {
    getFootballEventsRange,
    getEventOdds
} = require("./ukOddsApiService");

const {
    transformSGOapi,
    transformUKOddsAPI,
    createEventKey,
    createMarketKey
} = require("../utils/helpers");

const { findArbitrageOpportunities } = require("./arbitrageService")

const { executeOpportunity } = require("../automation/automationManager");

// avoid rate limit (ukodds)
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// fetch odds from ukapiservice
async function getUKOdds() {
    const today = new Date();

    const oneWeekLater = new Date(today);
    oneWeekLater.setDate(oneWeekLater.getDate() + 5);

    const from = today.toISOString().split("T")[0];
    const to = oneWeekLater.toISOString().split("T")[0];

    const eventsResponse = await getFootballEventsRange(from, to, "MLS");

    const events = eventsResponse.events || [];

    const eventsWithOdds = events.filter(
        event =>
            event.markets_with_odds > 0
    );

    // instead of burst request (free plan rate limit)
    const oddsResponses = [];

    for (const event of eventsWithOdds) {
        try {
            const odds = await getEventOdds(event.event_id);
            oddsResponses.push(odds);

        } catch (error) {
            const apiError = error.response?.data?.error;

            if (apiError?.code === "rate_limit_exceeded") {
                const match = apiError.message.match(/(\d+)/);
                const retryAfter = match ? Number(match[1]) : 5;

                console.log(`Rate limited, waiting ${retryAfter}s...`);
                await sleep((retryAfter + 1) * 1000);
                continue;
            }
            console.error(
                `Failed to fetch odds for ${event.event_id}:`,
                error.response?.data || error.message
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
        // raw fetch for each league
        const responses = await Promise.all(
            SPORTSGAMEODDS.LEAGUES.map(({ leagueID, sportID }) =>
                axios.get(
                    `${SPORTSGAMEODDS.BASE_URL}/events`,
                    {
                        headers: {
                            "X-API-Key": SPORTSGAMEODDS.API_KEY
                        },
                        params: {
                            leagueID, //in config
                            sportID,
                            oddsAvailable: "true",
                            oddsPresent: "true",
                            limit: 20
                        }
                    }
                )
            )
        );

        // Store the raw SGO events by league before transforming them
        const eventsByLeague = {};

        SPORTSGAMEODDS.LEAGUES.forEach((league, index) => {
            eventsByLeague[league.leagueID] = responses[index].data.data;
        });

        // Transform raw API response into standardized format (deleteed SGO separate arb logic)
        const allTransformedSGO = [];

        for (const events of Object.values(eventsByLeague)) {

            const transformedEvents = events.map(transformSGOapi);

            allTransformedSGO.push(
                ...transformedEvents.flat()
            );
        }

        // Fetch and transform UK Odds API data
        const ukOddsData = await getUKOdds();

        const transformedUKEvents = ukOddsData.oddsResponses.map(transformUKOddsAPI);

        const allTransformedUK = transformedUKEvents.flat();

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
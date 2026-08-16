const axios = require("axios");

const { SPORTSGAMEODDS } = require("../config");

const { transformSGOapi } = require("../utils/helpers");

const { calculateArbitrage,
    calculateIsArbitrage,
    findArbitrageOpportunities } = require("./arbitrageService")

const { executeOpportunity } = require("../automation/automationManager");

async function getOdds() {

    try {

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
                            limit: 5
                        }
                    }
                )
            )
        );

        const eventsByLeague = {};

        SPORTSGAMEODDS.LEAGUES.forEach((league, index) => {
            eventsByLeague[league.leagueID] = responses[index].data.data;
        });

        // Transform raw API response into standardized format (extracts event details and filters moneyline odds)
        const arbitrageByLeague = {};
        let totalProfit = 0;

        for (const [leagueID, events] of Object.entries(eventsByLeague)) {

            // Transform the events for each league 
            const transformedEvents = events.map(transformSGOapi);

            const arbitrageOppurtunities = [];
            let leagueProfit = 0;

            for (const transformedEventList of transformedEvents) {

                if (transformedEventList.length === 0) {
                    continue;
                }

                //split by market type
                const markets = {};

                for (const standardOdds of transformedEventList) {
                    if (!markets[standardOdds.marketType]) {
                        markets[standardOdds.marketType] = [];
                    }

                    markets[standardOdds.marketType].push(standardOdds);
                }

                for (const marketOdds of Object.values(markets)) {

                    const arbitrageOppurtunity =
                        findArbitrageOpportunities(marketOdds, 100);

                    if (arbitrageOppurtunity) {
                        arbitrageOppurtunities.push(arbitrageOppurtunity);
                        leagueProfit += arbitrageOppurtunity.guaranteedProfit;
                        totalProfit += arbitrageOppurtunity.guaranteedProfit;
                        
                        //link to automation, commented out for now because only ML supported
                        //await executeOpportunity(arbitrageOppurtunity);
                    }
                }
            }

            arbitrageByLeague[leagueID] = {
                eventCount: events.length,
                totalProfit: leagueProfit,
                arbitrageOppurtunities
            };
        }

        return {
            leagues: arbitrageByLeague, // Returns the arb events by league
            totalProfit,    // Also returned the total profit across all the events
        };
        // To inspect the data must alter the response of this function as this is sent as a json response to the website
    } catch (error) {

        console.log("SportsgameOdds API error:");
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
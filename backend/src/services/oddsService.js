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
                            limit: 15
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

                const arbitrageOppurtunity = findArbitrageOpportunities(transformedEventList, 100);
                arbitrageOppurtunities.push(arbitrageOppurtunity);
                
                //link to automationManager.js to execute the opportunity
                if (arbitrageOppurtunity && arbitrageOppurtunity.guaranteedProfit != null){
                    leagueProfit += arbitrageOppurtunity.guaranteedProfit;
                    totalProfit += arbitrageOppurtunity.guaranteedProfit;

                    await executeOpportunity(arbitrageOppurtunity);
                }

                arbitrageByLeague[leagueID] = {
                    eventCount: events.length,
                    totalProfit: leagueProfit,
                    arbitrageOppurtunities
                };
            }
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

            module.exports = {
                getOdds,
            };
const axios = require("axios");

const { SPORTSGAMEODDS } = require("../config");

const { transformSGOapi } = require("../utils/helpers");

const {calculateArbitrage,
  calculateIsArbitrage,
  findArbitrageOpportunities} = require("./arbitrageService")

async function getOdds() {

    try {

        const response = await axios.get(
            `${SPORTSGAMEODDS.BASE_URL}/events`,
            {
                headers: {
                    "X-API-Key": SPORTSGAMEODDS.API_KEY
                },

                params: {
                    leagueID: "MLB",
                    sportID: "BASEBALL",
                    oddsAvailable: "true",
                    oddsPresent: "true",
                    limit: 5
                }
            }
        );

        // Transform raw API response into standardized format (extracts event details and filters moneyline odds)
        const transformedEvents = response.data.data.map(transformSGOapi);
        const arbitrageOppurtunities = [];
        for (const transformedEventList of transformedEvents) {
            arbitrageOppurtunities.push(findArbitrageOpportunities(transformedEventList, 100));
        }
        let totalProfit = 0;
        for (const arbitrageOppurtunity of arbitrageOppurtunities) {
            if (arbitrageOppurtunity && arbitrageOppurtunity.guaranteedProfit != null) {
                totalProfit += arbitrageOppurtunity.guaranteedProfit;
            }
        }
        return {
            arbitrageOppurtunities, // Returns arbitrage opportunities as they are returned from the function
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
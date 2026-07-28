const axios = require("axios");

const { SPORTSGAMEODDS } = require("../config");

const { transformSGOapi } = require("../utils/helpers");

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

        // Log first odds object with full depth to inspect structure
        console.dir(transformedEvents[0].odds[0], { depth: null });

        return transformedEvents;

    } catch (error) {

        console.log("SportsgameOdds API error:");
        console.log(error.response?.data || error.message);

        throw error;
    }
}

module.exports = {
  getOdds,
};
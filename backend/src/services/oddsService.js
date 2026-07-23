const axios = require("axios");

const { SPORTSGAMEODDS } = require("../config");

const { transformSGOapi } = require("../utils/helpers");

/**
 * Fetches MLB events with available odds from SportsGameOdds API
 * @async
 * @returns {Promise<Array>} Array of transformed event objects with filtered moneyline odds and bookmaker data
 * @throws {Error} If API request fails or response is invalid
 */
async function getOdds() {

    try {
        // Request MLB baseball events from SportsGameOdds API
        const response = await axios.get(
            `${SPORTSGAMEODDS.BASE_URL}/events`,
            {
                headers: {
                    "X-API-Key": SPORTSGAMEODDS.API_KEY
                },

                params: {
                    leagueID: "MLB",                    // Major League Baseball
                    sportID: "BASEBALL",               // Baseball sport type
                    oddsAvailable: "true",             // Only events with odds currently available
                    oddsPresent: "true",               // Only events that have odds data
                    limit: 5                           // Limit to 5 events per request
                }
            }
        );

        // Transform raw API response into standardized format (extracts event details and filters moneyline odds)
        const transformedEvents = response.data.data.map(transformSGOapi);

        // Debug: Log first odds object with full depth to inspect structure
        console.dir(transformedEvents[0].odds[0], { depth: null });

        return transformedEvents;

    } catch (error) {
        // Log API errors
        console.log("SportsgameOdds API error:");
        console.log(error.response?.data || error.message);

        throw error;
    }
}

module.exports = {
  getOdds,
};
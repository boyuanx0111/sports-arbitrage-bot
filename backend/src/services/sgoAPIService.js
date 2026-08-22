const axios = require("axios");

const {
    SPORTSGAMEODDS
} = require("../config");


async function getSGOEventsByIDs(eventIDs) {

    if (!Array.isArray(eventIDs) || eventIDs.length === 0) {
        return [];
    }

    const response = await axios.get(
        `${SPORTSGAMEODDS.BASE_URL}/events`,
        {
            headers: {
                "X-API-Key": SPORTSGAMEODDS.API_KEY
            },

            params: {
                eventIDs: eventIDs.join(","),
                oddID: [
                    "points-all-game-ou-over",
                    "bothTeamsScored-all-game-yn-yes",
                    "points-home-game-sp-home"
                ].join(","),
                includeOpposingOdds: true,
                includeAltLines: true
            }
        }
    );

    return response.data.data || [];
}


module.exports = {
    getSGOEventsByIDs
};
const axios = require("axios");
const { SPORTSGAMEODDS } = require("../src/config/index"); // adjust path if needed
require("dotenv").config();

async function testGetEvents() {
    try {
        const response = await axios.get(
            `${SPORTSGAMEODDS.BASE_URL}/events`,
            {
                headers: {
                    "X-API-Key": process.env.SPORTSGAMEODDS_KEY
                },
                params: {
                    leagueID: "MLB",
                    sportID: "BASEBALL",
                    bookmakerID: "unibet",
                    periodID: "game",
                    oddsAvailable: "true",
                    oddsPresent: "true",
                    limit: 10
                }
            }
        );

        const events = response.data.data;
        console.log(`Found ${events.length} events\n`);
        events.forEach((event) => {
            console.log("========================================");
            console.log(`${event.teams.away.names.long} @ ${event.teams.home.names.long}`);

            Object.values(event.odds)
            //.filter((odd) => !odd.playerID)
            .filter((odd) => odd.byBookmaker?.unibet?.available)
            .forEach((odd) => {
                console.dir(odd, { depth: null, colors: true });
                console.log();
            });
        });
    } catch (error) {
        console.error("Failed to fetch events:");
        console.error(error.response?.data || error.message);
    }
}

testGetEvents();


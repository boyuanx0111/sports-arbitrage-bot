require("dotenv").config();

const {
    getSGOEventsByIDs
} = require("../src/services/sgoApiService");

const { transformSGOapi } = require("../src/utils/helpers");

async function test() {

    try {

        // Two known SGO event IDs from our cache
        const eventIDs = [
            "BtnRfWTb3LHOdM7w0Ra2",
            "WDMBurBOca4qEfO0JdoI"
        ];

        console.log("Requesting SGO event IDs:");
        console.log(eventIDs);

        const events =
            await getSGOEventsByIDs(eventIDs);

        console.log("\nEvents returned:", events.length);

        for (const event of events) {

            const transformed = transformSGOapi(event);

            const spreadMarkets = transformed.filter(
                market => market.marketType === "sp"
            );

            console.log("\nTRANSFORMED SPREADS:");

            for (const market of spreadMarkets) {
                console.log({
                    bookmaker: market.bookmaker,
                    statEntityID: market.statEntityID,
                    line: market.line,
                    outcomes: market.outcomes
                });
            }

            const homeSpread =
                event.odds?.["points-home-game-sp-home"];

            const awaySpread =
                event.odds?.["points-away-game-sp-away"];

            console.log("\nSPREAD RAW:");

            console.log("HOME:");
            console.dir(
                homeSpread?.byBookmaker?.fanduel,
                { depth: null }
            );

            console.log("AWAY:");
            console.dir(
                awaySpread?.byBookmaker?.fanduel,
                { depth: null }
            );

        }



    } catch (error) {

        console.error(
            "SGO event ID test failed:",
            error.response?.data || error.message
        );
    }
}


test();
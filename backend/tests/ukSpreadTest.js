require("dotenv").config();

const {
    getEventOdds
} = require("../src/services/ukOddsApiService");

const {
    transformUKOddsAPI,
    createMarketKey
} = require("../src/utils/helpers");


async function test() {

    try {

        const eventID =
            "evt_296558739615ecc836fa40268640";

        const event =
            await getEventOdds(eventID);

        const transformed =
            transformUKOddsAPI(event);

        const spreadMarkets =
            transformed.filter(
                market =>
                    market.marketType === "sp"
            );

        console.log(
            "\nTRANSFORMED UK SPREADS:"
        );

        for (const market of spreadMarkets) {

            console.log({
                bookmaker: market.bookmaker,
                line: market.line,
                outcomes: market.outcomes,
                marketKey: createMarketKey(market)
            });
        }

    } catch (error) {

        console.error(
            "UK spread test failed:",
            error.response?.data || error.message
        );
    }
}


test();
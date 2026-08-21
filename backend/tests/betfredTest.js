require("dotenv").config();

const { getEventOdds } = require("../src/services/ukOddsApiService");
const { transformUKOddsAPI } = require("../src/utils/helpers");

async function testUKBookmakers() {
    const eventID = "evt_296558739615ecc836fa40268640";

    try {
        const odds = await getEventOdds(eventID);

        console.log("\n=== BETFRED MARKETS ===");

        for (const market of odds.markets || []) {

            const betfredSelections = (market.selections || []).filter(
                selection =>
                    selection.bookmaker_name?.toLowerCase() === "betfred"
            );

            if (betfredSelections.length === 0) {
                continue;
            }

            console.log("\nMARKET:", market.market_name);

            console.log(
                betfredSelections
            );
        }

        console.log("\n=== RAW UK RESPONSE ===");

        const rawBookmakers = new Set();

        for (const market of odds.markets || []) {
            for (const selection of market.selections || []) {
                if (selection.bookmaker_name) {
                    rawBookmakers.add(selection.bookmaker_name);
                }
            }
        }

        console.log("Raw bookmakers:");
        console.log([...rawBookmakers]);

        console.log("\n=== RAW ASIAN HANDICAP BOOKMAKERS ===");

        const rawAsianHandicapBookmakers = new Set();

        for (const market of odds.markets || []) {

            if (
                market.market_name?.trim().toLowerCase() !==
                "asian handicap"
            ) {
                continue;
            }

            for (const selection of market.selections || []) {
                if (selection.bookmaker_name) {
                    rawAsianHandicapBookmakers.add(
                        selection.bookmaker_name
                    );
                }
            }
        }

        console.log(
            [...rawAsianHandicapBookmakers]
        );

        const transformed = transformUKOddsAPI(odds);

        console.log("\n=== TRANSFORMED BOOKMAKERS ===");

        const transformedBookmakers = new Set(
            transformed.map(
                odd => odd.bookmaker
            )
        );

        console.log(
            [...transformedBookmakers]
        );

        console.log("\n=== TRANSFORMED ASIAN HANDICAP ===");

        const transformedSpread = transformed.filter(
            odd => odd.marketType === "sp"
        );

        console.log(
            JSON.stringify(
                transformedSpread,
                null,
                2
            )
        );

    } catch (error) {
        console.error(
            "Test error:",
            error.response?.data || error.message
        );
    }
}

testUKBookmakers();
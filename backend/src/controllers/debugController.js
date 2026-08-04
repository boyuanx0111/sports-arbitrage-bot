const testCases = require("../debug/testData/arbTestData");
const { findArbitrageOpportunities } = require("../services/arbitrageService");
const { getActiveLeagues } = require("../services/oddsService");

async function activeLeagues(req, res) {
    try {
        const {activeLeagues, supportedActiveLeagues} = await getActiveLeagues();

        res.json({
            active: activeLeagues.map(league => league.leagueID),
            supported: supportedActiveLeagues.map(league => league.leagueID)
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to fetch active leagues"
        });
    }
}

async function arbitrageTest(req, res){
    try {
        const results = [];
        for (const testCase of testCases) {
            results.push(findArbitrageOpportunities(testCase, 100));
        }
        res.json({
            results: results,
            expectedResults: "First two should be true. 3rd one should alert that under 2% and last 3 all fail"
    });
    } catch (error) {
        res.status(500).json({
            error: "Failed to run arbitrage test"
        });
    }
}

module.exports = {
    activeLeagues,
    arbitrageTest
};
// controllers/debugController.js

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

module.exports = {
    activeLeagues
};
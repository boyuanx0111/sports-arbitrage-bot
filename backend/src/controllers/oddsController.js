const { getOdds } = require("../services/oddsService");

async function fetchOdds(req, res) {
    try {

        const odds = await getOdds();

        console.log("ODDS RESPONSE:");
        console.log(odds);

        res.json(odds);

    } catch(error) {

        console.error(error);
        console.error(error.stack);

        res.status(500).json({
            message: error.message
        });

    }
}

module.exports = {
  fetchOdds,
};
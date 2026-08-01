const unibet = require("./sportsbooks/unibet");

async function routeJob(job) {

    switch (job.bookmaker) {

        case "unibet":
            await unibet.placeBet(job);
            break;

        default:
            console.log(`No automation available for ${job.bookmaker}`);
    }
}

async function executeOpportunity(opportunity) {

    console.log(opportunity);

    const homeJob = {
        eventID: opportunity.eventID,
        homeTeam: opportunity.homeTeam,
        awayTeam: opportunity.awayTeam,
        startTime: opportunity.startTime,
        marketType: opportunity.marketType,

        bookmaker: opportunity.bestOdds.home.bookmaker,
        side: "home",
        odds: opportunity.bestOdds.home.odds,
        stake: opportunity.stakes[0]
    };

    const awayJob = {
        eventID: opportunity.eventID,
        homeTeam: opportunity.homeTeam,
        awayTeam: opportunity.awayTeam,
        startTime: opportunity.startTime,
        marketType: opportunity.marketType,

        bookmaker: opportunity.bestOdds.away.bookmaker,
        side: "away",
        odds: opportunity.bestOdds.away.odds,
        stake: opportunity.stakes[1]
    };

    await routeJob(homeJob);
    await routeJob(awayJob);

    return {
        homeJob,
        awayJob
    };
};



module.exports = {
    executeOpportunity
};
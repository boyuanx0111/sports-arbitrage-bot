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

    const legs = Array.isArray(opportunity.legs) && opportunity.legs.length > 0
        ? opportunity.legs
        : [
            opportunity.bestOdds?.home && {
                outcome: "home",
                bookmaker: opportunity.bestOdds.home.bookmaker,
                odds: opportunity.bestOdds.home.odds,
                stake: opportunity.stakes?.[0]
            },
            opportunity.bestOdds?.away && {
                outcome: "away",
                bookmaker: opportunity.bestOdds.away.bookmaker,
                odds: opportunity.bestOdds.away.odds,
                stake: opportunity.stakes?.[1]
            }
        ].filter(Boolean);

    if (legs.length !== 2) {
        throw new Error("Automatic execution currently supports exactly two legs");
    }

    const homeJob = {
        eventID: opportunity.eventID,
        homeTeam: opportunity.homeTeam,
        awayTeam: opportunity.awayTeam,
        startTime: opportunity.startTime,
        marketType: opportunity.marketType,

        bookmaker: legs[0].bookmaker,
        side: legs[0].outcome,
        odds: legs[0].odds,
        stake: legs[0].stake
    };

    const awayJob = {
        eventID: opportunity.eventID,
        homeTeam: opportunity.homeTeam,
        awayTeam: opportunity.awayTeam,
        startTime: opportunity.startTime,
        marketType: opportunity.marketType,

        bookmaker: legs[1].bookmaker,
        side: legs[1].outcome,
        odds: legs[1].odds,
        stake: legs[1].stake
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
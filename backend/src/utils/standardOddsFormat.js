const validateOdds = require("./validation.js");

function createStandardOdds(eventID, bookmaker, marketType){
    return {
        eventID: eventID, // A primary key that uniquely identifies the match
        // Technically could include fields like sport, teams, starTime etc.
        // Will add those later only if necessary
        bookmaker: bookmaker,  
        marketType: marketType, // What is actually being bet on (e.g. over/under, winner, goals scored)
        outcomes: []
    };
// EventID MUST uniquely identify the event/match - not just the match but for example if a bet on a player is made
// it must be able to identify a player as well - consider adding an additional field for playerID if necessary.

}

function addOutcome(standardOdds, outcome, odds){
    validateOdds
    standardOdds.outcomes.push({outcome: outcome, odds: odds});
}

function convertAmericanOddToDecimal(americanOdd){
    // Negative odds means ur betting on the favourite - means the amount of money you need to 
    // bet to make 100. Positive means underdog - the amount of money you make if you bet 100.
    if (americanOdd > 0) {
        return (americanOdd/100) +1
    } else {
        return (100/americanOdd * -1) + 1
    };
}

module.exports = {
    createStandardOdds,
    addOutcome,
    convertAmericanOddToDecimal
};
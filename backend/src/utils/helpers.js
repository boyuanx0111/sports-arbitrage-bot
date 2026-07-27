const {validateOdds,
  validateBankroll} = require("./validation.js");
const {createStandardOdds,
  addOutcome,
  convertAmericanOddToDecimal} = require("./standardOddsFormat.js");

function transformSGOapi(event) {
  const standardOddsManyBookmakers = new Map();
  const event_metadata = {
    homeTeam: event.teams.home.names.long,
    awayTeam: event.teams.away.names.long,
    sport: event.sportID,
    league: event.leagueID,
    startTime: event.status.startsAt
  };

  const relevantOdds = Object.values(event.odds).filter( // Odds for relevant outcomes of ONE event
        (odd) => 
          odd.betTypeID === "ml" &&              // Moneyline bet type
          odd.periodID === "game" &&             // Full game period (not 1st inning, 5-inning, etc.)
          odd.bookOddsAvailable === true         // Odds available from bookmakers
      );
    relevantOdds.forEach((odd) => {
      Object.entries(odd.byBookmaker ?? {}).forEach(([bookmakerName, bookmakerData]) => {
        // As entries returns the key as the 0th index, value as 1st index
        if (!bookmakerData.available) return;
        const eventBookmakerKey = `${event.eventID}_${bookmakerName}-ml`;
        let standardOdds = standardOddsManyBookmakers.get(eventBookmakerKey);
        if (!standardOdds) {
          standardOdds = createStandardOdds(event.eventID, bookmakerName, "ml");
          standardOdds.event_metadata = event_metadata;
          standardOddsManyBookmakers.set(eventBookmakerKey, standardOdds);
        }
      
        addOutcome(standardOdds, odd.sideID, convertAmericanOddToDecimal(bookmakerData.odds));
      });
    });

    return Array.from(standardOddsManyBookmakers.values());
}



module.exports = {
  transformSGOapi
};

//small reusable helper functions
// This function requires some testing
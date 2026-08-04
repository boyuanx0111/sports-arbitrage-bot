const { validateOdds,
  validateBankroll } = require("./validation.js");
const { createStandardOdds,
  addOutcome,
  convertAmericanOddToDecimal } = require("./standardOddsFormat.js");

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
      ["ml", "sp", "ou", "yn"].includes(odd.betTypeID) &&              // moneyline, spread, over/under bet type
      (odd.periodID === "game" || odd.periodID === "reg") &&  // Full game period (or regulation for soccer)
      odd.bookOddsAvailable === true &&         // Odds available from bookmakers
      ["all", "home", "away"].includes(odd.statEntityID)
  );

  // Debug: see which markets made it through the filter
  console.log(
    relevantOdds.map(odd => ({
      betTypeID: odd.betTypeID,
      periodID: odd.periodID
    }))
  );

  relevantOdds.forEach((odd) => {
    Object.entries(odd.byBookmaker ?? {}).forEach(([bookmakerName, bookmakerData]) => {
      // As entries returns the key as the 0th index, value as 1st index
      if (!bookmakerData.available) return;

      //test
      console.log({
        oddID: odd.oddID,
        betTypeID: odd.betTypeID,
        sideID: odd.sideID,
        statID: odd.statID,
        statEntityID: odd.statEntityID,
        points: odd.points,
        line: odd.line,
        value: odd.value
      });

      const eventBookmakerKey = `${event.eventID}_${bookmakerName}-${odd.betTypeID}`;
      let standardOdds = standardOddsManyBookmakers.get(eventBookmakerKey);
      if (!standardOdds) {
        standardOdds = createStandardOdds(event.eventID, bookmakerName, odd.betTypeID);
        standardOdds.event_metadata = event_metadata;
        standardOddsManyBookmakers.set(eventBookmakerKey, standardOdds);
      }

    console.log({
      market: odd.betTypeID,
      side: odd.sideID,
      bookmaker: bookmakerName,
      bookmakerData
    });

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
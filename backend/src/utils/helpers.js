function transformSGOapi(event) {
    return {
      eventId: event.eventID,
      sport: event.sportID,
      league: event.leagueID,

      homeTeam: event.teams.home.names.long,
      awayTeam: event.teams.away.names.long,

      startTime: event.status.startsAt,

      odds: Object.values(event.odds)
      .filter(
        (odd) => 
          odd.betTypeID === "ml" &&              // Moneyline bet type
          odd.periodID === "game" &&             // Full game period (not 1st inning, 5-inning, etc.)
          odd.bookOddsAvailable === true         // Odds available from bookmakers
      )
      .map((odd) => {
        return {
          oddID: odd.oddID,
          marketName: odd.marketName,
          sideID: odd.sideID,

          // Transform bookmaker odds object into array of bookmaker entries
          bookmakers: Object.entries(odd.byBookmaker ?? {})
            .filter(([bookmakerName, bookmakerData]) => bookmakerData.available === true)
            .map(([bookmakerName, bookmakerData]) => {
              return {
                bookmaker: bookmakerName,
                odds: bookmakerData.odds,
                available: bookmakerData.available
              };
            })
          };
        })
      .filter(odd => odd.bookmakers.length > 0) // Filter out odds with no available bookmakers
    };
}

// I think i still need to convert the data into the format that is specified in the standardOddsFormat

module.exports = {
  transformSGOapi
};

//small reusable helper functions
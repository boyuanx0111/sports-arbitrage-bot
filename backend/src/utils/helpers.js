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
          odd.betTypeID === "ml" && odd.periodID === "game" && odd.bookOddsAvailable === true
      )
      .map((odd) => {
        return {
          oddID: odd.oddID,
          marketName: odd.marketName,
          sideID: odd.sideID,

          bookmakers: Object.entries(odd.byBookmaker ?? {})
            .map(([bookmakerName, bookmakerData]) => {
              return {
                bookmaker: bookmakerName,
                odds: bookmakerData.odds,
                available: bookmakerData.available
              };
            })
          };
        })
    };
}

module.exports = {
  transformSGOapi
};

//small reusable helper functions
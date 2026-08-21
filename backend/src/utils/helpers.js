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

  relevantOdds.forEach((odd) => {
    Object.entries(odd.byBookmaker ?? {}).forEach(([bookmakerName, bookmakerData]) => {
      // As entries returns the key as the 0th index, value as 1st index
      if (!bookmakerData.available) return;

      const line = odd.betTypeID === "sp" ? Number(bookmakerData.spread) : Number(bookmakerData.overUnder);

      const eventBookmakerKey =
        `${event.eventID}_${bookmakerName}-${odd.betTypeID}-${odd.periodID}-${odd.statID}-${odd.statEntityID}-${line}`;

      let standardOdds = standardOddsManyBookmakers.get(eventBookmakerKey);
      if (!standardOdds) {
        standardOdds = createStandardOdds(event.eventID, bookmakerName, odd.betTypeID);

        standardOdds.event_metadata = event_metadata;

        //extra grouping for ou etc.
        standardOdds.periodID = odd.periodID;
        standardOdds.statID = odd.statID;
        standardOdds.statEntityID = odd.statEntityID;
        standardOdds.line = line;

        standardOddsManyBookmakers.set(eventBookmakerKey, standardOdds);
      }

      addOutcome(standardOdds, odd.sideID, convertAmericanOddToDecimal(bookmakerData.odds));
    });
  });

  return Array.from(standardOddsManyBookmakers.values());
}

function transformUKOddsAPI(event) {
  const transformed = [];

  if (!event || !Array.isArray(event.markets)) {
    return transformed;
  }

  // UK Odds API gives us event-level metadata
  const eventMetadata = {
    eventID: event.event_id,
    homeTeam: null,
    awayTeam: null,
    sport: "football",
    league: event.competition,
    startTime: event.kickoff_utc
  };

  // event_title is normally "Home Team vs Away Team"
  if (event.event_title) {
    const separator = event.event_title.includes(" vs ")
      ? " vs "
      : event.event_title.includes(" v ")
        ? " v "
        : null;

    if (separator) {
      const [homeTeam, awayTeam] = event.event_title.split(separator);

      eventMetadata.homeTeam = homeTeam?.trim();
      eventMetadata.awayTeam = awayTeam?.trim();
    }
  }

  for (const market of event.markets) {

    if (!Array.isArray(market.selections)) {
      continue;
    }

    const marketType = mapUKMarketToStandard(market);

    // Ignore markets that our arbitrage logic does not understand
    if (!marketType) {
      continue;
    }

    // Group selections by bookmaker
    const bookmakers = new Map();

    for (const selection of market.selections) {

      if (
        !selection ||
        typeof selection.odds !== "number" ||
        !Number.isFinite(selection.odds) ||
        selection.odds <= 1 ||
        !selection.bookmaker_name
      ) {
        continue;
      }

      if (selection.status && selection.status.toLowerCase() !== "active") {
        continue;
      }

      const bookmakerKey =
        selection.bookmaker_code || selection.bookmaker_name;

      if (!bookmakers.has(bookmakerKey)) {
        bookmakers.set(bookmakerKey, {
          bookmaker: selection.bookmaker_name,
          bookmakerCode: selection.bookmaker_code,
          outcomes: []
        });
      }

      const bookmaker = bookmakers.get(bookmakerKey);

      const outcome = normaliseSelection(
        selection,
        marketType,
        eventMetadata
      );

      if (outcome) {
        bookmaker.outcomes.push(outcome);
      }
    }

    // Create one standardOdds object per bookmaker
    for (const bookmaker of bookmakers.values()) {

      if (bookmaker.outcomes.length === 0) {
        continue;
      }

      // OVER / UNDER
      if (marketType === "ou") {

        const outcomesByLine = new Map();

        for (const outcome of bookmaker.outcomes) {

          const line = outcome.line;

          if (!outcomesByLine.has(line)) {
            outcomesByLine.set(line, []);
          }

          outcomesByLine.get(line).push({
            outcome: outcome.outcome,
            odds: outcome.odds
          });
        }

        for (const [line, outcomes] of outcomesByLine) {

          transformed.push({
            eventID: eventMetadata.eventID,
            homeTeam: eventMetadata.homeTeam,
            awayTeam: eventMetadata.awayTeam,
            sport: eventMetadata.sport,
            league: eventMetadata.league,
            startTime: eventMetadata.startTime,

            bookmaker: bookmaker.bookmaker,
            bookmakerCode: bookmaker.bookmakerCode,

            marketType,
            line,
            outcomes
          });
        }

        continue;
      }



      // ASIAN HANDICAP
      if (marketType === "sp") {

        const outcomesByLine = new Map();

        for (const outcome of bookmaker.outcomes) {

          const numericLine = Number(outcome.line);

          if (!Number.isFinite(numericLine)) {
            continue;
          }

          const line = numericLine.toString();

          if (!outcomesByLine.has(line)) {
            outcomesByLine.set(line, []);
          }

          outcomesByLine.get(line).push({
            outcome: outcome.outcome,
            odds: outcome.odds
          });
        }

        for (const [line, outcomes] of outcomesByLine) {

          transformed.push({
            eventID: eventMetadata.eventID,
            homeTeam: eventMetadata.homeTeam,
            awayTeam: eventMetadata.awayTeam,
            sport: eventMetadata.sport,
            league: eventMetadata.league,
            startTime: eventMetadata.startTime,

            bookmaker: bookmaker.bookmaker,
            bookmakerCode: bookmaker.bookmakerCode,

            marketType,
            line,
            outcomes
          });
        }

        continue;
      }

      // OTHER MARKETS (YN)
      transformed.push({
        eventID: eventMetadata.eventID,
        homeTeam: eventMetadata.homeTeam,
        awayTeam: eventMetadata.awayTeam,
        sport: eventMetadata.sport,
        league: eventMetadata.league,
        startTime: eventMetadata.startTime,

        bookmaker: bookmaker.bookmaker,
        bookmakerCode: bookmaker.bookmakerCode,

        marketType,
        outcomes: bookmaker.outcomes
      });
    }
  }
  return transformed;
}

//sp should only originate from Asian Handicap
//ou should only originate from Total Goals Over/Under
//yn should only originate from Both Teams To Score
function mapUKMarketToStandard(market) {
  const name = market.market_name?.trim().toLowerCase();

  if (name === "asian handicap") {
    return "sp";
  }

  if (name === "total goals over/under") {
    return "ou";
  }

  if (name === "both teams to score") {
    return "yn";
  }

  return null;
}

function normaliseSelection(selection, marketType, eventMetadata) {

  let outcome = selection.selection_name?.trim();

  if (!outcome) {
    return null;
  }

  /*
   * Normalise football team names into the same
   * "home"/"away" convention used by the arbitrage layer.
   */

  if (
    eventMetadata.homeTeam &&
    outcome.toLowerCase() === eventMetadata.homeTeam.toLowerCase()
  ) {
    outcome = "home";
  }

  else if (
    eventMetadata.awayTeam &&
    outcome.toLowerCase() === eventMetadata.awayTeam.toLowerCase()
  ) {
    outcome = "away";
  }

  /*
   * UK Odds API uses:
   *
   * Over 2.5
   * Under 2.5
   *
   * Keep the line attached to the outcome for now.
   *
   * We can later split these into:
   *   outcome: "over"
   *   line: 2.5
   *
   * once your arbitrage grouping is line-aware.
   */

  if (marketType === "ou") {
    const lower = outcome.toLowerCase();

    if (lower.startsWith("over ")) {
      outcome = "over";
    } else if (lower.startsWith("under ")) {
      outcome = "under";
    }
  }


  if (marketType === "yn") {
    const lower = outcome.toLowerCase();

    if (lower === "yes") {
      outcome = "yes";
    } else if (lower === "no") {
      outcome = "no";
    }
  }

  return {
    outcome,
    odds: selection.odds,
    line: selection.line ?? null
  };
}

// nomralise events between the two apis 
function createEventKey(event) {
  const homeTeam =
    event.event_metadata?.homeTeam ?? event.homeTeam;

  const awayTeam =
    event.event_metadata?.awayTeam ?? event.awayTeam;

  const startTime =
    event.event_metadata?.startTime ?? event.startTime;

  const normalizedStartTime = new Date(startTime).toISOString();

  return `${homeTeam}|${awayTeam}|${normalizedStartTime}`;
}

// Create a unique key for each market based on its type and line
function createMarketKey(standardOdds) {
  const marketType = standardOdds.marketType;

  // spread
  if (marketType === "sp") {
    const line = Number(standardOdds.line);

    if (!Number.isFinite(line)) {
      return null;
    }

    // Only support half-line Asian handicaps for now:
    // ±0.5, ±1.5, ±2.5, etc.
    const absoluteLine = Math.abs(line);

    if (absoluteLine % 1 !== 0.5) {
      return null;
    }

    const outcome = standardOdds.outcomes?.[0]?.outcome;

    if (outcome !== "home" && outcome !== "away") {
      return null;
    }

    // Normalize the market from the home team's perspective:
    //
    // home -0.5 + away +0.5 -> sp|-0.5
    // home +0.5 + away -0.5 -> sp|0.5
    const homeHandicap =
      outcome === "home"
        ? line
        : -line;

    return `sp|${homeHandicap}`;
  }

  if (marketType === "ou") {
    const line = Number(standardOdds.line);

    if (!Number.isFinite(line)) {
      return null;
    }

    const statID =
      standardOdds.statID ?? "points";

    const statEntityID =
      standardOdds.statEntityID ?? "all";

    return `ou|${statID}|${statEntityID}|${line}`;
  }

  if (marketType === "yn") {
    const statID =
      standardOdds.statID ?? "bothTeamsScored";

    const statEntityID =
      standardOdds.statEntityID ?? "all";

    return `yn|${statID}|${statEntityID}`;
  }

  return null;
}

module.exports = {
  transformSGOapi,
  transformUKOddsAPI,
  createEventKey,
  createMarketKey
};

//small reusable helper functions
// This function requires some testing

A standardOddsFormat object has the below format
{
  eventID: "...",
  bookmaker: "...",
  marketType: "ml",
  event_metadata: { homeTeam: "...", awayTeam: "...", ... },
  outcomes: [
    { outcome: "...", odds: 1.92 },
    { outcome: "...", odds: 2.05 }
  ]
}

transformedEvents from the ./oddsService function getOdds is an array of arrays
Each sub array contains several standardOddsFormat objects for one singular event and there are several events stored in transformedEvents
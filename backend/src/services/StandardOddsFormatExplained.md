# UKOddsAPI standard odds format

This document describes the objects produced by `transformUKOddsAPI()` in `backend/src/utils/helpers.js`. They are a normalized representation of supported UKOddsAPI football selections. They are not the raw API response and do not use the nested `event_metadata` shape created by `createStandardOdds()` for SportsGameOdds.

## Object shape

```js
{
  eventID: "uk-event-id",
  homeTeam: "Home FC",
  awayTeam: "Away FC",
  sport: "football",
  league: "Competition name",
  startTime: "2026-10-08T19:00:00Z",
  bookmaker: "Example Bookmaker",
  bookmakerCode: "example-bookmaker",
  marketType: "ou",
  line: 2.5,
  outcomes: [
    { outcome: "over", odds: 1.92 }
  ]
}
```

Each object describes one event, bookmaker, market, and line where applicable. `transformUKOddsAPI(event)` returns a flat array of these objects; it does not return arrays nested by event. The caller later combines provider objects and groups them for arbitrage evaluation.

## Fields

| Field | Meaning |
| --- | --- |
| `eventID` | UKOddsAPI `event_id` |
| `homeTeam`, `awayTeam` | Parsed from `event_title` when it contains ` vs ` or ` v `; otherwise `null` |
| `sport` | Set to `football` |
| `league` | UKOddsAPI `competition` |
| `startTime` | UKOddsAPI `kickoff_utc` |
| `bookmaker` | Selection `bookmaker_name` |
| `bookmakerCode` | Selection `bookmaker_code`; may be absent |
| `marketType` | Normalized market code: `sp`, `ou`, or `yn` |
| `line` | Market line where relevant; omitted for `yn` |
| `outcomes` | One or more normalized selections, with decimal `odds` |

Outcome records generally have `{ outcome, odds }`. `yn` outcome records also retain `line` from the UKOddsAPI selection (or `null`).

## Supported UKOddsAPI markets

| UKOddsAPI market name | Standard `marketType` | Outcome handling |
| --- | --- | --- |
| `Asian Handicap` | `sp` | Team selections are normalized to `home` or `away`. Each side is emitted as its own object; its handicap is stored in `line`. |
| `Total Goals Over/Under` | `ou` | Selections are grouped by bookmaker and line. `Over ...` and `Under ...` become `over` and `under`. |
| `Both Teams To Score` | `yn` | `Yes` and `No` become lowercase `yes` and `no`. |

Other market names are ignored. Selections without a valid numeric decimal price greater than 1, an active status (when status is supplied), a bookmaker name, or a selection name are skipped.

## Examples

Over/under selections from one bookmaker and line are combined into an object like:

```js
{
  eventID: "uk-event-id",
  homeTeam: "Home FC",
  awayTeam: "Away FC",
  sport: "football",
  league: "Competition name",
  startTime: "2026-10-08T19:00:00Z",
  bookmaker: "Example Bookmaker",
  bookmakerCode: "example-bookmaker",
  marketType: "ou",
  line: 2.5,
  outcomes: [
    { outcome: "over", odds: 1.92 },
    { outcome: "under", odds: 1.98 }
  ]
}
```

An Asian Handicap selection is emitted separately for each side. Its `line` is normalized later by `createMarketKey()` so opposing handicap selections can be compared from the home team's perspective.

## Where the format is used

`getOdds()` calls `transformUKOddsAPI()` for each UKOddsAPI event, combines those objects with transformed SportsGameOdds data, and groups matching events and markets before calling the arbitrage service. UKOddsAPI objects use top-level event fields; other provider transforms may use `event_metadata` instead. `createEventKey()` supports both shapes.

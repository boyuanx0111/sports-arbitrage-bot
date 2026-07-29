# Backend Route and Function Flow

## Overview

This document explains the backend route flow in `sports-arbitrage-bot/backend`, showing how incoming HTTP requests reach the actual function implementations.

The main routes are:

- `GET /health`
- `GET /odds`
- `POST /arbitrage`

---

## Server startup

File: `backend/src/server.js`

- Loads environment variables: `require("dotenv").config()`
- Imports the Express app: `const app = require("./app");`
- Imports config: `const { PORT, SPORTSGAMEODDS } = require("./config");`
- Starts the server:
  - `app.listen(PORT, ...)`

---

## App routing

File: `backend/src/app.js`

Route mounting:

- `app.use("/health", healthRoutes);`
- `app.use("/odds", oddsRoutes);`
- `app.use("/arbitrage", arbitrageRoutes);`

This means:

- `GET /health` → `backend/src/routes/health.js`
- `GET /odds` → `backend/src/routes/odds.js`
- `POST /arbitrage` → `backend/src/routes/arbitrage.js`

---

## Route: GET /health

### Path
`GET http://localhost:3000/health`

### Flow

1. `backend/src/app.js`
2. `backend/src/routes/health.js`
3. `backend/src/controllers/healthController.js`
4. `backend/src/services/healthService.js`

### Implemented functions

- `backend/src/routes/health.js`
  - `router.get("/", getHealth);`

- `backend/src/controllers/healthController.js`
  - `function getHealth(req, res)`

- `backend/src/services/healthService.js`
  - `function getHealthStatus()`

---

## Route: GET /odds

### Path
`GET http://localhost:3000/odds`

### Flow

1. `backend/src/app.js`
2. `backend/src/routes/odds.js`
3. `backend/src/controllers/oddsController.js`
4. `backend/src/services/oddsService.js`
5. `backend/src/utils/helpers.js`
6. `backend/src/utils/standardOddsFormat.js`

### Implemented functions

- `backend/src/routes/odds.js`
  - `router.get("/", fetchOdds);`

- `backend/src/controllers/oddsController.js`
  - `async function fetchOdds(req, res)`

- `backend/src/services/oddsService.js`
  - `async function getOdds()`

- `backend/src/utils/helpers.js`
  - `function transformSGOapi(event)`

- `backend/src/utils/standardOddsFormat.js`
  - `function createStandardOdds(eventID, bookmaker, marketType)`
  - `function addOutcome(standardOdds, outcome, odds)`
  - `function convertAmericanOddToDecimal(americanOdd)`

### Data transformation structure

`getOdds()` does:

- `response.data.data.map(transformSGOapi)`

So `transformedEvents` is:

```text
[
  [ standardOddsObject, standardOddsObject, ... ], // first event
  [ standardOddsObject, ... ],                     // second event
  ...
]

Each standardOddsObject looks like:

{
  eventID: "...",
  bookmaker: "...",
  marketType: "ml",
  event_metadata: {
    homeTeam: "...",
    awayTeam: "...",
    sport: "...",
    league: "...",
    startTime: "..."
  },
  outcomes: [
    { outcome: "...", odds: 1.92 },
    { outcome: "...", odds: 2.05 }
  ]
}
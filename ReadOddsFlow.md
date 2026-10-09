# Backend request and odds flow

This note follows the current implementation in `backend/src`. The HTTP layers are intentionally thin: routes dispatch to controllers, which call services for application logic.

## Server startup

`backend/src/server.js` loads `backend/.env`, initializes the shared event caches, starts their refresh jobs, and listens on the configured port. The simulation has a separate event list and refresh schedule; it starts only when `/simulations/start` is called.

## Routes

| Route | Implementation |
| --- | --- |
| `GET /health` | `routes/health.js` → `controllers/healthController.js` → `services/healthService.js` |
| `GET /odds` | `routes/odds.js` → `controllers/oddsController.js` → `services/oddsService.js` |
| `POST /arbitrage` | `routes/arbitrage.js` → `controllers/arbitrageController.js` → `services/arbitrageService.js` |
| `/simulations` | `routes/simulations.js` → `controllers/simulationController.js` → `services/simulationService.js` |
| `/cache` | `routes/cacheRoutes.js` → `controllers/cacheController.js` → `services/eventRefreshService.js` and `services/eventCacheService.js` |
| `/debug` | `routes/debugRoutes.js` → `controllers/debugController.js` |

## Regular odds request

`GET /odds` calls `getOdds()` without options. The service requests a shared event-cache refresh and reads the cached SportsGameOdds and UKOddsAPI event IDs. It fetches current odds for those events, transforms both providers into the standard odds shape, groups matching event/market data, and passes each market to `findArbitrageOpportunities`.

The response includes `combinedArbitrageOpportunities` and `totalProfit`. Provider event caches are process-local. The API keys are read from `backend/.env` through `backend/src/config/index.js`.

## Simulation odds request

The simulation calls `getOdds({ ukEvents })`. Supplying `ukEvents` tells the odds service to use the simulation's separately refreshed UK event list and not read or refresh the shared provider caches. The simulation event list is refreshed from UKOddsAPI, then reused for scans; odds are fetched again on each scan and immediately before a delayed placement.

Simulation sequence:

1. `POST /simulations/start` configures in-memory state and starts event refresh and scan timers.
2. Each scan filters to standard match-winner markets by default, records new opportunities as pending, and schedules a placement check.
3. At placement time, current odds are fetched again. An opportunity that disappeared is cancelled; one already simulated is skipped as a duplicate.
4. A still available opportunity is stored with status `simulated`. Assumed winnings use `minimumProfit` when available, otherwise `guaranteedProfit`. The service does not wait for match results.
5. `GET /simulations` returns current process-local state; `POST /simulations/stop` clears scan and pending-placement timers.

The simulation is intended to be monitored through Discord rather than a web dashboard. Each scan compares the current actionable opportunities with the previous scan and sends a webhook report when opportunities appear or disappear. Reports include current opportunity details and total theoretical guaranteed profit. Set `DISCORD_WEBHOOK_URL` in `backend/.env` to enable delivery; delivery can be disabled with `DISCORD_NOTIFICATIONS_ENABLED=false`. A missing webhook does not stop scanning or simulated placements.

The simulation's stake calculation currently comes from `getOdds`/`findArbitrageOpportunities`, which uses a £100 calculation bankroll. The simulation's configurable bankroll is reported as state but does not alter that calculation yet.

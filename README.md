# Sports Arbitrage Bot

A proof of concept for finding sports betting arbitrage and tracking hypothetical placements. **UKOddsAPI is the primary odds source for the simulation:** it supplies the football event list and fresh prices used during scans and placement checks. SportsGameOdds is an optional additional source for the shared odds scan. The simulation filters opportunities, waits before placement, and checks whether an opportunity is still available before recording a simulated bet. It does not place real bets or determine match results.

**Discord is the intended output for the simulation.** The scanner sends a Discord webhook report when actionable opportunities appear or disappear, including the current opportunity details and total theoretical guaranteed profit.

## Current

- Uses UKOddsAPI as the primary simulation event and odds source; SportsGameOdds can contribute to the shared odds scan.
- Converts provider responses into a shared odds format and finds arbitrage opportunities.
- Runs a configurable simulation through the `/simulations` API.
- Keeps event and odds caches in memory; simulated history is also in memory and resets when the server restarts.
- Provides health, odds, arbitrage calculation, cache, and debug endpoints.

The simulation is operated through the API. UKOddsAPI is required for simulation event discovery. 

## Simulation flow

1. Start the backend npm run dev
2. Start the simulation with `POST /simulations/start`.
3. The service refreshes its own UK event list and scans fresh odds at the configured interval.
4. Each newly discovered opportunity waits for the placement delay, to try to prevent unstable arbs. Before recording it, the service fetches odds again; missing or duplicate opportunities are cancelled or skipped.
5. A surviving opportunity is recorded as `simulated`. Profit is assumed from the opportunity's `minimumProfit`; match outcomes are not checked due to nature of arbitrage bet.

During each scan, actionable opportunity changes are also sent to Discord. Configure `DISCORD_WEBHOOK_URL` in `backend/.env` to receive these reports. Set `DISCORD_NOTIFICATIONS_ENABLED=false` to disable delivery. Delivery is queued and retried, and long reports are split to fit Discord message limits. Without a webhook URL, simulation and placement continue but no Discord message can be delivered.

The simulation starts with a bankroll setting, but current opportunity stake calculations are made by the arbitrage scan with a fixed £100 bankroll. The displayed simulation bankroll is configuration/status data and is not yet used to scale those stakes.

## Getting started

Requirements: Node.js and npm.

```bash
git clone https://github.com/boyuanx0111/sports-arbitrage-bot.git
cd sports-arbitrage-bot/backend
npm install
cp .env.example .env
```

In Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

Edit `backend/.env` and add your `UKODDS_API_KEY`. This key is required to run the simulation. Add `SPORTSGAMEODDS_KEY` if you also want that provider included in the shared odds scan, then start the backend:

```bash
npm run dev
```

The backend listens on port `3000` by default. At least one provider key is needed to start the backend; the simulation specifically requires `UKODDS_API_KEY`.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Backend port |
| `UKODDS_API_KEY` | — | Primary simulation data source; required for simulation event discovery and scans |
| `SPORTSGAMEODDS_KEY` | — | Optional additional provider for the shared odds scan |
| `UKODDS_BASE_URL` | `https://api.ukoddsapi.com` | UKOddsAPI base URL |
| `SIMULATION_BANKROLL` | `100` | Bankroll value reported by the simulation |
| `SIMULATION_PLACEMENT_DELAY_MS` | `120000` | Delay before rechecking a discovered opportunity |
| `SIMULATION_SCAN_INTERVAL_MS` | `60000` | Time between simulation scans |
| `SIMULATION_STANDARD_MATCH_WINNER_ONLY` | `true` | Restrict simulation to standard match-winner markets |
| `DISCORD_WEBHOOK_URL` | — | Discord channel webhook used for simulation opportunity reports |
| `DISCORD_NOTIFICATIONS_ENABLED` | enabled | Set to `false` to disable Discord delivery |

The start endpoint can override the four simulation settings using `bankroll`, `placementDelayMs`, `scanIntervalMs`, and `standardMatchWinnerOnly` in its JSON body.

## API

All routes are served from the backend origin (for example `http://localhost:3000`).

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Health status |
| `GET` | `/odds` | Refresh/read provider event caches, fetch odds, and return combined arbitrage opportunities |
| `POST` | `/arbitrage` | Calculate stakes and returns from `{ "odds": [2.1, 2.1], "bankroll": 100 }` |
| `GET` | `/simulations` | Read simulation status, counters, cached event IDs, pending opportunities, and simulated bets |
| `POST` | `/simulations/start` | Start the simulation; optional JSON settings described above |
| `POST` | `/simulations/stop` | Stop scans and pending placement timers |
| `GET` | `/cache/events` | Inspect shared provider event caches |
| `POST` | `/cache/refresh-events` | Refresh UK provider event cache |
| `POST` | `/cache/refresh-sgo-events` | Refresh SportsGameOdds event cache |
| `GET` | `/debug/active-leagues` | Inspect enabled and configured SportsGameOdds leagues |
| `GET` | `/debug/arbitrage-test` | Run the built-in example-data calculation and return its results |

See [ReadOddsFlow.md](ReadOddsFlow.md) for the odds and route flow. Simulation state is process-local and is cleared on restart.

## Project layout

```text
backend/
  src/
    automation/   # Bookmaker bet-placing automation (under dev)
    config/       # Provider and server configuration
    controllers/  # HTTP request handlers
    routes/       # Express route definitions
    services/     # Odds, arbitrage, cache, notification, and simulation logic
    utils/        # Odds transforms, validation, calculations, and logging
  tests/          # Node test-runner tests
```

## License

MIT. See [LICENSE](LICENSE).

## Authors

Brian Xu and Abhinav Pandley 

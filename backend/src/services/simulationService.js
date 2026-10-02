const { getOdds } = require("./oddsService");
const { refreshSimulationEvents } = require("./eventRefreshService");

const DEFAULT_BANKROLL = 100;
const DEFAULT_PLACEMENT_DELAY_MS = 2 * 60 * 1000;
const DEFAULT_SCAN_INTERVAL_MS = 60 * 1000;

const state = {
  running: false,
  startedAt: null,
  lastScanAt: null,
  lastError: null,
  bankroll: DEFAULT_BANKROLL,
  totalProfit: 0,
  totalStaked: 0,
  opportunitiesDiscovered: 0,
  betsPlaced: 0,
  betsCancelled: 0,
  betsSimulated: 0,
  opportunitiesSkipped: 0,
  pending: [],
  bets: [],
  timers: new Set(),
  scanTimer: null,
  config: {},
  scanInFlight: false
};

function number(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function configure(options = {}) {
  state.config = {
    bankroll: number(options.bankroll, number(process.env.SIMULATION_BANKROLL, DEFAULT_BANKROLL)),
    placementDelayMs: number(options.placementDelayMs, number(process.env.SIMULATION_PLACEMENT_DELAY_MS, DEFAULT_PLACEMENT_DELAY_MS)),
    scanIntervalMs: number(options.scanIntervalMs, number(process.env.SIMULATION_SCAN_INTERVAL_MS, DEFAULT_SCAN_INTERVAL_MS)),
    standardMatchWinnerOnly: options.standardMatchWinnerOnly !== undefined
      ? options.standardMatchWinnerOnly !== false
      : process.env.SIMULATION_STANDARD_MATCH_WINNER_ONLY !== "false"
  };
  state.bankroll = state.config.bankroll;
}

function snapshotOpportunity(opportunity) {
  return JSON.parse(JSON.stringify(opportunity));
}

function sameOpportunity(a, b) {
  return a && b && a.eventID === b.eventID && a.marketKey === b.marketKey;
}

function isStandardMatchWinner(opportunity) {
  const marketType = String(opportunity.marketType || opportunity.market || "").toLowerCase();
  const acceptedMarkets = new Set(["ml", "1x2", "match winner", "match_winner", "winner", "moneyline", "h2h"]);
  const outcomes = (opportunity.legs || []).map(leg => String(leg.outcome || "").toLowerCase());
  return acceptedMarkets.has(marketType) && outcomes.length >= 2 && outcomes.length <= 3 &&
    outcomes.every(outcome => ["home", "away", "draw"].includes(outcome));
}

function schedule(fn, delay) {
  const timer = setTimeout(() => {
    state.timers.delete(timer);
    fn().catch(error => {
      state.lastError = error.message;
      console.error("Simulation task failed:", error);
    });
  }, delay);
  state.timers.add(timer);
}

async function scan() {
  if (!state.running || state.scanInFlight) return;
  state.scanInFlight = true;
  state.lastScanAt = new Date().toISOString();
  try {
    // Simulation scans across every league currently exposed by the providers.
    await refreshSimulationEvents();
    const result = await getOdds();
    const opportunities = result.combinedArbitrageOpportunities || [];

    for (const opportunity of opportunities) {
      if (state.config.standardMatchWinnerOnly && !isStandardMatchWinner(opportunity)) {
        state.opportunitiesSkipped += 1;
        continue;
      }
      const alreadyTracked = state.pending.some(item => sameOpportunity(item.opportunity, opportunity)) ||
        state.bets.some(item => sameOpportunity(item.opportunity, opportunity) && ["pending", "placed"].includes(item.status));
      if (alreadyTracked) continue;

      state.opportunitiesDiscovered += 1;
      const pending = {
        id: `sim-${Date.now()}-${state.opportunitiesDiscovered}`,
        status: "waiting",
        discoveredAt: new Date().toISOString(),
        placeAt: new Date(Date.now() + state.config.placementDelayMs).toISOString(),
        opportunity: snapshotOpportunity(opportunity)
      };
      state.pending.push(pending);
      schedule(() => attemptPlacement(pending), state.config.placementDelayMs);
    }
  } finally {
    state.scanInFlight = false;
  }
}

async function attemptPlacement(pending) {
  const index = state.pending.indexOf(pending);
  if (index !== -1) state.pending.splice(index, 1);
  if (!state.running) return;

  const fresh = await getOdds();
  const current = (fresh.combinedArbitrageOpportunities || []).find(item => sameOpportunity(item, pending.opportunity));
  if (!current) {
    pending.status = "cancelled";
    pending.cancelledAt = new Date().toISOString();
    state.betsCancelled += 1;
    state.bets.unshift(pending);
    return;
  }

  const stake = (current.stakes || []).reduce((sum, value) => sum + Number(value || 0), 0);
  const bet = {
    ...pending,
    status: "simulated",
    placedAt: new Date().toISOString(),
    stake,
    profit: Number(current.guaranteedProfit || 0),
    assumedWinnings: Number(current.guaranteedProfit || 0),
    opportunity: snapshotOpportunity(current)
  };
  state.totalStaked += stake;
  state.betsPlaced += 1;
  state.totalProfit += bet.profit;
  state.betsSimulated += 1;
  state.bets.unshift(bet);
}

function start(options = {}) {
  if (state.running) return getStatus();
  configure(options);
  state.running = true;
  state.startedAt = new Date().toISOString();
  state.lastError = null;
  const run = async () => {
    try { await scan(); } catch (error) { state.lastError = error.message; console.error("Simulation scan failed:", error); }
  };
  run();
  state.scanTimer = setInterval(run, state.config.scanIntervalMs);
  return getStatus();
}

function stop() {
  state.running = false;
  if (state.scanTimer) clearInterval(state.scanTimer);
  state.scanTimer = null;
  for (const timer of state.timers) clearTimeout(timer);
  state.timers.clear();
  return getStatus();
}

function getStatus() {
  return {
    running: state.running,
    startedAt: state.startedAt,
    lastScanAt: state.lastScanAt,
    lastError: state.lastError,
    bankroll: state.bankroll,
    totalProfit: Number(state.totalProfit.toFixed(2)),
    totalStaked: Number(state.totalStaked.toFixed(2)),
    opportunitiesDiscovered: state.opportunitiesDiscovered,
    betsPlaced: state.betsPlaced,
    betsCancelled: state.betsCancelled,
    betsSimulated: state.betsSimulated,
    opportunitiesSkipped: state.opportunitiesSkipped,
    pending: state.pending,
    bets: state.bets,
    config: state.config
  };
}

configure();
module.exports = { start, stop, getStatus };

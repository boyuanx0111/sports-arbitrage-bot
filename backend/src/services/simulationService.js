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
  scanInFlight: false,
  eventRefreshTimer: null,
  eventRefreshInFlight: false,
  eventRefreshPromise: null,
  simulationEvents: [],
  simulationEventsUpdatedAt: null
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
  if (!a || !b) return false;
  const eventA = a.eventID || a.eventKey;
  const eventB = b.eventID || b.eventKey;
  return eventA === eventB && a.marketKey === b.marketKey;
}

function hasSimulatedOpportunity(opportunity, excluding = null) {
  return state.bets.some(item => item !== excluding &&
    sameOpportunity(item.opportunity, opportunity) && item.status === "simulated");
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
    // Refresh the broad event ID list once daily; fetch fresh odds for those IDs
    // during every scan.
    await ensureSimulationEventsFresh();
    const result = await getOdds({ ukEvents: state.simulationEvents });
    const opportunities = result.combinedArbitrageOpportunities || [];

    for (const opportunity of opportunities) {
      if (state.config.standardMatchWinnerOnly && !isStandardMatchWinner(opportunity)) {
        state.opportunitiesSkipped += 1;
        continue;
      }
      const alreadyTracked = state.pending.some(item => sameOpportunity(item.opportunity, opportunity)) ||
        state.bets.some(item => sameOpportunity(item.opportunity, opportunity) && ["pending", "placed", "simulated"].includes(item.status));
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

  // A second pending copy may already have reached placement (for example,
  // after a stop/start). Never simulate the same event and market twice.
  if (hasSimulatedOpportunity(pending.opportunity)) {
    pending.status = "duplicate";
    pending.cancelledAt = new Date().toISOString();
    state.opportunitiesSkipped += 1;
    state.bets.unshift(pending);
    return;
  }

  const fresh = await getOdds({ ukEvents: state.simulationEvents });
  const current = (fresh.combinedArbitrageOpportunities || []).find(item => sameOpportunity(item, pending.opportunity));
  if (!current) {
    pending.status = "cancelled";
    pending.cancelledAt = new Date().toISOString();
    state.betsCancelled += 1;
    state.bets.unshift(pending);
    return;
  }

  if (hasSimulatedOpportunity(current)) {
    pending.status = "duplicate";
    pending.cancelledAt = new Date().toISOString();
    state.opportunitiesSkipped += 1;
    state.bets.unshift(pending);
    return;
  }

  const stake = (current.stakes || []).reduce((sum, value) => sum + Number(value || 0), 0);
  const minimumProfit = Number(current.minimumProfit ?? current.guaranteedProfit);
  const assumedWinnings = Number.isFinite(minimumProfit)
    ? minimumProfit
    : Number(current.guaranteedProfit || 0);
  const bet = {
    ...pending,
    status: "simulated",
    placedAt: new Date().toISOString(),
    stake,
    profit: assumedWinnings,
    assumedWinnings,
    resultDetection: "Assumed winnings are set to minimumProfit; match results are not checked.",
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
  ensureSimulationEventsFresh().catch(error => {
    state.lastError = error.message;
    console.error("Simulation event refresh failed:", error);
  });
  state.eventRefreshTimer = setInterval(() => {
    ensureSimulationEventsFresh(true).catch(error => {
      state.lastError = error.message;
      console.error("Simulation event refresh failed:", error);
    });
  }, 24 * 60 * 60 * 1000);
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
  if (state.eventRefreshTimer) clearInterval(state.eventRefreshTimer);
  state.scanTimer = null;
  state.eventRefreshTimer = null;
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
    config: state.config,
    cachedEventCount: state.simulationEvents.length,
    cachedEventIDs: state.simulationEvents.map(event => event.event_id),
    eventCacheUpdatedAt: state.simulationEventsUpdatedAt,
    assumedWinningsRule: "minimumProfit; no match-result detection is performed"
  };
}

async function ensureSimulationEventsFresh(force = false) {
  if (state.eventRefreshPromise) return state.eventRefreshPromise;
  const lastUpdated = state.simulationEventsUpdatedAt;
  if (!force && lastUpdated && Date.now() - lastUpdated.getTime() < 24 * 60 * 60 * 1000) return;
  state.eventRefreshInFlight = true;
  state.eventRefreshPromise = refreshSimulationEvents().then(result => {
    state.simulationEvents = result.events || [];
    state.simulationEventsUpdatedAt = result.updatedAt;
    return result;
  });
  try { await state.eventRefreshPromise; }
  finally {
    state.eventRefreshInFlight = false;
    state.eventRefreshPromise = null;
  }
}

configure();
module.exports = { start, stop, getStatus };

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { API_FOOTBALL } = require("../config");

const storePath = path.join(__dirname, "..", "data", "matches.json");
fs.mkdirSync(path.dirname(storePath), { recursive: true });
let matches = fs.existsSync(storePath) ? JSON.parse(fs.readFileSync(storePath, "utf8")) : {};
const timers = new Map();
const FINAL_STATUSES = new Set(["FT", "AET", "PEN"]);

function save() { fs.writeFileSync(storePath, JSON.stringify(matches, null, 2)); }
function text(value) { return String(value || "").trim().toLowerCase(); }
function expectedEnd(event) {
  const direct = event.expected_end_utc || event.expected_end || event.end_time_utc;
  if (direct) return new Date(direct).toISOString();
  return new Date(new Date(event.kickoff_utc).getTime() + 115 * 60 * 1000).toISOString();
}

async function footballRequest(params) {
  if (!API_FOOTBALL.API_KEY) throw new Error("API_FOOTBALL_KEY is not configured");
  const response = await axios.get(`${API_FOOTBALL.BASE_URL}/fixtures`, {
    headers: { "x-apisports-key": API_FOOTBALL.API_KEY }, params
  });
  return response.data.response || [];
}

async function resolveOddsEvent(event) {
  if (!event?.event_id) throw new Error("UK Odds event_id is required");
  if (matches[event.event_id]?.api_football_fixture_id) return matches[event.event_id];
  const leagueId = API_FOOTBALL.LEAGUE_MAP[event.competition || event.league_name];
  const kickoff = new Date(event.kickoff_utc);
  const candidates = await footballRequest({
    ...(leagueId ? { league: leagueId } : {}),
    date: kickoff.toISOString().slice(0, 10)
  });
  const tolerance = API_FOOTBALL.KICKOFF_TOLERANCE_MINUTES * 60 * 1000;
  const matching = candidates.filter(item => {
    const fixtureTime = new Date(item.fixture?.date).getTime();
    return text(item.teams?.home?.name) === text(event.home_team || event.homeTeam) &&
      text(item.teams?.away?.name) === text(event.away_team || event.awayTeam) &&
      Math.abs(fixtureTime - kickoff.getTime()) <= tolerance;
  });
  if (matching.length !== 1) {
    const status = matching.length > 1 ? "manual_review" : "fixture_mapping_unresolved";
    matches[event.event_id] = { uk_odds_event_id: event.event_id, settlement_status: status };
    save();
    return matches[event.event_id];
  }
  const fixture = matching[0];
  const record = {
    id: `match-${event.event_id}`,
    uk_odds_event_id: event.event_id,
    api_football_fixture_id: fixture.fixture.id,
    competition: event.competition || event.league_name,
    season: fixture.league?.season,
    home_team: event.home_team || event.homeTeam,
    away_team: event.away_team || event.awayTeam,
    kickoff_utc: new Date(event.kickoff_utc).toISOString(),
    expected_end_utc: expectedEnd(event),
    settlement_status: "fixture_resolved",
    result_status: null,
    result_checked_at: null
  };
  matches[event.event_id] = record;
  save();
  return record;
}

async function settleBet(bet, event) {
  const match = await resolveOddsEvent(event);
  if (!match.api_football_fixture_id || ["manual_review", "fixture_mapping_unresolved"].includes(match.settlement_status)) return { status: match.settlement_status };
  const due = new Date(match.expected_end_utc).getTime() + API_FOOTBALL.SETTLEMENT_BUFFER_MINUTES * 60000;
  if (Date.now() < due) return { status: "NOT_READY_FOR_SETTLEMENT", match };
  const result = (await footballRequest({ id: match.api_football_fixture_id }))[0];
  if (!result) return { status: "RESULT_NOT_FOUND", match };
  const status = result.fixture?.status?.short;
  match.result_checked_at = new Date().toISOString();
  match.result_status = status;
  if (!FINAL_STATUSES.has(status)) { match.settlement_status = "result_not_final"; save(); return { status: "RESULT_NOT_FINAL", match }; }
  const goals = result.goals || {};
  const score = result.score || {};
  if (!Number.isFinite(goals.home) || !Number.isFinite(goals.away)) return { status: "MISSING_SCORE", match };
  Object.assign(match, {
    settlement_status: "settled", home_score: goals.home, away_score: goals.away,
    halftime_home: score.halftime?.home ?? null, halftime_away: score.halftime?.away ?? null,
    fulltime_home: score.fulltime?.home ?? null, fulltime_away: score.fulltime?.away ?? null,
    extratime_home: score.extratime?.home ?? null, extratime_away: score.extratime?.away ?? null,
    penalty_home: score.penalty?.home ?? null, penalty_away: score.penalty?.away ?? null
  });
  save();
  return { status: "SETTLED", match, result };
}

function schedule(bet, event, callback) {
  const key = bet.id;
  if (timers.has(key)) return;
  const match = matches[event.event_id];
  const due = match ? new Date(match.expected_end_utc).getTime() + API_FOOTBALL.SETTLEMENT_BUFFER_MINUTES * 60000 : Date.now();
  const timer = setTimeout(async function check() {
    timers.delete(key);
    try {
      const result = await settleBet(bet, event);
      if (["NOT_READY_FOR_SETTLEMENT", "RESULT_NOT_FINAL", "RESULT_NOT_FOUND", "MISSING_SCORE"].includes(result.status)) schedule(bet, event, callback);
      else callback(result);
    } catch (error) { callback({ status: "RESULT_CHECK_ERROR", error: error.message }); }
  }, Math.max(0, due - Date.now()));
  timers.set(key, timer);
}

module.exports = { resolveOddsEvent, settleBet, schedule };

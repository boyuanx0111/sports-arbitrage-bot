const test = require("node:test");
const assert = require("node:assert/strict");
const axios = require("axios");
const { processArbNotifs, resetNotificationState, formatStatus } = require("../src/services/notificationPreprocessing");
const { splitMessage } = require("../src/services/notificationService");

const originalPost = axios.post;
const sent = [];

function opportunity(eventKey, marketKey, updates = {}) {
  return {
    eventKey,
    marketKey,
    eventID: `id-${eventKey}`,
    homeTeam: eventKey,
    awayTeam: "Visitors",
    startTime: "2026-09-20T23:00:00Z",
    marketType: "ml",
    line: null,
    isArbitrage: true,
    guaranteedProfit: 2.5,
    legs: [
      { outcome: "home", bookmaker: "Book A", odds: 2.2, stake: 50 },
      { outcome: "away", bookmaker: "Book B", odds: 2.2, stake: 50 }
    ],
    ...updates
  };
}

test.beforeEach(() => {
  sent.length = 0;
  resetNotificationState();
  process.env.DISCORD_WEBHOOK_URL = "https://discord.test/webhook";
  delete process.env.DISCORD_NOTIFICATIONS_ENABLED;
  axios.post = async (_url, payload) => { sent.push(payload.content); return { status: 204 }; };
});

test.after(() => { axios.post = originalPost; });

test("only sends on NEW/LOST and includes the full current scanner status", async () => {
  assert.equal((await processArbNotifs([], 0)).sent, false);
  await processArbNotifs([opportunity("A", "ml")], 2.5);
  assert.equal(sent.length, 1);
  assert.match(sent[0], /NEW OPPORTUNITY/);
  assert.match(sent[0], /Active Opportunities: 1/);
  assert.match(sent[0], /Bookmaker: Book A/);
  await processArbNotifs([opportunity("A", "ml", { guaranteedProfit: 9, legs: [
    { outcome: "home", bookmaker: "New Book", odds: 3.4, stake: 25 },
    { outcome: "away", bookmaker: "Book B", odds: 3.4, stake: 25 }
  ] })], 9);
  assert.equal(sent.length, 1);
  await processArbNotifs([opportunity("A", "ml"), opportunity("B", "ml")], 5);
  assert.equal(sent.length, 2);
  assert.match(sent[1], /NEW OPPORTUNITY/);
  assert.match(sent[1], /Active Opportunities: 2/);
  assert.match(sent[1], /A vs Visitors/);
  assert.match(sent[1], /B vs Visitors/);
  await processArbNotifs([opportunity("B", "ml")], 2.5);
  assert.equal(sent.length, 3);
  assert.match(sent[2], /LOST OPPORTUNITY/);
  assert.match(sent[2], /Active Opportunities: 1/);
  await processArbNotifs([], 0);
  assert.equal(sent.length, 4);
  assert.match(sent[3], /Active Opportunities: 0/);
  assert.match(sent[3], /No active arbitrage opportunities/);
});

test("filters alert-only and malformed objects and handles eligibility transitions", async () => {
  const alert = opportunity("alert", "ml", { alert: "below threshold", guaranteedProfit: 0 });
  await processArbNotifs([alert, {}, null], 0);
  assert.equal(sent.length, 0);
  await processArbNotifs([opportunity("A", "ml")], 2.5);
  await processArbNotifs([], 0);
  await processArbNotifs([opportunity("A", "ml")], 2.5);
  assert.equal(sent.length, 3);
  assert.match(sent[1], /LOST/);
  assert.match(sent[2], /NEW/);
});

test("combines multiple changes and reports zero total profit for an empty status", async () => {
  await processArbNotifs([opportunity("A", "ml"), opportunity("B", "ml")], 5);
  await processArbNotifs([opportunity("C", "ml")], 2.5);
  assert.match(sent[1], /NEW OPPORTUNITY/);
  assert.match(sent[1], /LOST OPPORTUNITIES/);
  assert.match(sent[1], /Total Guaranteed Profit: £2.50/);
  await processArbNotifs([], 0);
  assert.match(sent[2], /Total Guaranteed Profit: £0.00/);
});

test("status formatter includes all legs and does not recalculate totals", () => {
  const item = opportunity("A", "ml", { legs: [
    { outcome: "home", bookmaker: "Book A", odds: 2.1, stake: 20 },
    { outcome: "draw", bookmaker: "Book B", odds: 4.5, stake: 30 },
    { outcome: "away", bookmaker: "Book C", odds: 3.5, stake: 50 }
  ] });
  const report = formatStatus([item], 1.23);
  assert.match(report, /Leg 3 — AWAY/);
  assert.match(report, /Event Key: A/);
  assert.match(report, /Total Guaranteed Profit: £1.23/);
});

test("splits long reports in order without exceeding Discord limits", () => {
  const parts = splitMessage(`${"first ".repeat(500)}\n${"second ".repeat(500)}`);
  assert.ok(parts.length > 1);
  assert.ok(parts.every(part => part.length <= 2000));
  assert.ok(parts.join("").includes("first"));
  assert.ok(parts.join("").includes("second"));
});

test("Discord errors return delivery failure without throwing or logging webhook credentials", async () => {
  axios.post = async () => { const error = new Error("failed"); error.response = { status: 400 }; throw error; };
  const result = await processArbNotifs([opportunity("A", "ml")], 2.5);
  assert.equal(result.success, false);
  assert.doesNotMatch(result.error, /discord\.test/);
});

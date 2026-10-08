const { sendDiscordMessage, splitReport } = require("./notificationService");

let previousOpportunities = new Map();
let deliveryQueue = Promise.resolve();

function getOpportunityID(opportunity) {
  if (!opportunity || typeof opportunity.eventKey !== "string" || !opportunity.eventKey ||
      typeof opportunity.marketKey !== "string" || !opportunity.marketKey) return null;
  return `${opportunity.eventKey}:${opportunity.marketKey}`;
}

function isActionable(opportunity) {
  if (!opportunity || typeof opportunity !== "object" || Array.isArray(opportunity)) return false;
  if (opportunity.isArbitrage !== true || opportunity.alert) return false;
  if (!getOpportunityID(opportunity)) return false;
  const profit = Number(opportunity.guaranteedProfit);
  if (!Number.isFinite(profit) || profit <= 0) return false;
  const legs = Array.isArray(opportunity.legs) ? opportunity.legs : [];
  return legs.length >= 2 && legs.every(leg => leg && typeof leg === "object" &&
    Number.isFinite(Number(leg.odds)) && Number(leg.odds) > 1 &&
    Number.isFinite(Number(leg.stake)) && Number(leg.stake) >= 0 &&
    Boolean(leg.outcome) && Boolean(leg.bookmaker));
}

function safeText(value) {
  return value === undefined || value === null || value === "" ? null : String(value);
}

function money(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? `£${amount.toFixed(2)}` : null;
}

function eventName(opportunity) {
  const home = safeText(opportunity.homeTeam);
  const away = safeText(opportunity.awayTeam);
  if (home && away) return `${home} vs ${away}`;
  return safeText(opportunity.eventName) || safeText(opportunity.eventID) || opportunity.eventKey;
}

function formatMarket(opportunity) {
  const market = safeText(opportunity.marketType || opportunity.market) || "Market";
  const line = opportunity.line;
  return line === undefined || line === null || line === "" || !Number.isFinite(Number(line))
    ? market
    : `${market} ${line}`;
}

function formatChangeSection(newItems, lostItems) {
  const sections = [];
  if (newItems.length) {
    sections.push(`${newItems.length === 1 ? "🟢 **NEW OPPORTUNITY**" : "🟢 **NEW OPPORTUNITIES**"}\n${newItems.map(item => `- ${eventName(item)} — ${formatMarket(item)}`).join("\n")}`);
  }
  if (lostItems.length) {
    sections.push(`${lostItems.length === 1 ? "🔴 **LOST OPPORTUNITY**" : "🔴 **LOST OPPORTUNITIES**"}\n${lostItems.map(item => `- ${eventName(item)} — ${formatMarket(item)}`).join("\n")}`);
  }
  return sections.join("\n\n");
}

function formatOpportunity(opportunity, index) {
  const lines = [
    `**${index + 1}. ${eventName(opportunity)}**`,
    `Event ID: ${safeText(opportunity.eventID) || "Not provided"}`,
    `Start: ${safeText(opportunity.startTime) || "Not provided"}`,
    `Market: ${safeText(opportunity.marketType || opportunity.market) || "Not provided"}`
  ];
  if (opportunity.line !== undefined && opportunity.line !== null && Number.isFinite(Number(opportunity.line))) {
    lines.push(`Line: ${opportunity.line}`);
  }
  opportunity.legs.forEach((leg, legIndex) => {
    lines.push(
      `**Leg ${legIndex + 1} — ${String(leg.outcome).toUpperCase()}**`,
      `Bookmaker: ${leg.bookmaker}`,
      `Odds: ${Number(leg.odds)}`,
      `Stake: ${money(leg.stake)}`
    );
  });
  lines.push(
    `**Guaranteed Profit: ${money(opportunity.guaranteedProfit)}**`,
    `Event Key: ${opportunity.eventKey}`,
    `Market Key: ${opportunity.marketKey}`
  );
  return lines.join("\n");
}

function formatStatus(opportunities, totalProfit) {
  const header = [
    "📊 **THEORETICAL SIMULATION ARB SCANNER STATUS**",
    `**Active Opportunities: ${opportunities.length}**`,
    `**Total Guaranteed Profit: ${money(totalProfit) || "£0.00"}**`
  ].join("\n\n");
  const blocks = opportunities.map((opportunity, index) =>
    `${index ? "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" : ""}${formatOpportunity(opportunity, index)}`
  );
  return [header, ...blocks].concat(opportunities.length ? [] : ["No active arbitrage opportunities."]).join("\n\n");
}

function resetNotificationState() {
  previousOpportunities = new Map();
  deliveryQueue = Promise.resolve();
}

function processArbNotifs(opportunities, totalProfit) {
  const current = new Map();
  for (const opportunity of Array.isArray(opportunities) ? opportunities : []) {
    if (!isActionable(opportunity)) continue;
    const id = getOpportunityID(opportunity);
    // Canonical identifiers are expected to be unique; last occurrence wins if upstream violates this.
    current.set(id, JSON.parse(JSON.stringify(opportunity)));
  }
  const newItems = [...current.entries()].filter(([id]) => !previousOpportunities.has(id)).map(([, value]) => value);
  const lostItems = [...previousOpportunities.entries()].filter(([id]) => !current.has(id)).map(([, value]) => value);
  previousOpportunities = current;
  if (!newItems.length && !lostItems.length) {
    return Promise.resolve({ sent: false, reason: "no opportunity changes", activeCount: current.size });
  }

  const currentItems = [...current.values()];
  const summary = formatChangeSection(newItems, lostItems);
  const statusHeader = [
    "📊 **THEORETICAL SIMULATION ARB SCANNER STATUS**",
    `**Active Opportunities: ${currentItems.length}**`,
    `**Total Guaranteed Profit: ${money(totalProfit) || "£0.00"}**`
  ].join("\n\n");
  const blocks = currentItems.map((opportunity, index) => {
    const separator = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    return `${index ? separator : ""}${formatOpportunity(opportunity, index)}`;
  });
  const parts = splitReport(summary, statusHeader, blocks, "No active arbitrage opportunities.");
  const delivery = deliveryQueue.then(async () => {
    let deliveredParts = 0;
    for (const part of parts) {
      const result = await sendDiscordMessage(part);
      deliveredParts += result.deliveredParts || 0;
      if (!result.success) return { ...result, deliveredParts, totalParts: parts.length };
    }
    return { success: true, deliveredParts, totalParts: parts.length };
  });
  deliveryQueue = delivery.then(result => {
    if (!result.success) console.error("Discord arbitrage notification delivery failed:", result.error);
  }).catch(error => {
    console.error("Discord arbitrage notification delivery failed:", error.message);
  });
  // Keep the prior snapshot available for diagnostics if formatting unexpectedly fails.
  return delivery.then(result => ({ ...result, sent: true, activeCount: current.size }));
}

module.exports = {
  processArbNotifs,
  resetNotificationState,
  getOpportunityID,
  isActionable,
  formatStatus
};

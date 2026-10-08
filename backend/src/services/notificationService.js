const axios = require("axios");

const DISCORD_LIMIT = 2000;
const DEFAULT_TIMEOUT_MS = 8000;
const MAX_ATTEMPTS = 3;

function getWebhookUrl() {
  return process.env.DISCORD_WEBHOOK_URL;
}

function splitMessage(message, limit = DISCORD_LIMIT) {
  const lines = String(message || "").split("\n");
  const parts = [];
  let current = "";

  for (const line of lines) {
    if (line.length > limit) {
      if (current) parts.push(current);
      current = "";
      for (let offset = 0; offset < line.length; offset += limit) {
        parts.push(line.slice(offset, offset + limit));
      }
      continue;
    }
    const candidate = current ? `${current}\n${line}` : line;
    if (candidate.length > limit) {
      parts.push(current);
      current = line;
    } else {
      current = candidate;
    }
  }
  if (current) parts.push(current);
  return parts;
}

function splitReport(changeSummary, statusHeader, opportunityBlocks, emptyMessage, limit = DISCORD_LIMIT) {
  const parts = [];
  let current = changeSummary;
  const flush = () => {
    if (current) parts.push(current);
    current = "";
  };
  const appendBlock = block => {
    const candidate = current ? `${current}\n\n${block}` : block;
    if (candidate.length <= limit) {
      current = candidate;
      return;
    }
    if (current) flush();
    if (block.length <= limit) {
      current = block;
      return;
    }
    parts.push(...splitMessage(block, limit));
  };

  appendBlock(statusHeader);
  if (opportunityBlocks.length) opportunityBlocks.forEach(appendBlock);
  else appendBlock(emptyMessage);
  flush();
  return parts;
}

function retryDelay(error, attempt) {
  const retryAfter = Number(error.response?.headers?.["retry-after"]);
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return Math.min(retryAfter * 1000, 10000);
  }
  const bodyDelay = Number(error.response?.data?.retry_after);
  if (Number.isFinite(bodyDelay) && bodyDelay > 0) {
    return Math.min(bodyDelay * 1000, 10000);
  }
  return Math.min(500 * (2 ** (attempt - 1)), 2000);
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendDiscordMessage(message) {
  if (process.env.DISCORD_NOTIFICATIONS_ENABLED === "false") {
    return { success: false, disabled: true, deliveredParts: 0, totalParts: 0, error: "Discord notifications are disabled." };
  }
  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) {
    return { success: false, configured: false, deliveredParts: 0, totalParts: 0, error: "DISCORD_WEBHOOK_URL is not configured." };
  }

  const parts = splitMessage(message);
  let deliveredParts = 0;
  for (let index = 0; index < parts.length; index += 1) {
    let lastError;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        await axios.post(webhookUrl, { content: parts[index] }, { timeout: DEFAULT_TIMEOUT_MS });
        deliveredParts += 1;
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        const status = error.response?.status;
        const retryable = !status || status === 429 || status >= 500;
        if (!retryable || attempt === MAX_ATTEMPTS) break;
        await wait(retryDelay(error, attempt));
      }
    }
    if (lastError) {
      return {
        success: false,
        deliveredParts,
        totalParts: parts.length,
        error: `Discord delivery failed on part ${index + 1}/${parts.length} (${lastError.response?.status || lastError.code || "network error"}).`
      };
    }
  }
  return { success: true, deliveredParts, totalParts: parts.length };
}

module.exports = { sendDiscordMessage, splitMessage, splitReport };

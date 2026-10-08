// IN DEVELOPMENT: Persistent browser context lifecycle still needs production hardening.
const { chromium } = require("playwright");

const contexts = {};

async function getBrowserContext(bookmaker) {
    if (contexts[bookmaker]) {
        return contexts[bookmaker];
    }

    const profilePath = `src/automation/profiles/${bookmaker}`;

    const context = await chromium.launchPersistentContext(profilePath, {
        headless: process.env.HEADLESS === "true",
    });

    contexts[bookmaker] = context;

    return context;
}

async function closeBrowser(bookmaker) {
    if (!contexts[bookmaker]) {
        return;
    }

    await contexts[bookmaker].close();
    delete contexts[bookmaker];
}

async function closeAllBrowsers() {
    for (const bookmaker of Object.keys(contexts)) {
        await contexts[bookmaker].close();
    }

    Object.keys(contexts).forEach(bookmaker => delete contexts[bookmaker]);
}

module.exports = {
    getBrowserContext,
    closeBrowser,
    closeAllBrowsers
};

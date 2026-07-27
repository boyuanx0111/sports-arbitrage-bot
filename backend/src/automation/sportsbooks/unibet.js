const { chromium } = require("playwright");
const path = require("path");

const storageState = path.join(
    __dirname,
    "../sessions/storage/unibet.json"
);

async function launchUnibet() {

    const browser = await chromium.launch({
        headless: false
    });

    const context = await browser.newContext({
        storageState
    });

    const page = await context.newPage();

    await page.goto("https://www.unibet.co.uk");

    return {
        browser,
        context,
        page
    };
}

module.exports = {
    launchUnibet
};
const { chromium } = require("playwright");

async function launchUnibet() {
    const context = await chromium.launchPersistentContext(
        "src/automation/profiles/unibet",
        {
            headless: false
        }
    );

    let page = context.pages()[0];

    if (!page) {
        page = await context.newPage();
    }

    await page.goto("https://www.unibet.co.uk");

    return {
        context,
        page
    };
}

module.exports = {
    launchUnibet
};
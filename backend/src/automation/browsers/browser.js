//function to launch chrome using PLaywright
const { chromium } = require("playwright");

async function launchBrowser(storageState = undefined) {
    const browser = await chromium.launch({
        headless: false
    });

    const context = await browser.newContext({
        storageState
    });

    const page = await browser.newPage();

    return {
        browser,
        context,
        page
    };

}

module.exports = {
    launchBrowser
};
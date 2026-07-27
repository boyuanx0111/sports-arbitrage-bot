//test automation
const { chromium } = require("playwright");


async function test(){

const browser =
await chromium.launch({
    headless:false
});


const context =
await browser.newContext({
    storageState:
    "src/automation/sessions/storage/unibet.json"
});


const page =
await context.newPage();


await page.goto(
"https://www.unibet.co.uk"
);


await page.waitForTimeout(5000);


}


test();

// node src/automation/tests/unibet-test.js
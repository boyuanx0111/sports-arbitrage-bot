const { launchUnibet } = require("../sportsbooks/unibet");

async function test() {

    const { page } = await launchUnibet();

    await page.waitForTimeout(10000);

}

test();
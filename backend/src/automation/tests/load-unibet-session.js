const { launchUnibet } = require("../sportsbooks/unibet");

(async () => {

    const { browser } = await launchUnibet();

    console.log("Connected to Unibet");

    await new Promise(resolve => setTimeout(resolve, 10000));

    await browser.close();

})();
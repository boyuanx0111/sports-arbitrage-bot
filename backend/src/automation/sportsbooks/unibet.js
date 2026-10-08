// IN DEVELOPMENT: Unibet browser automation is a work in progress.
const { getBrowserContext } = require("../browsers/browserManager");
const unibetSelectors = require("../selectors/unibetSelector");

async function launchUnibet() {
    const context = await getBrowserContext("unibet");

    let page = context.pages()[0];

    if (!page) {
        page = await context.newPage();
    }

    await page.goto("https://www.unibet.co.uk/betting/odds");

    return {
        context,
        page
    };
}

async function search(page, searchTerm) {

    const url =
        `https://www.unibet.co.uk/betting/odds/results?query=${encodeURIComponent(searchTerm)}`;

    await page.goto(url);

}

async function selectEvent(page, event) {

    const eventLink = page
        .getByRole("link")
        .filter({
            hasText: event.homeTeam
        })
        .filter({
            hasText: event.awayTeam
        })
        .filter({
            hasText: event.time
        });


    await eventLink.click();

}

async function placeBet(opportunity) {
    const { page } = await launchUnibet();

    const event = {
        homeTeam: opportunity.homeTeam,
        awayTeam: opportunity.awayTeam,
        //time might not be same format !
        time: opportunity.startTime
    };

    await search(
        page,
        `${event.homeTeam}`
    );

    await selectEvent(
        page,
        event
    );
}

module.exports = {
    launchUnibet,
    search,
    selectEvent,
    placeBet
};
